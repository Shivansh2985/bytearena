'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Save, ArrowLeft, Trash2, Plus, Download, X } from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
}

interface Question {
  id: string;
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  timeLimit?: number;
  hints?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  testCases: TestCase[];
  expanded?: boolean;
}

export default function CreateContestPage() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', inputFormat: '', outputFormat: '', constraints: '', timeLimit: 2.0, hints: [], difficulty: 'Easy', points: 200, testCases: [{ id: 'tc1', input: '[2,7,11,15]\n9', output: '[0,1]', isHidden: false }], expanded: true },
  ]);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState(3);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDbQuestions = async () => {
    setIsLoadingQuestions(true);
    setShowImportModal(true);
    try {
      const res = await apiFetch('/api/questions?admin=true');
      if (res.ok) {
        const data = await res.json();
        setDbQuestions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const importQuestion = (dbQ: any) => {
    setQuestions((prev) => [...prev, {
      id: `q${Date.now()}_${Math.random()}`,
      title: dbQ.title,
      description: dbQ.problemStatement,
      inputFormat: dbQ.inputFormat,
      outputFormat: dbQ.outputFormat,
      constraints: dbQ.constraints,
      timeLimit: dbQ.timeLimit || 2.0,
      hints: dbQ.hints || [],
      difficulty: dbQ.difficulty === 'EASY' ? 'Easy' : dbQ.difficulty === 'HARD' ? 'Hard' : 'Medium',
      points: dbQ.points || 100,
      testCases: (dbQ.testCases || []).map((tc: any) => ({
        id: `tc${Date.now()}_${Math.random()}`,
        input: tc.input,
        output: tc.expectedOutput,
        isHidden: tc.isHidden
      })),
      expanded: true
    }]);
    setShowImportModal(false);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, {
      id: `q${Date.now()}`,
      title: `Question ${prev.length + 1}`,
      description: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      timeLimit: 2.0,
      hints: [],
      difficulty: 'Medium',
      points: 400,
      testCases: [{ id: `tc${Date.now()}`, input: '', output: '', isHidden: false }],
      expanded: true
    }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCreateContest = async () => {
    setIsSubmitting(true);
    try {
      const start = startTime ? new Date(startTime) : new Date();
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

      const res = await apiFetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'New Contest',
          description: description || '',
          difficulty: difficulty.toUpperCase(),
          status: 'UPCOMING',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          tags: tags ? tags.split(',').map((t) => t.trim()) : [],
          questions: questions.map(q => ({
            title: q.title,
            description: q.description,
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            constraints: q.constraints || '',
            timeLimit: q.timeLimit || 2.0,
            hints: q.hints || [],
            difficulty: q.difficulty.toUpperCase(),
            points: q.points,
            testCases: q.testCases.map(tc => ({
              input: tc.input,
              expectedOutput: tc.output,
              isHidden: tc.isHidden,
              isSample: !tc.isHidden
            }))
          }))
        }),
      });

      if (res.ok) {
        window.location.href = '/admin/contests';
      } else {
        console.error('Failed to create contest');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout currentPath="/admin/contests/create" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/contests">
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Contest</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Set up a new coding contest</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {['Basic Info', 'Questions', 'Settings'].map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  step === i + 1
                    ? 'bg-primary text-white'
                    : step > i + 1
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :'text-muted-foreground border border-border'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === i + 1 ? 'bg-white/20' : step > i + 1 ? 'bg-emerald-500/20' : 'bg-muted'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                {s}
              </button>
              {i < 2 && <div className="flex-1 h-px bg-border max-w-12" />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-card-elevated border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contest Title *</label>
                <input type="text" placeholder="e.g. ByteBlitz Weekly #19" className="input-field w-full px-3 py-2.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date & Time *</label>
                <input type="datetime-local" className="input-field w-full px-3 py-2.5 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration *</label>
                <select className="input-field w-full px-3 py-2.5 text-sm" value={durationHours} onChange={(e) => setDurationHours(parseFloat(e.target.value))}>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                  <option value={2.5}>2.5 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={5}>5 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
                <select className="input-field w-full px-3 py-2.5 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Participants</label>
                <input type="number" placeholder="0 = unlimited" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea rows={4} placeholder="Contest description, rules, and prizes..." className="input-field w-full px-3 py-2.5 text-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
                <input type="text" placeholder="Graphs, DP, Trees, Greedy" className="input-field w-full px-3 py-2.5 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
              Next: Add Questions →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-card-elevated border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Questions ({questions.length})</h2>
                <div className="flex items-center gap-2">
                  <button onClick={fetchDbQuestions} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                    <Download size={12} />
                    Import Question
                  </button>
                  <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sky-300 text-xs font-medium hover:bg-primary/20 transition-colors">
                    <Plus size={12} />
                    Add Question
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl border border-border hover:border-sky-500/30 transition-colors overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-background/50">
                      <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-sky-300 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, title: e.target.value } : p))}
                          className="input-field px-3 py-2 text-sm col-span-1 font-semibold"
                          placeholder="Problem Title"
                        />
                        <select
                          value={q.difficulty}
                          onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' } : p))}
                          className="input-field px-3 py-2 text-sm"
                        >
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, points: Number(e.target.value) } : p))}
                          className="input-field px-3 py-2 text-sm"
                          placeholder="Points"
                        />
                      </div>
                      <button onClick={() => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, expanded: !p.expanded } : p))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors">
                        {q.expanded ? 'Collapse' : 'Expand'}
                      </button>
                      <button onClick={() => removeQuestion(q.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {q.expanded && (
                      <div className="p-4 border-t border-border/50 bg-background/30 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Statement</label>
                          <textarea
                            rows={3}
                            value={q.description}
                            onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, description: e.target.value } : p))}
                            className="input-field w-full px-3 py-2.5 text-sm resize-none"
                            placeholder="Describe the problem clearly..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Input Format</label>
                            <textarea
                              rows={2}
                              value={q.inputFormat}
                              onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, inputFormat: e.target.value } : p))}
                              className="input-field w-full px-3 py-2 text-sm resize-none"
                              placeholder="e.g. First line contains N..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Output Format</label>
                            <textarea
                              rows={2}
                              value={q.outputFormat}
                              onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, outputFormat: e.target.value } : p))}
                              className="input-field w-full px-3 py-2 text-sm resize-none"
                              placeholder="e.g. Print a single integer..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Constraints</label>
                            <textarea
                              rows={2}
                              value={q.constraints}
                              onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, constraints: e.target.value } : p))}
                              className="input-field w-full px-3 py-2 text-sm resize-none"
                              placeholder="e.g. 1 <= N <= 10^5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Limit (seconds)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={q.timeLimit}
                              onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, timeLimit: parseFloat(e.target.value) } : p))}
                              className="input-field w-full px-3 py-2 text-sm"
                            />
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hints (Comma separated)</label>
                              <input
                                type="text"
                                value={(q.hints || []).join(', ')}
                                onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, hints: e.target.value.split(',').map(h=>h.trim()).filter(Boolean) } : p))}
                                className="input-field w-full px-3 py-2 text-sm"
                                placeholder="Hint 1, Hint 2"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-medium text-muted-foreground">Test Cases ({q.testCases.length})</label>
                            <button
                              onClick={() => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, testCases: [...p.testCases, { id: `tc${Date.now()}`, input: '', output: '', isHidden: false }] } : p))}
                              className="text-xs text-primary hover:text-sky-300 font-medium flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Case
                            </button>
                          </div>
                          
                          {q.testCases.map((tc, tcIdx) => (
                            <div key={tc.id} className="grid grid-cols-2 gap-3 relative group bg-background/50 p-3 rounded-lg border border-border/50">
                              <div>
                                <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Input</label>
                                <textarea
                                  rows={2}
                                  value={tc.input}
                                  onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, testCases: p.testCases.map(t => t.id === tc.id ? { ...t, input: e.target.value } : t) } : p))}
                                  className="input-field w-full px-2 py-1.5 text-xs font-mono bg-black/20"
                                  placeholder="e.g. 5\n1 2 3 4 5"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1 flex items-center justify-between">
                                  Output
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tc.isHidden}
                                      onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, testCases: p.testCases.map(t => t.id === tc.id ? { ...t, isHidden: e.target.checked } : t) } : p))}
                                      className="w-3 h-3 rounded-sm border-border accent-primary"
                                    />
                                    <span className="text-[10px] normal-case font-medium">Hidden</span>
                                  </label>
                                </label>
                                <textarea
                                  rows={2}
                                  value={tc.output}
                                  onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, testCases: p.testCases.map(t => t.id === tc.id ? { ...t, output: e.target.value } : t) } : p))}
                                  className="input-field w-full px-2 py-1.5 text-xs font-mono bg-black/20"
                                  placeholder="e.g. 15"
                                />
                              </div>
                              <button
                                onClick={() => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, testCases: p.testCases.filter(t => t.id !== tc.id) } : p))}
                                className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">Next: Settings →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-card-elevated border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Contest Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Enable Proctoring', desc: 'Monitor participants via webcam and screen activity' },
                  { label: 'Fullscreen Enforcement', desc: 'Require participants to stay in fullscreen mode' },
                  { label: 'Plagiarism Detection', desc: 'Automatically detect similar code submissions' },
                  { label: 'Show Leaderboard', desc: 'Display live rankings during the contest' },
                  { label: 'Allow Custom Test Cases', desc: 'Let participants run custom inputs' },
                  { label: 'Editorial After Contest', desc: 'Publish editorials when contest ends' },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{setting.label}</p>
                      <p className="text-xs text-muted-foreground">{setting.desc}</p>
                    </div>
                    <button className="relative w-10 h-5 rounded-full bg-primary" role="switch" aria-checked="true">
                      <span className="absolute top-0.5 translate-x-5 w-4 h-4 bg-white rounded-full shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">← Back</button>
              <button onClick={handleCreateContest} disabled={isSubmitting} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <Save size={14} />
                {isSubmitting ? 'Creating...' : 'Create Contest'}
              </button>
              <button className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Save as Draft</button>
            </div>
          </div>
        )}
      </div>
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card-elevated border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Import Question</h2>
              <button onClick={() => setShowImportModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-border bg-background/30">
              <input
                type="text"
                placeholder="Search questions by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                dbQuestions
                  .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(q => (
                    <div key={q.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:border-primary/50 transition-colors">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{q.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className={q.difficulty === 'EASY' ? 'text-emerald-400' : q.difficulty === 'HARD' ? 'text-rose-400' : 'text-amber-400'}>
                            {q.difficulty}
                          </span>
                          <span>•</span>
                          <span>{q.points} pts</span>
                          <span>•</span>
                          <span>{q.testCases?.length || 0} Test Cases</span>
                        </div>
                      </div>
                      <button onClick={() => importQuestion(q)} className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary hover:text-white hover:border-primary transition-colors">
                        Import
                      </button>
                    </div>
                  ))
              )}
              {!isLoadingQuestions && dbQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No existing questions found in the Question Builder.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
