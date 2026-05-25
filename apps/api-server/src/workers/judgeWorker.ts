import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@bytearena/database';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const DEFAULT_JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';

const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,
  java: 62,
  python: 92,
  javascript: 93,
};

const DEFAULT_POLL_OPTIONS = {
  maxAttempts: 20,
  initialDelayMs: 1000,
  backoffFactor: 1.3,
};

function safeString(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') return String(v);
  return v;
}

function getStatusFromJudge0(statusId: number): string {
  const statusMap: Record<number, string> = {
    1: 'in_queue',
    2: 'processing',
    3: 'accepted',
    4: 'wrong_answer',
    5: 'time_limit_exceeded',
    6: 'compilation_error',
    7: 'runtime_error',
    8: 'memory_limit_exceeded',
    9: 'internal_error',
    10: 'exec_format_error',
  };
  return statusMap[statusId] || 'unknown';
}

function normalizeResult(result: any) {
  const statusId = result?.status?.id ?? 0;
  const mappedStatus = getStatusFromJudge0(statusId);

  const output = safeString(result.stdout)
    || safeString(result.compile_output)
    || safeString(result.stderr)
    || safeString(result.message)
    || '';

  const error = safeString(result.stderr) || safeString(result.compile_output) || '';

  let execTimeMs = 0;
  if (result && result.time) {
    const parsed = parseFloat(result.time);
    if (!Number.isNaN(parsed)) execTimeMs = Math.round(parsed * 1000);
  }

  return {
    success: mappedStatus === 'accepted',
    output,
    error,
    status: mappedStatus,
    statusDescription: result?.status?.description ?? '',
    executionTime: execTimeMs,
    memory: result?.memory ?? 0,
    raw: result,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeCode(code: string, languageKey: string, input = '', options: any = {}) {
  const judge0Base = process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_URL;
  const rapidapiKey = process.env.JUDGE0_API_KEY;
  const rapidapiHost = 'judge0-ce.p.rapidapi.com';

  if (!rapidapiKey) {
    throw new Error('JUDGE0_API_KEY is not set in environment variables.');
  }

  const languageId = LANGUAGE_IDS[languageKey];
  if (!languageId) {
    throw new Error(`Unsupported language key "${languageKey}".`);
  }

  const waitForResult = !!options.waitForResult;
  const pollOptions = Object.assign({}, DEFAULT_POLL_OPTIONS, options.pollOptions || {});

  try {
    const submitUrl = `${judge0Base}/submissions${waitForResult ? '?base64_encoded=false&wait=true' : '?base64_encoded=false&wait=false'}`;
    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': rapidapiKey,
        'x-rapidapi-host': rapidapiHost,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
        cpu_time_limit: 2,
        memory_limit: 128000,
      })
    });

    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      throw new Error(submitData.message || 'Error submitting code to Judge0');
    }

    if (waitForResult) {
      return normalizeResult(submitData);
    }

    const token = submitData.token;
    if (!token) throw new Error('No submission token returned from Judge0.');

    let attempts = 0;
    let delay = pollOptions.initialDelayMs;
    let lastResult = null;

    while (attempts < pollOptions.maxAttempts) {
      await sleep(delay);
      const statusRes = await fetch(
        `${judge0Base}/submissions/${token}?base64_encoded=false&fields=*`,
        { headers: { 'x-rapidapi-key': rapidapiKey, 'x-rapidapi-host': rapidapiHost } }
      );
      lastResult = await statusRes.json();
      if (lastResult && lastResult.status && lastResult.status.id > 2) break;
      attempts++;
      delay = Math.min(30_000, Math.floor(delay * pollOptions.backoffFactor));
    }
    if (!lastResult) throw new Error('No result from Judge0 after polling.');
    return normalizeResult(lastResult);
  } catch (err: any) {
    console.error('Judge0 execution error:', err?.message || err);
    return {
      success: false, output: '', error: err?.message || 'Unknown error',
      status: 'service_error', statusDescription: err?.message || 'Unknown error',
      executionTime: 0, memory: 0, raw: null,
    };
  }
}

export const judgeWorker = new Worker('judgeQueue', async (job: Job) => {
  const { code, language, problemId, action, customInput, userId } = job.data;
  
  const problem = await prisma.question.findUnique({
    where: { id: problemId },
    include: { testCases: true },
  });

  if (!problem) throw new Error('Problem not found');

  let testCasesToRun: any[] = [];
  if (action === 'run_custom') {
    testCasesToRun = [{ input: customInput || '', expectedOutput: '', isHidden: false }];
  } else if (action === 'run') {
    testCasesToRun = problem.testCases.filter(tc => !tc.isHidden);
  } else {
    testCasesToRun = problem.testCases;
  }

  if (testCasesToRun.length === 0) throw new Error('No test cases to run');
  if (!LANGUAGE_IDS[language]) throw new Error('Unsupported language');

  let allPassed = true;
  let failedCase: any = null;
  let lastOutput = '';
  let maxTime = 0;
  let maxMemory = 0;
  const testcaseResults: any[] = [];

  for (const tc of testCasesToRun) {
    const result = await executeCode(code, language, tc.input, { waitForResult: true });

    if (result.status === 'compilation_error') {
      return { status: 'compile_error', output: result.error, error: 'Compilation failed' };
    }
    if (result.status === 'service_error' || result.status === 'internal_error') {
      return { status: 'runtime_error', output: result.error, error: 'Judge execution service error' };
    }
    if (result.status === 'time_limit_exceeded') {
      return { status: 'tle', output: result.output, error: 'Time Limit Exceeded' };
    }
    if (result.status !== 'accepted' && result.status !== 'wrong_answer') {
      return { status: 'runtime_error', output: result.output || 'Process crashed', error: result.statusDescription };
    }

    maxTime = Math.max(maxTime, result.executionTime);
    maxMemory = Math.max(maxMemory, result.memory);

    const output = result.output.trim();
    const expected = tc.expectedOutput.trim();
    lastOutput = output;

    const passed = action === 'run_custom' ? true : (output === expected);

    testcaseResults.push({ input: tc.input, expectedOutput: expected, output, passed });

    if (!passed) {
      allPassed = false;
      failedCase = { input: tc.input, expectedOutput: expected, output };
      break;
    }
  }

  if (action === 'submit') {
    await prisma.submission.create({
      data: {
        userId,
        questionId: problemId,
        code,
        language,
        status: allPassed ? 'ACCEPTED' : 'WRONG_ANSWER',
        score: allPassed ? problem.points : 0,
        runtime: maxTime,
        memory: maxMemory,
      }
    });

    if (allPassed && problem.contestId) {
      const participant = await prisma.contestParticipant.findFirst({
        where: { userId, contestId: problem.contestId }
      });
      if (participant) {
        await prisma.contestParticipant.update({
          where: { id: participant.id },
          data: { score: { increment: problem.points } }
        });
      } else {
        await prisma.contestParticipant.create({
          data: { userId, contestId: problem.contestId, score: problem.points }
        });
      }
    }
  }

  if (allPassed) {
    return {
      status: 'accepted',
      output: action === 'run' ? testcaseResults[0]?.output || lastOutput : `All ${testCasesToRun.length} test cases passed!`,
      expectedOutput: testCasesToRun[testCasesToRun.length - 1].expectedOutput,
      time: `${(maxTime / 1000).toFixed(2)}s`,
      memory: `${(maxMemory / 1024).toFixed(1)} MB`,
      testcaseResults
    };
  } else {
    return {
      status: 'wrong_answer',
      output: testcaseResults[0]?.output || failedCase?.output || '',
      expectedOutput: failedCase?.expectedOutput || '',
      testcase: failedCase?.input || '',
      time: `${(maxTime / 1000).toFixed(2)}s`,
      memory: `${(maxMemory / 1024).toFixed(1)} MB`,
      testcaseResults
    };
  }
}, { connection });

console.log('Judge Worker initialized');
