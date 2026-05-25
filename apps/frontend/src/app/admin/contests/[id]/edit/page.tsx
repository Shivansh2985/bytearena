'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Save, ArrowLeft, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
  isNew?: boolean;
}

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  testCases: TestCase[];
  expanded?: boolean;
  isNew?: boolean;
}

export default function EditContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: contestId } = React.use(params);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [status, setStatus] = useState('UPCOMING');
  const [startTime, setStartTime] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/contests/${contestId}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDifficulty(data.difficulty || 'Medium');
        setStatus(data.status || 'UPCOMING');
        setTags((data.tags || []).join(', '));
        if (data.startTime) {
          // Format for datetime-local input
          const d = new Date(data.startTime);
          setStartTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
        if (data.questions) {
          setQuestions(data.questions.map((q: any) => ({
            id: q.id,
            title: q.title,
            description: q.problemStatement || q.description || '',
            difficulty: q.difficulty,
            points: q.points,
            testCases: q.testCases || [],
            expanded: false
          })));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [contestId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, {
      id: `new_${Date.now()}`,
      title: `Question ${prev.length + 1}`,
      description: '',
      difficulty: 'Medium',
      points: 400,
      testCases: [{ id: `tc_${Date.now()}`, input: '', output: '', isHidden: false, isNew: true }],
      expanded: true,
      isNew: true
    }]);
  };

  const handleUpdateContest = async () => {
    setIsSubmitting(true);
    try {
      const start = startTime ? new Date(startTime) : new Date();
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); 

      // Update Contest Info
      await apiFetch(`/api/contests/${contestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, difficulty: difficulty.toUpperCase(),
          status: status.toUpperCase(),
          startTime: start.toISOString(), endTime: end.toISOString(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      // Update Questions (Basic support - updating existing ones)
      for (const q of questions) {
        if (q.isNew) {
          // You could optionally call POST /api/questions if the backend supported creating single questions
          continue;
        }
        await apiFetch(`/api/questions/${q.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: q.title, problemStatement: q.description,
            difficulty: q.difficulty.toUpperCase(), points: q.points
          })
        });
      }

      window.location.href = `/admin/contests/${contestId}`;
    } catch (err) {
      console.error(err);
      alert('Failed to update contest. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <AppLayout><div className="p-10 text-center">Loading...</div></AppLayout>;

  return (
    <AppLayout currentPath="/admin/contests" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-lg mx-auto space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/admin/contests/${contestId}`}>
              <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={16} />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Contest</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Live updates to contest details and questions</p>
            </div>
          </div>
          <button onClick={handleUpdateContest} disabled={isSubmitting} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Save size={14} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {['Basic Info', 'Questions'].map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => setStep(i + 1)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === i + 1 ? 'bg-primary text-white' : 'text-muted-foreground border border-border'}`}>
                {s}
              </button>
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-card-elevated border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contest Title *</label>
                <input type="text" className="input-field w-full px-3 py-2.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date & Time *</label>
                <input type="datetime-local" className="input-field w-full px-3 py-2.5 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select className="input-field w-full px-3 py-2.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="LIVE">Live</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea rows={4} className="input-field w-full px-3 py-2.5 text-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
                <input type="text" className="input-field w-full px-3 py-2.5 text-sm" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-card-elevated border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Questions ({questions.length})</h2>
              </div>
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl border border-border transition-colors overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-background/50">
                      <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-sky-300 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input type="text" value={q.title} onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, title: e.target.value } : p))} className="input-field px-3 py-2 text-sm font-semibold" />
                        <select value={q.difficulty} onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, difficulty: e.target.value as any } : p))} className="input-field px-3 py-2 text-sm">
                          <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                        </select>
                        <input type="number" value={q.points} onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, points: Number(e.target.value) } : p))} className="input-field px-3 py-2 text-sm" />
                      </div>
                      <button onClick={() => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, expanded: !p.expanded } : p))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors">
                        {q.expanded ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {q.expanded && (
                      <div className="p-4 border-t border-border/50 bg-background/30 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Statement</label>
                          <textarea rows={3} value={q.description} onChange={(e) => setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, description: e.target.value } : p))} className="input-field w-full px-3 py-2.5 text-sm resize-none" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
