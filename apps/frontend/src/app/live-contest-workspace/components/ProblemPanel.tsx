'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, MessageSquare, Tag, Activity } from 'lucide-react';
import type { Language, Problem } from './WorkspaceShell';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/AppIcon';


interface ProblemPanelProps {
  problem: Problem;
  onNext: () => void;
  onPrev: () => void;
  totalProblems: number;
  isCompleted?: boolean;
  submissions?: any[];
  onViewCode?: (code: string, language: Language, userName: string, isCorrect: boolean) => void;
}

type Tab = 'problem' | 'editorial' | 'notes' | 'submissions';

export default function ProblemPanel({
  problem,
  onNext,
  onPrev,
  totalProblems,
  isCompleted = false,
  submissions = [],
  onViewCode
}: ProblemPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('problem');
  const [notes, setNotes] = useState('');

  const problemSubmissions = submissions.filter((s: any) => s.questionId === problem.id);

  const tabsList: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'problem', label: 'Problem', icon: BookOpen },
    { id: 'editorial', label: 'Editorial', icon: Lightbulb },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  if (isCompleted) {
    tabsList.push({ id: 'submissions', label: 'Submissions', icon: Activity });
  }

  return (
    <div className="h-full flex flex-col bg-secondary/30 border-r border-border">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-muted-foreground">Q{problem.index}</span>
          <h2 className="text-sm font-semibold text-foreground truncate">{problem.title}</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrev}
            disabled={problem.index === 1}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous problem"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={onNext}
            disabled={problem.index === totalProblems}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next problem"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabsList.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`ptab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'problem' && (
          <div className="p-4 space-y-5">
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                {problem.difficulty}
              </Badge>
              <span className="text-xs bg-primary/10 text-purple-300 border border-primary/20 rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1.5">
                {problem.points} pts
              </span>
              {(problem.timeLimit || problem.memoryLimit) && (
                <div className="flex items-center gap-2 bg-muted/20 border border-border/50 rounded-full px-2.5 py-0.5">
                  {problem.timeLimit && (
                    <span className="text-[11px] font-medium text-amber-300 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {problem.timeLimit}s
                    </span>
                  )}
                  {problem.timeLimit && problem.memoryLimit && <span className="text-muted-foreground/30 text-[10px]">|</span>}
                  {problem.memoryLimit && (
                    <span className="text-[11px] font-medium text-sky-300 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                      {problem.memoryLimit}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              <Tag size={11} className="text-muted-foreground mt-0.5" />
              {problem.tags.map((tag) => (
                <span key={`prob-tag-${problem.id}-${tag}`} className="problem-tag">{tag}</span>
              ))}
            </div>

            {/* Statement */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Problem Statement</h3>
              <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line prose-invert">
                {problem.statement.replace(/\*\*(.*?)\*\*/g, '$1')}
              </div>
            </div>

            {/* Input / Output Formats */}
            {(problem.inputFormat || problem.outputFormat) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Constraints</h3>
              <ul className="space-y-1">
                {problem.constraints.map((c) => (
                  <li key={`constraint-${problem.id}-${c}`} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <code className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded text-cyan-300">{c}</code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Examples</h3>
              <div className="space-y-4">
                {problem.examples.map((ex, i) => (
                  <div key={`example-${problem.id}-${i}`} className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/30 px-3 py-1.5 border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground">Example {i + 1}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Input:</p>
                        <pre className="code-panel p-2.5 text-xs text-cyan-300 overflow-x-auto rounded-lg">
                          {ex.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Output:</p>
                        <pre className="code-panel p-2.5 text-xs text-emerald-300 overflow-x-auto rounded-lg">
                          {ex.output}
                        </pre>
                      </div>
                      {ex.explanation && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Explanation:</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{ex.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
              <Lightbulb size={14} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-200">Editorial unlocks after contest ends or you solve the problem.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Approach Hint</h3>
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Think about sorting the edges and processing them greedily. Which data structure helps you efficiently check if two nodes are already connected?
                </p>
              </div>

              <h3 className="text-sm font-semibold text-foreground">Complexity</h3>
              <div className="flex gap-3">
                <div className="flex-1 bg-muted/20 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <code className="text-sm font-mono text-cyan-300">O(M log M)</code>
                </div>
                <div className="flex-1 bg-muted/20 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Space</p>
                  <code className="text-sm font-mono text-cyan-300">O(N)</code>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-foreground">Key Insight</h3>
              <p className="text-xs text-foreground/75 leading-relaxed">
                Kruskal's algorithm with Union-Find (DSU) with path compression and union by rank achieves near-linear time complexity. Sort edges by weight, then greedily add the smallest edge that doesn't form a cycle.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal Notes</h3>
              <span className="text-xs text-muted-foreground">{notes.length} chars</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down your approach, edge cases, or ideas here..."
              className="flex-1 w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none font-mono leading-relaxed"
              style={{ minHeight: '200px' }}
            />
            <p className="text-xs text-muted-foreground mt-2">Notes are saved locally and not submitted.</p>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Participant Submissions</h3>
            {problemSubmissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No submissions found for this question yet.</p>
            ) : (
              <div className="space-y-2">
                {problemSubmissions.map((s: any) => {
                  const isCorrect = s.status.toLowerCase() === 'accepted';
                  return (
                    <div key={s.id} className="bg-card-elevated border border-border rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{s.user?.name || s.user?.username || 'Anonymous'}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isCorrect 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
                        <span className="text-[10px] uppercase text-muted-foreground font-mono">{s.language}</span>
                        {onViewCode && (
                          <button
                            onClick={() => onViewCode(s.code, s.language, s.user?.name || s.user?.username || 'User', isCorrect)}
                            className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            View Code
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}