'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Save, ArrowLeft, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
}

export default function CreateContestPage() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', title: 'Two Sum', difficulty: 'Easy', points: 200 },
    { id: 'q2', title: 'Longest Substring', difficulty: 'Medium', points: 500 },
  ]);
  const [step, setStep] = useState(1);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, {
      id: `q${prev.length + 1}`,
      title: `Question ${prev.length + 1}`,
      difficulty: 'Medium',
      points: 400,
    }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
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
                <input type="text" placeholder="e.g. ByteBlitz Weekly #19" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date & Time *</label>
                <input type="datetime-local" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration *</label>
                <select className="input-field w-full px-3 py-2.5 text-sm">
                  <option>1 hour</option>
                  <option>1.5 hours</option>
                  <option>2 hours</option>
                  <option>2.5 hours</option>
                  <option selected>3 hours</option>
                  <option>5 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
                <select className="input-field w-full px-3 py-2.5 text-sm">
                  <option>Easy</option>
                  <option selected>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Participants</label>
                <input type="number" placeholder="0 = unlimited" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea rows={4} placeholder="Contest description, rules, and prizes..." className="input-field w-full px-3 py-2.5 text-sm resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
                <input type="text" placeholder="Graphs, DP, Trees, Greedy" className="input-field w-full px-3 py-2.5 text-sm" />
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
                <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sky-300 text-xs font-medium hover:bg-primary/20 transition-colors">
                  <Plus size={12} />
                  Add Question
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-sky-500/30 transition-colors">
                    <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-sky-300 flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => setQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, title: e.target.value } : p))}
                        className="input-field px-3 py-2 text-sm col-span-1"
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
                    <button onClick={() => removeQuestion(q.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
              <button className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Save size={14} />
                Create Contest
              </button>
              <button className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Save as Draft</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
