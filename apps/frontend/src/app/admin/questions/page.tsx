'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { PlusCircle, Code2, Trash2, Eye, Edit2, Search, Plus, X } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  timeLimit: string;
  memoryLimit: string;
  visibleTests: number;
  hiddenTests: number;
  usedIn: string[];
}

const questions: Question[] = [
  { id: 'q1', title: 'Minimum Spanning Tree Weight', difficulty: 'Easy', tags: ['Graphs', 'Kruskal'], timeLimit: '1s', memoryLimit: '256MB', visibleTests: 3, hiddenTests: 10, usedIn: ['ByteBlitz #18'] },
  { id: 'q2', title: 'Longest Palindromic Subsequence', difficulty: 'Medium', tags: ['DP', 'Strings'], timeLimit: '2s', memoryLimit: '256MB', visibleTests: 2, hiddenTests: 15, usedIn: ['ByteBlitz #18', 'Practice'] },
  { id: 'q3', title: 'K-th Largest XOR Subarray', difficulty: 'Hard', tags: ['Trie', 'Bit Manipulation'], timeLimit: '2s', memoryLimit: '512MB', visibleTests: 2, hiddenTests: 20, usedIn: ['ByteBlitz #18'] },
  { id: 'q4', title: 'Euler Tour on Tree', difficulty: 'Medium', tags: ['Trees', 'DFS'], timeLimit: '1.5s', memoryLimit: '256MB', visibleTests: 3, hiddenTests: 12, usedIn: ['AlgoArena #5'] },
  { id: 'q5', title: 'Convex Hull Trick DP', difficulty: 'Hard', tags: ['DP Optimization', 'Convex Hull'], timeLimit: '3s', memoryLimit: '512MB', visibleTests: 1, hiddenTests: 18, usedIn: ['AlgoArena #5'] },
];

export default function AdminQuestionsPage() {
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = questions.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = diffFilter === 'all' || q.difficulty.toLowerCase() === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <AppLayout currentPath="/admin/questions" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code2 size={22} className="text-sky-400" />
              Question Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create and manage coding problems with test cases</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <PlusCircle size={14} />
            New Question
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-card-elevated border border-sky-500/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Create New Question</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Title *</label>
                <input type="text" placeholder="e.g. Two Sum Variant" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty *</label>
                <select className="input-field w-full px-3 py-2.5 text-sm">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Limit</label>
                <input type="text" placeholder="e.g. 1s" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Memory Limit</label>
                <input type="text" placeholder="e.g. 256MB" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Points</label>
                <input type="number" placeholder="e.g. 500" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Problem Statement (Markdown)</label>
                <textarea rows={5} placeholder="Write the problem statement in Markdown..." className="input-field w-full px-3 py-2.5 text-sm font-mono resize-none" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (comma separated)</label>
                <input type="text" placeholder="Graphs, DP, Trees" className="input-field w-full px-3 py-2.5 text-sm" />
              </div>
            </div>

            {/* Test cases section */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Visible Test Cases</h3>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Input {i}</label>
                      <textarea rows={2} className="input-field w-full px-3 py-2 text-xs font-mono resize-none" placeholder="Input..." />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Expected Output {i}</label>
                      <textarea rows={2} className="input-field w-full px-3 py-2 text-xs font-mono resize-none" placeholder="Output..." />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors">
                  <Plus size={12} />
                  Add visible test case
                </button>
                <span className="text-muted-foreground">·</span>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Upload hidden test cases (.zip)
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">Save Question</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions or tags..."
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

        {/* Questions table */}
        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Problem</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2 hidden md:block">Limits</div>
            <div className="col-span-2 hidden lg:block">Test Cases</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((q) => (
              <div key={q.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{q.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {q.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="problem-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${
                    q.difficulty === 'Easy' ? 'badge-easy' : q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <p className="text-xs text-muted-foreground">{q.timeLimit} / {q.memoryLimit}</p>
                </div>
                <div className="col-span-2 hidden lg:block">
                  <p className="text-xs text-muted-foreground">{q.visibleTests} visible · {q.hiddenTests} hidden</p>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Preview">
                    <Eye size={13} />
                  </button>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
