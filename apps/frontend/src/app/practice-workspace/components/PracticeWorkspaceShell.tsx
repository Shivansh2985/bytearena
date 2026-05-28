'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import PracticeProblemPanel from './PracticeProblemPanel';
import CodeEditorPanel from '../../live-contest-workspace/components/CodeEditorPanel';
import OutputPanel from '../../live-contest-workspace/components/OutputPanel';
import { Problem, RunResult, Language } from '../../live-contest-workspace/components/WorkspaceShell';
import { ChevronLeft, Play, Send, History, FileText, CheckCircle2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import confetti from 'canvas-confetti';
import { Stopwatch } from './Stopwatch';
import { SubmissionsList } from './SubmissionsList';

const SNIPPETS: Record<Language, string> = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
  python: 'def solve():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    solve()\n',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n',
  javascript: 'function solve() {\n    // Write your code here\n}\n\nsolve();\n'
};
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function PracticeWorkspaceShell({ questionId }: { questionId: string }) {
  const { data: user } = useCurrentUser();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState(SNIPPETS['cpp']);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    setCode(SNIPPETS[language]);
  }, [language]);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await apiFetch(`/api/questions`);
        const data = await res.json();
        const q = data.find((x: any) => x.id === questionId);
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
        const response = await apiFetch(`/api/judge/job/${jobId}`);
        const res = await response.json();
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
        const response = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemId: problem.id,
          action: 'run'
        }),
      });
      const data = await response.json();

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
      const response = await apiFetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemId: problem.id,
          action: 'submit'
        }),
      });
      const data = await response.json();

      if (data.jobId) {
        pollJob(data.jobId, (res) => {
          setRunResult(res);
          setIsSubmitting(false);
          if (res.status === 'accepted') {
            setTimerRunning(false);
            triggerCelebration();
          }
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

  const triggerCelebration = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0EA5E9', '#38BDF8', '#7DD3FC']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0EA5E9', '#38BDF8', '#7DD3FC']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
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
          <Stopwatch 
            isRunning={timerRunning} 
            onStart={() => setTimerRunning(true)} 
            onStop={() => setTimerRunning(false)} 
            time={timeElapsed} 
          />
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
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Problem Statement / Submissions */}
          <Panel defaultSize={45} minSize={30} className="flex flex-col h-full bg-[#060608]">
            <div className="flex border-b border-border bg-[#0a0a0c] px-4 shrink-0">
              <button
                onClick={() => setActiveTab('problem')}
                className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'problem' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                <FileText size={14} /> Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-3 px-2 ml-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'submissions' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-white'
                }`}
              >
                <History size={14} /> Submissions
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'problem' ? (
                <PracticeProblemPanel problem={problem} />
              ) : (
                <SubmissionsList problemId={problem.id} />
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-border hover:bg-sky-500/50 transition-colors cursor-col-resize active:bg-sky-500" />

          {/* Right Panel: Editor & Output */}
          <Panel minSize={30} className="flex flex-col h-full bg-[#060608]">
            <PanelGroup direction="vertical">
              <Panel defaultSize={showOutput ? 60 : 100} minSize={20} className="relative">
                <CodeEditorPanel
                  code={code}
                  onChange={setCode}
                  language={language}
                  problem={problem}
                  cameraBlocked={false}
                  onToggleCamera={() => {}}
                />
              </Panel>

              {showOutput && runResult && (
                <>
                  <PanelResizeHandle className="h-1.5 bg-border hover:bg-sky-500/50 transition-colors cursor-row-resize active:bg-sky-500" />
                  <Panel minSize={20} className="bg-[#0a0a0c]">
                    <OutputPanel
                      result={runResult}
                      onClose={() => setShowOutput(false)}
                      problem={problem}
                    />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
