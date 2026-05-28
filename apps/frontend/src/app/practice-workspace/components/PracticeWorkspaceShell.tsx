'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import PracticeProblemPanel from './PracticeProblemPanel';
import CodeEditorPanel from '../../live-contest-workspace/components/CodeEditorPanel';
import OutputPanel from '../../live-contest-workspace/components/OutputPanel';
import { Problem, RunResult, Language } from '../../live-contest-workspace/components/WorkspaceShell';
import { ChevronLeft, Play, Send } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function PracticeWorkspaceShell({ questionId }: { questionId: string }) {
  const { data: user } = useCurrentUser();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('// Write your code here\n');
  const [language, setLanguage] = useState<Language>('cpp');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await apiFetch(`/api/questions`);
        const q = res.find((x: any) => x.id === questionId);
        if (q) {
          setProblem({
            id: q.id,
            index: 1,
            title: q.title,
            difficulty: q.difficulty,
            points: q.points,
            status: 'unattempted',
            timeLimit: q.timeLimit + 's',
            memoryLimit: '256MB',
            tags: q.tags || [],
            statement: q.problemStatement,
            inputFormat: q.inputFormat,
            outputFormat: q.outputFormat,
            constraints: q.constraints,
            hints: q.hints || [],
            examples: q.testCases?.map((tc: any) => ({
              input: tc.input,
              output: tc.expectedOutput,
              explanation: tc.explanation
            })) || []
          });
        }
      } catch (err) {
        console.error('Failed to load problem:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [questionId]);

  const pollJob = async (jobId: string, onUpdate: (result: any) => void) => {
    let attempts = 0;
    while (attempts < 60) { // 1 min timeout
      await new Promise(r => setTimeout(r, 1000));
      try {
        const res = await apiFetch(`/api/judge/job/${jobId}`);
        if (res.jobStatus === 'completed') {
          onUpdate(res.result);
          return;
        }
        if (res.jobStatus === 'failed') {
          onUpdate({ status: 'runtime_error', output: res.error || 'Execution failed' });
          return;
        }
      } catch (err) {
        onUpdate({ status: 'runtime_error', output: 'Failed to poll judge status' });
        return;
      }
      attempts++;
    }
    onUpdate({ status: 'runtime_error', output: 'Request timed out' });
  };

  const handleRun = async () => {
    if (!problem) return;
    setIsRunning(true);
    setShowOutput(true);
    setRunResult({ status: 'running', output: 'Running sample test cases...' });

    try {
      const data = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemId: problem.id,
          action: 'run'
        }),
      });

      if (data.jobId) {
        pollJob(data.jobId, (res) => {
          setRunResult(res);
          setIsRunning(false);
        });
      } else {
        setRunResult({ status: 'runtime_error', output: data.error || 'Unknown error' });
        setIsRunning(false);
      }
    } catch (error: any) {
      setRunResult({
        status: 'runtime_error',
        output: error.message || 'Failed to run code',
        error: 'Execution failed due to network or server error.'
      });
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !user) {
      alert("You must be logged in to submit.");
      return;
    }
    setIsSubmitting(true);
    setShowOutput(true);
    setRunResult({ status: 'running', output: 'Running all test cases (including hidden)...' });

    try {
      const data = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemId: problem.id,
          action: 'submit'
        }),
      });

      if (data.jobId) {
        pollJob(data.jobId, (res) => {
          setRunResult(res);
          setIsSubmitting(false);
        });
      } else {
        setRunResult({ status: 'runtime_error', output: data.error || 'Unknown error' });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setRunResult({
        status: 'runtime_error',
        output: error.message || 'Failed to submit code',
        error: 'Execution failed due to network or server error.'
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#020204] flex items-center justify-center text-white">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="min-h-screen bg-[#020204] flex items-center justify-center text-white">Problem not found.</div>;
  }

  return (
    <div className="h-screen w-full bg-[#020204] flex flex-col overflow-hidden text-slate-300 font-sans">
      {/* Top Bar */}
      <div className="h-14 bg-[#0a0a0c] border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/practice" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ChevronLeft size={16} /> Back to Practice
          </Link>
          <div className="w-px h-6 bg-border" />
          <h1 className="text-sm font-semibold text-white truncate max-w-xs">{problem.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-[#121216] border border-border text-sm text-white rounded-lg px-3 py-1.5 outline-none hover:border-border-hover transition-colors"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Play size={14} className={isRunning ? 'animate-pulse' : ''} />
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50"
          >
            <Send size={14} />
            Submit
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Statement */}
        <div className="w-[45%] border-r border-border flex flex-col h-full bg-[#060608]">
          <PracticeProblemPanel problem={problem} />
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#060608]">
          <div className={`flex-1 min-h-0 relative ${showOutput ? 'h-[60%]' : 'h-full'}`}>
            <CodeEditorPanel
              code={code}
              onChange={setCode}
              language={language}
              problem={problem}
              cameraBlocked={false}
              onToggleCamera={() => {}}
            />
          </div>

          {/* Output Panel */}
          {showOutput && runResult && (
            <div className="h-[40%] border-t border-border shrink-0 bg-[#0a0a0c]">
              <OutputPanel
                result={runResult}
                onClose={() => setShowOutput(false)}
                problem={problem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
