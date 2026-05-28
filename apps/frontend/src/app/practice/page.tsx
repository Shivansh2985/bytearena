'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { apiFetch } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Link from 'next/link';
import { BookOpen, Search, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  points: number;
  timeLimit: number;
}

interface Submission {
  questionId: string;
  status: string;
}

export default function PracticePage() {
  const { data: user } = useCurrentUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const [qRes, sRes] = await Promise.all([
          apiFetch('/api/questions?contestId=none'),
          user ? apiFetch('/api/submissions') : Promise.resolve([])
        ]);
        setQuestions(qRes);
        setSubmissions(sRes);
      } catch (e) {
        console.error('Error fetching practice data:', e);
      }
    }
    fetchData();
  }, [user]);

  const solvedSet = new Set(
    submissions
      .filter((s) => s.status === 'ACCEPTED')
      .map((s) => s.questionId)
  );

  const filtered = questions.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || 
                        q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficultyFilter === 'all' || q.difficulty.toLowerCase() === difficultyFilter;
    return matchSearch && matchDiff;
  });

  const totalPages = Math.ceil(filtered.length / questionsPerPage);
  const currentQuestions = filtered.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HARD': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <AppLayout currentPath="/practice">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <BookOpen size={24} className="text-sky-400" />
            </div>
            Practice Problems
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Sharpen your algorithmic skills with our curated list of standalone practice problems. 
            Problems range from basic data structures to advanced dynamic programming.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm w-full">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search problems or tags..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 w-full sm:w-auto">
            {['all', 'easy', 'medium', 'hard'].map((f) => (
              <button
                key={f}
                onClick={() => { setDifficultyFilter(f); setCurrentPage(1); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  difficultyFilter === f ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div className="bg-card-elevated border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/10">
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-6 md:col-span-5">Problem Title</div>
            <div className="col-span-3 md:col-span-2">Difficulty</div>
            <div className="col-span-2 hidden md:block text-right">Time Limit</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          <div className="divide-y divide-border/50">
            {currentQuestions.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <p>No practice problems found matching your criteria.</p>
              </div>
            ) : (
              currentQuestions.map((q) => {
                const isSolved = solvedSet.has(q.id);
                return (
                  <div key={q.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors group">
                    <div className="col-span-1 flex justify-center">
                      {isSolved ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-5 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-sky-400 transition-colors truncate">
                        {q.title}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.tags?.slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground flex items-center gap-1">
                            <Tag size={8} /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="col-span-2 hidden md:flex justify-end items-center text-xs text-muted-foreground font-mono">
                      <Clock size={12} className="mr-1.5 opacity-50" />
                      {q.timeLimit.toFixed(1)}s
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Link href={`/practice-workspace/${q.id}`}>
                        <button className="px-4 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold rounded-lg transition-colors border border-sky-500/20">
                          Solve
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 transition-colors hover:bg-muted"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 transition-colors hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
