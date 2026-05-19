'use client';
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
}

const allContests: Contest[] = [
  { id: 'c1', title: 'ByteBlitz Weekly #18', difficulty: 'Medium', status: 'live', startTime: Date.now() - 3600000, endTime: Date.now() + 5400000, participants: 3842, totalQuestions: 5, tags: ['Graphs', 'DP', 'Trees'], myRank: 342, myScore: 1800, registered: true },
  { id: 'c2', title: 'AlgoArena Qualifier #6', difficulty: 'Hard', status: 'live', startTime: Date.now() - 1800000, endTime: Date.now() + 9900000, participants: 1204, totalQuestions: 4, tags: ['Segment Tree', 'Greedy'], myRank: null, myScore: null, registered: false },
  { id: 'c3', title: 'CodeStorm Sprint #4', difficulty: 'Easy', status: 'upcoming', startTime: Date.now() + 86400000, endTime: Date.now() + 90000000, participants: 0, totalQuestions: 6, tags: ['Arrays', 'Strings', 'Math'], registered: false },
  { id: 'c4', title: 'ByteBlitz Weekly #19', difficulty: 'Medium', status: 'upcoming', startTime: Date.now() + 172800000, endTime: Date.now() + 176400000, participants: 0, totalQuestions: 5, tags: ['DP', 'Binary Search'], registered: true },
  { id: 'c5', title: 'ICPC Practice Round', difficulty: 'Hard', status: 'upcoming', startTime: Date.now() + 259200000, endTime: Date.now() + 270000000, participants: 0, totalQuestions: 8, tags: ['Geometry', 'Flows', 'Strings'], registered: false },
  { id: 'c6', title: 'ByteBlitz Weekly #17', difficulty: 'Medium', status: 'completed', startTime: Date.now() - 604800000, endTime: Date.now() - 601200000, participants: 3200, totalQuestions: 5, tags: ['Graphs', 'DP'], myRank: 42, myScore: 2100, registered: true },
  { id: 'c7', title: 'AlgoArena Qualifier #5', difficulty: 'Hard', status: 'completed', startTime: Date.now() - 1209600000, endTime: Date.now() - 1206000000, participants: 1800, totalQuestions: 4, tags: ['Trie', 'Segment Tree'], myRank: 128, myScore: 1600, registered: true },
  { id: 'c8', title: 'CodeStorm Sprint #3', difficulty: 'Easy', status: 'completed', startTime: Date.now() - 1814400000, endTime: Date.now() - 1810800000, participants: 2100, totalQuestions: 6, tags: ['Arrays', 'Sorting'], myRank: 89, myScore: 1900, registered: true },
];

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

  const filtered = allContests.filter((c) => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

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
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
            {(['all', 'live', 'upcoming', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
                {f === 'live' && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-400 inline-block pulse-live" />}
              </button>
            ))}
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
                <Link href="/live-contest-workspace">
                  <button className="btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    {c.registered ? 'Continue Contest' : 'Join Now'}
                    <ArrowRight size={12} />
                  </button>
                </Link>
              ) : c.status === 'upcoming' ? (
                <button className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  c.registered
                    ? 'bg-sky-500/10 border border-sky-500/20 text-sky-300' :'btn-primary'
                }`}>
                  {c.registered ? '✓ Registered' : 'Register Now'}
                </button>
              ) : (
                <button className="w-full py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-sky-500/30 transition-colors">
                  View Results
                </button>
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
      </div>
    </AppLayout>
  );
}
