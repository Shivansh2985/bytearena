'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PlusCircle, Code2, Trash2, Eye, Edit2, Search, Plus, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isSample: boolean;
}

interface Question {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  hints: string[];
  timeLimit: number;
  points: number;
  tags: string[];
  testCases: TestCase[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY'|'MEDIUM'|'HARD'>('MEDIUM');
  const [timeLimit, setTimeLimit] = useState<number>(2.0);
  const [points, setPoints] = useState<number>(100);
  const [problemStatement, setProblemStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [hints, setHints] = useState<string[]>(['', '', '']);
  const [tags, setTags] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false, isSample: true },
    { input: '', expectedOutput: '', isHidden: false, isSample: true }
  ]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const data = await apiFetch('/api/questions');
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        title,
        difficulty,
        timeLimit,
        points,
        problemStatement,
        inputFormat,
        outputFormat,
        constraints,
        hints: hints.filter(Boolean),
        tags: parsedTags,
        testCases
      };
      await apiFetch('/api/questions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowCreate(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert('Failed to create question.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDifficulty('MEDIUM');
    setTimeLimit(2.0);
    setPoints(100);
    setProblemStatement('');
    setInputFormat('');
    setOutputFormat('');
    setConstraints('');
    setHints(['', '', '']);
    setTags('');
    setTestCases([
      { input: '', expectedOutput: '', isHidden: false, isSample: true },
      { input: '', expectedOutput: '', isHidden: false, isSample: true }
    ]);
  };

  const filtered = questions.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === 'all' || q.difficulty.toLowerCase() === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <AppLayout currentPath="/admin/questions" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code2 size={22} className="text-sky-400" />
              Question Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create and manage coding problems</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <PlusCircle size={14} />
            New Question
          </button>
        </div>

        {showCreate && (
          <div className="bg-card-elevated border border-sky-500/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Create New Question</h2>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Two Sum" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty *</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="input-field w-full px-3 py-2.5 text-sm">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Limit (s)</label>
                <input value={timeLimit} onChange={e => setTimeLimit(parseFloat(e.target.value) || 2.0)} type="number" step="0.1" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Points</label>
                <input value={points} onChange={e => setPoints(parseInt(e.target.value) || 100)} type="number" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} type="text" placeholder="Graphs, DP" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Statement (Markdown) *</label>
                <textarea value={problemStatement} onChange={e => setProblemStatement(e.target.value)} rows={4} className="input-field w-full px-3 py-2.5 text-sm font-mono resize-none" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Input Format *</label>
                <textarea value={inputFormat} onChange={e => setInputFormat(e.target.value)} rows={2} className="input-field w-full px-3 py-2.5 text-sm font-mono resize-none" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Output Format *</label>
                <textarea value={outputFormat} onChange={e => setOutputFormat(e.target.value)} rows={2} className="input-field w-full px-3 py-2.5 text-sm font-mono resize-none" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Constraints *</label>
                <textarea value={constraints} onChange={e => setConstraints(e.target.value)} rows={2} className="input-field w-full px-3 py-2.5 text-sm font-mono resize-none" />
              </div>
              
              {hints.map((hint, i) => (
                <div key={i} className="sm:col-span-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hint {i + 1}</label>
                  <input value={hint} onChange={e => {
                    const newHints = [...hints];
                    newHints[i] = e.target.value;
                    setHints(newHints);
                  }} type="text" className="input-field w-full px-3 py-2.5 text-sm" />
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Test Cases</h3>
              <div className="space-y-3">
                {testCases.map((tc, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 bg-muted/10 p-3 rounded-lg border border-border">
                    <div className="col-span-2 flex gap-4 mb-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={tc.isHidden} onChange={e => {
                          const newTcs = [...testCases];
                          newTcs[i].isHidden = e.target.checked;
                          setTestCases(newTcs);
                        }} /> Hidden
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={tc.isSample} onChange={e => {
                          const newTcs = [...testCases];
                          newTcs[i].isSample = e.target.checked;
                          setTestCases(newTcs);
                        }} /> Sample
                      </label>
                      <button onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-300 text-xs">Remove</button>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Input</label>
                      <textarea value={tc.input} onChange={e => {
                        const newTcs = [...testCases];
                        newTcs[i].input = e.target.value;
                        setTestCases(newTcs);
                      }} rows={2} className="input-field w-full px-3 py-2 text-xs font-mono resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Expected Output</label>
                      <textarea value={tc.expectedOutput} onChange={e => {
                        const newTcs = [...testCases];
                        newTcs[i].expectedOutput = e.target.value;
                        setTestCases(newTcs);
                      }} rows={2} className="input-field w-full px-3 py-2 text-xs font-mono resize-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: true, isSample: false }])} className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors">
                  <Plus size={12} /> Add test case
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">Save Question</button>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
            {['all', 'easy', 'medium', 'hard'].map((f) => (
              <button
                key={f}
                onClick={() => setDiffFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  diffFilter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Problem</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-3">Time Limit</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading questions...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No questions found.</div>
            ) : (
              filtered.map((q) => (
                <div key={q.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{q.title}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${
                      q.difficulty === 'EASY' ? 'badge-easy' : q.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-muted-foreground">{q.timeLimit}s</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button onClick={async () => {
                      if(confirm('Delete question?')) {
                        await apiFetch(`/api/questions/${q.id}`, { method: 'DELETE' });
                        fetchQuestions();
                      }
                    }} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
