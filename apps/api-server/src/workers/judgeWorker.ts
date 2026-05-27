import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@bytearena/database';
import dotenv from 'dotenv';
import { logger } from '../services/observability/logger';

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Redis Connection
// ─────────────────────────────────────────────────────────────
import { getBullMQClient } from '../lib/redis';

const connection = getBullMQClient();

// ─────────────────────────────────────────────────────────────
// Judge0 Configuration
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────
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

  const output =
    safeString(result.stdout) ||
    safeString(result.compile_output) ||
    safeString(result.stderr) ||
    safeString(result.message) ||
    '';

  const error =
    safeString(result.stderr) ||
    safeString(result.compile_output) ||
    '';

  let execTimeMs = 0;

  if (result && result.time) {
    const parsed = parseFloat(result.time);

    if (!Number.isNaN(parsed)) {
      execTimeMs = Math.round(parsed * 1000);
    }
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

// ─────────────────────────────────────────────────────────────
// Judge0 Execution
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Judge0 Execution
// ─────────────────────────────────────────────────────────────
async function executeCode(
  code: string,
  languageKey: string,
  input = '',
  options: any = {}
) {
  const judge0Base =
    process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_URL;

  const rapidapiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY;
  const isRapidAPI = judge0Base.includes('rapidapi.com');
  const rapidapiHost = 'judge0-ce.p.rapidapi.com';

  const languageId = LANGUAGE_IDS[languageKey];
  if (!languageId) {
    throw new Error(`Unsupported language key "${languageKey}".`);
  }

  const waitForResult = !!options.waitForResult;
  const pollOptions = Object.assign(
    {},
    DEFAULT_POLL_OPTIONS,
    options.pollOptions || {}
  );

  // Fix Java class name issue for Judge0 which expects Main.java
  let codeToSubmit = code;
  if (languageKey.toLowerCase() === 'java') {
    codeToSubmit = codeToSubmit.replace(/public\s+class\s+\w+/g, 'public class Main');
    codeToSubmit = codeToSubmit.replace(/class\s+Solution/g, 'class Main');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isRapidAPI) {
    if (rapidapiKey) {
      headers['x-rapidapi-key'] = rapidapiKey;
    }
    headers['x-rapidapi-host'] = rapidapiHost;
  } else {
    if (rapidapiKey) {
      headers['X-Auth-Token'] = rapidapiKey;
    }
  }

  try {
    const submitUrl = `${judge0Base}/submissions${
      waitForResult
        ? '?base64_encoded=false&wait=true'
        : '?base64_encoded=false&wait=false'
    }`;

    // Add AbortController for a 60s request timeout (RapidAPI can be slow)
    const submitController = new AbortController();
    const submitTimeout = setTimeout(() => submitController.abort(), 60000);

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: codeToSubmit,
        language_id: languageId,
        stdin: input,
        cpu_time_limit: 2,
        memory_limit: 128000,
      }),
      signal: submitController.signal,
    });
    clearTimeout(submitTimeout);

    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      throw new Error(submitData.message || 'Error submitting code to Judge0');
    }

    if (waitForResult) {
      return normalizeResult(submitData);
    }

    const token = submitData.token;
    if (!token) {
      throw new Error('No submission token returned from Judge0.');
    }

    let attempts = 0;
    let delay = pollOptions.initialDelayMs;
    let lastResult = null;

    while (attempts < pollOptions.maxAttempts) {
      await sleep(delay);

      const statusController = new AbortController();
      const statusTimeout = setTimeout(() => statusController.abort(), 20000);

      const statusRes = await fetch(
        `${judge0Base}/submissions/${token}?base64_encoded=false&fields=*`,
        {
          headers,
          signal: statusController.signal,
        }
      );
      clearTimeout(statusTimeout);

      lastResult = await statusRes.json();

      if (
        lastResult &&
        lastResult.status &&
        lastResult.status.id > 2
      ) {
        break;
      }

      attempts++;
      delay = Math.min(
        30000,
        Math.floor(delay * pollOptions.backoffFactor)
      );
    }

    if (!lastResult) {
      throw new Error('No result from Judge0 after polling.');
    }

    return normalizeResult(lastResult);
  } catch (err: any) {
    console.error('Judge0 execution error:', err?.message || err);
    return {
      success: false,
      output: '',
      error: err?.message || 'Unknown error',
      status: 'service_error',
      statusDescription: err?.message || 'Unknown error',
      executionTime: 0,
      memory: 0,
      raw: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// BullMQ Worker
// ─────────────────────────────────────────────────────────────
export const judgeWorker = new Worker(
  'judgeQueue',
  async (job: Job) => {
    const {
      code,
      language,
      problemId,
      action,
      customInput,
      userId,
    } = job.data;

    const problem = await prisma.question.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    let testCasesToRun: any[] = [];

    if (action === 'run_custom') {
      testCasesToRun = [
        {
          input: customInput || '',
          expectedOutput: '',
          isHidden: false,
        },
      ];
    } else if (action === 'run') {
      testCasesToRun = problem.testCases.filter(
        (tc: any) => !tc.isHidden
      );
    } else {
      testCasesToRun = problem.testCases;
    }

    if (testCasesToRun.length === 0) {
      throw new Error('No test cases to run');
    }

    if (!LANGUAGE_IDS[language]) {
      throw new Error('Unsupported language');
    }

    let allPassed = true;
    let failedCase: any = null;
    let lastOutput = '';
    let maxTime = 0;
    let maxMemory = 0;
    let finalStatus = 'accepted';
    let finalError = '';
    const testcaseResults: any[] = [];

    for (const tc of testCasesToRun) {
      const result = await executeCode(
        code,
        language,
        tc.input,
        { waitForResult: true }
      );
      
      if (result.status === 'compilation_error') {
        finalStatus = 'compile_error';
        finalError = result.error || 'Compilation failed';
        allPassed = false;
        break;
      }
      
      if (result.status === 'service_error' || result.status === 'internal_error') {
        finalStatus = 'runtime_error';
        finalError = result.error || 'Judge execution service error';
        allPassed = false;
        break;
      }

      if (result.status === 'time_limit_exceeded') {
        finalStatus = 'tle';
        finalError = 'Time Limit Exceeded';
        lastOutput = result.output;
        allPassed = false;
        break;
      }

      if (result.status !== 'accepted' && result.status !== 'wrong_answer') {
        finalStatus = 'runtime_error';
        finalError = result.statusDescription || 'Process crashed';
        lastOutput = result.output;
        allPassed = false;
        break;
      }

      maxTime = Math.max(maxTime, result.executionTime);
      maxMemory = Math.max(maxMemory, result.memory);

      const output = result.output.trim();
      const expected = tc.expectedOutput.trim();
      lastOutput = output;

      const passed =
        action === 'run_custom'
          ? true
          : output === expected;

      testcaseResults.push({
        input: tc.input,
        expectedOutput: expected,
        output,
        passed,
      });

      if (!passed) {
        allPassed = false;
        finalStatus = 'wrong_answer';
        failedCase = {
          input: tc.input,
          expectedOutput: expected,
          output,
        };
        break;
      }
    }

    if (action === 'submit') {
      let dbStatus = 'WRONG_ANSWER';
      if (finalStatus === 'accepted') dbStatus = 'ACCEPTED';
      else if (finalStatus === 'compile_error') dbStatus = 'COMPILE_ERROR';
      else if (finalStatus === 'tle') dbStatus = 'TIME_LIMIT_EXCEEDED';
      else if (finalStatus === 'runtime_error') dbStatus = 'RUNTIME_ERROR';

      await prisma.submission.create({
        data: {
          userId,
          questionId: problemId,
          code,
          language,
          status: dbStatus as any,
          score: allPassed ? problem.points : 0,
          runtime: maxTime,
          memory: maxMemory,
        },
      });

      if (allPassed && problem.contestId) {
        const participant =
          await prisma.contestParticipant.findFirst({
            where: {
              userId,
              contestId: problem.contestId,
            },
          });

        if (participant) {
          await prisma.contestParticipant.update({
            where: { id: participant.id },
            data: {
              score: { increment: problem.points },
            },
          });
        } else {
          await prisma.contestParticipant.create({
            data: {
              userId,
              contestId: problem.contestId,
              score: problem.points,
            },
          });
        }
      }
    }

    if (finalStatus === 'accepted') {
      return {
        status: 'accepted',
        output:
          action === 'run'
            ? testcaseResults[0]?.output || lastOutput
            : `All ${testCasesToRun.length} test cases passed!`,
        expectedOutput:
          testCasesToRun[testCasesToRun.length - 1]?.expectedOutput || '',
        time: `${(maxTime / 1000).toFixed(2)}s`,
        memory: `${(maxMemory / 1024).toFixed(1)} MB`,
        testcaseResults,
      };
    }
    
    if (finalStatus === 'compile_error' || finalStatus === 'runtime_error' || finalStatus === 'tle') {
      return {
        status: finalStatus,
        output: lastOutput || finalError,
        error: finalError,
        testcaseResults,
      };
    }

    return {
      status: 'wrong_answer',
      output:
        testcaseResults[0]?.output || failedCase?.output || '',
      expectedOutput: failedCase?.expectedOutput || '',
      testcase: failedCase?.input || '',
      time: `${(maxTime / 1000).toFixed(2)}s`,
      memory: `${(maxMemory / 1024).toFixed(1)} MB`,
      testcaseResults,
    };
  },
  { 
    connection: connection as any,
    drainDelay: 15,
    stalledInterval: 60000,
    lockDuration: 120000,
    metrics: { maxDataPoints: 100 },
  }
);

// ─────────────────────────────────────────────────────────────
// BullMQ Worker Event Logs
// ─────────────────────────────────────────────────────────────
judgeWorker.on('ready', () => {
  console.log(`[Worker] Judge worker booted with PID ${process.pid}`);
  logger.info('worker_ready', { workerId: judgeWorker.id, pid: process.pid }, '✅ BullMQ worker started & ready for queue: judgeQueue');
});

judgeWorker.on('active', (job: Job) => {
  logger.info('job_active', { 
    workerId: judgeWorker.id,
    jobId: job.id,
    action: job.data.action,
    language: job.data.language,
    problemId: job.data.problemId
  }, `📥 Job received: ${job.id}`);
});

judgeWorker.on('completed', (job: Job, result: any) => {
  logger.info('job_completed', { 
    workerId: judgeWorker.id,
    jobId: job.id,
    status: result?.status 
  }, `✨ Job completed: ${job.id}`);
});

judgeWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error('job_failed', { 
    workerId: judgeWorker.id,
    jobId: job?.id,
    error: err.message
  }, `❌ Job failed: ${job?.id || 'unknown'}`);
});

logger.info('judge_worker_init', {}, '✅ Judge Worker initialized');