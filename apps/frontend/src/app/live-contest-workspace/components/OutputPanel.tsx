'use client';
import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Cpu, Terminal, Play, AlertTriangle } from 'lucide-react';
import type { RunResult, Problem } from './WorkspaceShell';
import Icon from '@/components/ui/AppIcon';


interface OutputPanelProps {
  result: RunResult;
  onClose: () => void;
  problem: Problem;
  onRunCustom?: (input: string) => void;
}

type OutputTab = 'testcase' | 'result' | 'custom';

function parseErrorString(errString: string, status: string) {
  if (status === 'tle') return { title: 'Time Limit Exceeded (Infinite Loop)', description: 'Your code took too long to execute. This is usually caused by an infinite loop (e.g. while(true)) or an inefficient algorithm (e.g. O(N^2) instead of O(N)).' };
  
  const lowerErr = errString.toLowerCase();
  
  if (status === 'compile_error') {
      if (lowerErr.includes('error: expected') || lowerErr.includes('syntaxerror') || lowerErr.includes('missing')) 
          return { title: 'Syntax Error (Missing Characters)', description: 'You have a missing character (like a bracket, brace, comma, or semicolon) or invalid syntax in your code.' };
      if (lowerErr.includes('was not declared') || lowerErr.includes('not defined') || lowerErr.includes('cannot resolve symbol')) 
          return { title: 'Undeclared Variable or Missing Library', description: "You are using a variable or function that hasn't been declared. Did you misspell it or forget to import a library (e.g., #include <vector>)?" };
      if (lowerErr.includes('no matching function') || lowerErr.includes('typeerror')) 
          return { title: 'Type Mismatch / Invalid Function Call', description: 'You are passing the wrong types of arguments to a function, or attempting an invalid operation on a data type.' };
      return { title: 'Compilation Error', description: 'Your code failed to compile. Check the raw error log below for details.' };
  }
  
  if (status === 'runtime_error') {
      if (lowerErr.includes('out of bounds') || lowerErr.includes('out_of_range') || lowerErr.includes('indexerror') || lowerErr.includes('arrayindexoutofbounds')) 
          return { title: 'Index Out of Bounds', description: 'Your code tried to access an array or vector index that does not exist.' };
      if (lowerErr.includes('segmentation fault') || lowerErr.includes('sigsegv')) 
          return { title: 'Segmentation Fault (SIGSEGV)', description: 'Your code crashed due to invalid memory access. This often happens with out-of-bounds array access, infinite recursion, or null pointer dereferencing.' };
      if (lowerErr.includes('memoryerror') || lowerErr.includes('heap out of memory') || lowerErr.includes('std::bad_alloc')) 
          return { title: 'Memory Limit Exceeded', description: 'Your code used too much memory. Check for infinite recursion or massive array allocations.' };
      if (lowerErr.includes('division by zero') || lowerErr.includes('arithmeticexception')) 
          return { title: 'Division by Zero', description: 'Your code attempted to divide a number by zero.' };
      return { title: 'Runtime Error', description: 'Your code crashed during execution. Check the raw error log below.' };
  }
  
  return { title: 'Error', description: 'An unexpected error occurred.' };
}

export default function OutputPanel({ result, onClose, problem, onRunCustom }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>('result');
  const [customInput, setCustomInput] = useState(problem.examples[0]?.input ?? '');

  React.useEffect(() => {
    setCustomInput(problem.examples[0]?.input ?? '');
  }, [problem]);

  React.useEffect(() => {
    if (result && !result.error && result.status !== 'compile_error' && result.status !== 'runtime_error' && result.status !== 'tle') {
      setActiveTab('testcase');
    } else {
      setActiveTab('result');
    }
  }, [result]);

  const statusConfig = {
    running: { label: 'Running...', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: null },
    accepted: { label: 'Accepted', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
    wrong_answer: { label: 'Wrong Answer', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
    tle: { label: 'Time Limit Exceeded', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
    runtime_error: { label: 'Runtime Error', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
    compile_error: { label: 'Compilation Error', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  };

  const cfg = result.status && result.status !== 'running' ? statusConfig[result.status] : null;

  return (
    <div className="h-full flex flex-col bg-[#070710] border-t border-border">
      {/* Output header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1">
          {([
            { id: 'testcase', label: 'Test Cases', icon: Play },
            { id: 'result', label: 'Output', icon: Terminal },
            { id: 'custom', label: 'Custom Input', icon: Terminal },
          ] as { id: OutputTab; label: string; icon: React.ElementType }[]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={`otab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-purple-300 border border-primary/20' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {result.time && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={11} />
              <span className="metric-value">{result.time}</span>
            </div>
          )}
          {result.memory && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu size={11} />
              <span className="metric-value">{result.memory}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Close output panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Output content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Status banner */}
        {result.status && result.status !== 'running' && cfg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 ${cfg.bg} ${cfg.border}`}>
            {cfg.icon && <cfg.icon size={14} className={cfg.color} />}
            <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
            {result.status === 'accepted' && (
              <span className="ml-auto text-xs text-emerald-400 metric-value">+{problem.points} pts</span>
            )}
          </div>
        )}

        {result.status === 'running' && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
            <div className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
            <span className="text-sm text-amber-300">Judging your solution...</span>
          </div>
        )}

        {activeTab === 'result' && result.status && result.status !== 'running' && (
          <div className="space-y-3">
            {result.testcase && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Input:</p>
                <pre className="code-panel p-3 text-xs text-cyan-300 overflow-x-auto rounded-lg whitespace-pre-wrap">
                  {result.testcase}
                </pre>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Your Output:</p>
              <pre className={`code-panel p-3 text-xs overflow-x-auto rounded-lg whitespace-pre-wrap ${
                result.status === 'accepted' ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {result.output || '(no output)'}
              </pre>
            </div>

            {result.expectedOutput && result.status !== 'accepted' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Expected Output:</p>
                <pre className="code-panel p-3 text-xs text-emerald-300 overflow-x-auto rounded-lg whitespace-pre-wrap">
                  {result.expectedOutput}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Error Details:</p>
                
                {(() => {
                   const parsed = parseErrorString(result.error, result.status || '');
                   return (
                     <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                       <h4 className="text-red-300 text-sm font-bold flex items-center gap-2 mb-1">
                         <AlertTriangle size={14} /> {parsed.title}
                       </h4>
                       <p className="text-red-300/80 text-xs leading-relaxed">{parsed.description}</p>
                     </div>
                   );
                })()}

                <pre className="code-panel p-3 text-xs text-red-300 overflow-x-auto rounded-lg whitespace-pre-wrap">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'testcase' && (
          <div className="space-y-3">
            {problem.examples.map((ex, i) => {
              const tcRes = result.testcaseResults?.[i];
              const passed = tcRes?.passed;
              const hasRun = tcRes !== undefined;

              return (
              <div key={`ex-out-${problem.id}-${i}`} className={`border ${passed === false ? 'border-red-500/30' : 'border-border'} rounded-lg overflow-hidden`}>
                <div className={`flex items-center justify-between px-3 py-2 ${passed === false ? 'bg-red-500/10' : 'bg-muted/20'} border-b border-border`}>
                  <span className="text-xs font-medium text-muted-foreground">Sample Test {i + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    hasRun
                      ? (passed ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-red-500/15 text-red-300 border border-red-500/25')
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {hasRun ? (passed ? '✓ Passed' : '✗ Failed') : 'Not run'}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Input</p>
                    <pre className="code-panel p-2 text-xs text-cyan-300 rounded overflow-x-auto whitespace-pre-wrap">{ex.input}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected</p>
                    <pre className="code-panel p-2 text-xs text-emerald-300 rounded overflow-x-auto whitespace-pre-wrap">{ex.output}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Output</p>
                    <pre className={`code-panel p-2 text-xs ${hasRun ? (passed ? 'text-emerald-300' : 'text-red-300') : 'text-muted-foreground'} rounded overflow-x-auto whitespace-pre-wrap`}>{hasRun ? tcRes.output || '(empty)' : '(not run)'}</pre>
                  </div>
                </div>
              </div>
            )})}
            <p className="text-xs text-muted-foreground text-center py-2">
              Hidden test cases are evaluated upon submission.
            </p>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1.5">Custom Input</label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full h-28 bg-input border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                placeholder="Enter custom test input..."
              />
            </div>
            <button 
              onClick={() => {
                if (onRunCustom) onRunCustom(customInput);
                setActiveTab('result');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-all duration-150 active:scale-95"
            >
              <Play size={12} />
              Run with Custom Input
            </button>
          </div>
        )}
      </div>
    </div>
  );
}