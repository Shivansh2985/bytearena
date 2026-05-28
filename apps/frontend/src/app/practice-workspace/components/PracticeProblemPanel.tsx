import React, { useState } from 'react';
import { Tag, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Problem } from '../../live-contest-workspace/components/WorkspaceShell';

export default function PracticeProblemPanel({ problem }: { problem: Problem }) {
  const [openHints, setOpenHints] = useState<{ [key: number]: boolean }>({});

  const toggleHint = (index: number) => {
    setOpenHints(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card-elevated shrink-0">
        <h2 className="text-lg font-bold text-foreground">
          {problem.title}
        </h2>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            problem.difficulty === 'Easy' || problem.difficulty === ('EASY' as any) ? 'text-emerald-400 bg-emerald-500/10' :
            problem.difficulty === 'Medium' || problem.difficulty === ('MEDIUM' as any) ? 'text-amber-400 bg-amber-500/10' :
            'text-red-400 bg-red-500/10'
          }`}>
            {problem.difficulty}
          </span>
          <span className="text-sm font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md">
            {problem.points} pts
          </span>
          {(problem.timeLimit || problem.memoryLimit) && (
            <div className="flex items-center gap-2 bg-muted/20 border border-border/50 rounded-md px-2.5 py-1">
              {problem.timeLimit && (
                <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {problem.timeLimit}s
                </span>
              )}
              {problem.timeLimit && problem.memoryLimit && <span className="text-muted-foreground/30 text-[10px]">|</span>}
              {problem.memoryLimit && (
                <span className="text-xs font-medium text-sky-300 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                  {problem.memoryLimit}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {problem.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Problem Statement */}
        <div className="prose prose-invert max-w-none text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {problem.statement}
        </div>

        {/* Input / Output Formats */}
        {(problem.inputFormat || problem.outputFormat) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {problem.inputFormat && (
              <div className="bg-muted/10 border border-border/50 rounded-lg p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg> Input Format</h3>
                <div className="text-[13px] text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">{problem.inputFormat}</div>
              </div>
            )}
            {problem.outputFormat && (
              <div className="bg-muted/10 border border-border/50 rounded-lg p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 12 15 15"/></svg> Output Format</h3>
                <div className="text-[13px] text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">{problem.outputFormat}</div>
              </div>
            )}
          </div>
        )}

        {/* Constraints */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-3">Constraints</h3>
          <ul className="list-none space-y-1.5">
            {Array.isArray(problem.constraints) ? (
              problem.constraints.map((constraint, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground font-mono">
                  <span className="text-sky-500 mt-0.5">•</span>
                  <span>{constraint}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                <span className="text-sky-500 mt-0.5">•</span>
                <span>{problem.constraints}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Examples */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground">Examples</h3>
          {problem.examples?.map((ex, idx) => (
            <div key={idx} className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Input</span>
                <pre className="font-mono text-sm text-sky-200 bg-sky-950/30 p-2.5 rounded-lg border border-sky-500/10 whitespace-pre-wrap">{ex.input}</pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Output</span>
                <pre className="font-mono text-sm text-emerald-200 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/10 whitespace-pre-wrap">{ex.output}</pre>
              </div>
              {ex.explanation && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Explanation</span>
                  <p className="text-sm text-muted-foreground">{ex.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="pt-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              Hints
            </h3>
            {problem.hints.map((hint, idx) => (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-muted/10">
                <button
                  onClick={() => toggleHint(idx)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">Hint {idx + 1}</span>
                  </span>
                  {openHints[idx] ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>
                {openHints[idx] && (
                  <div className="p-3 pt-0 text-sm text-muted-foreground border-t border-border/50 bg-muted/20 whitespace-pre-wrap">
                    {hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}