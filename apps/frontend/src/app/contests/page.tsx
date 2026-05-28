'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { Search, Users, Swords, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface Contest {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'live' | 'upcoming' | 'completed';
  startTime: number;
  endTime: number;
  participants: number;
  totalQuestions: number;
  tags: string[];
  myRank?: number | null;
  myScore?: number | null;
  registered?: boolean;
  resultsPublished?: boolean;
}

// Removed mock data

function CountdownTimer({ endTime, startTime, status }: { endTime: number; startTime: number; status: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const target = status === 'upcoming' ? startTime : endTime;
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(status === 'upcoming' ? 'Starting...' : 'Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime, startTime, status]);

  return <span className={`font-mono text-sm font-bold metric-value ${status === 'live' ? 'text-red-300' : status === 'upcoming' ? 'text-amber-300' : 'text-muted-foreground'}`}>{timeLeft}</span>;
}

export default function ContestsPage() {
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchContests() {
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/contests?page=${page}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          const actualData = Array.isArray(data) ? data : (data.data || []);
          setContests(actualData);
          if (data.totalPages) setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch contests', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContests();
  }, [page]);

  const filtered = contests.filter((c) => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const [isRegistering, setIsRegistering] = useState<string | null>(null);

  const handleRegister = async (contestId: string) => {
    try {
      setIsRegistering(contestId);
      const res = await apiFetch(`/api/contests/${contestId}/register`, { method: 'POST' });
      if (res.ok) {
        setContests(prev => prev.map(c => c.id === contestId ? { ...c, registered: true } : c));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to register');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration');
    } finally {
      setIsRegistering(null);
    }
  };

  return (
    <AppLayout currentPath="/contests" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Swords size={22} className="text-sky-400" />
              Contests
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Browse, register, and compete in coding contests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contests or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium hidden sm:block">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Contest grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div key={c.id} className={`contest-card p-5 ${c.status === 'live' ? 'border-glow-danger' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={c.status as 'live' | 'upcoming' | 'completed'} dot={c.status === 'live'}>
                      {c.status.toUpperCase()}
                    </Badge>
                    <Badge variant={c.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                      {c.difficulty}
                    </Badge>
                    {c.registered && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">Registered</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground">
                  {c.status === 'live' ? 'Ends in' : c.status === 'upcoming' ? 'Starts in' : 'Ended'}
                </div>
                {c.status !== 'completed' ? (
                  <CountdownTimer endTime={c.endTime} startTime={c.startTime} status={c.status} />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.endTime).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={11} />
                  <span>{c.participants > 0 ? c.participants.toLocaleString() : '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Swords size={11} />
                  <span>{c.totalQuestions} questions</span>
                </div>
                {c.myRank && (
                  <div className="ml-auto text-xs">
                    <span className="text-muted-foreground">Rank: </span>
                    <span className="text-sky-300 font-semibold metric-value">#{c.myRank}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="problem-tag">{tag}</span>
                ))}
              </div>

              {c.status === 'live' ? (
                c.registered ? (
                  <Link href={`/live-contest-workspace/${c.id}`}>
                    <button className="btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                      Continue Contest
                      <ArrowRight size={12} />
                    </button>
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleRegister(c.id)}
                    disabled={isRegistering === c.id}
                    className="btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-70"
                  >
                    {isRegistering === c.id ? 'Registering...' : 'Join Now'}
                    <ArrowRight size={12} />
                  </button>
                )
              ) : c.status === 'upcoming' ? (
                <button 
                  onClick={() => !c.registered && handleRegister(c.id)}
                  disabled={c.registered || isRegistering === c.id}
                  className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-70 ${
                  c.registered
                    ? 'bg-sky-500/10 border border-sky-500/20 text-sky-300 cursor-default' :'btn-primary'
                }`}>
                  {isRegistering === c.id ? 'Registering...' : (c.registered ? '✓ Registered' : 'Register Now')}
                </button>
              ) : c.status.toLowerCase() === 'completed' ? (
                <Link href={`/contests/${c.id}/results`} className="block w-full">
                  <button className="w-full py-2 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 transition-colors flex items-center justify-center gap-1.5">
                    View Results & Leaderboard
                    <ArrowRight size={12} />
                  </button>
                </Link>
              ) : (
                <Link href={`/live-contest-workspace/${c.id}`} className="block w-full">
                  <button className="w-full py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-sky-500/30 transition-colors flex items-center justify-center gap-1.5">
                    View Contest
                    <ArrowRight size={12} />
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Swords size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No contests found matching your filters</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-md bg-input border border-border text-foreground disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground font-medium">Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-md bg-input border border-border text-foreground disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
