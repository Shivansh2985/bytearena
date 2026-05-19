'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Swords } from 'lucide-react';
import Badge from '@/components/ui/Badge';

// BACKEND: GET /api/contests?status=live
const liveContests = [
  {
    id: 'contest-live-1',
    title: 'ByteBlitz Weekly #18',
    difficulty: 'Medium' as const,
    participants: 3842,
    totalQuestions: 5,
    endTime: Date.now() + 1 * 60 * 60 * 1000 + 23 * 60 * 1000,
    tags: ['Graphs', 'DP', 'Trees'],
    myRank: 342,
    myScore: 1800,
    status: 'live' as const,
  },
  {
    id: 'contest-live-2',
    title: 'AlgoArena Qualifier #6',
    difficulty: 'Hard' as const,
    participants: 1204,
    totalQuestions: 4,
    endTime: Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000,
    tags: ['Segment Tree', 'Greedy'],
    myRank: null,
    myScore: null,
    status: 'live' as const,
  },
];

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <span className="font-mono text-sm font-bold text-red-300 metric-value">{timeLeft}</span>
  );
}

export default function ContestFeed() {
  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 pulse-live" />
          Live Contests
        </h2>
        <Link href="/contests" className="text-xs text-primary hover:text-sky-300 transition-colors flex items-center gap-1">
          All contests <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-3">
        {liveContests.map((c) => (
          <div key={c.id} className="contest-card p-4 border-glow-danger rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="live" dot>LIVE</Badge>
                  <Badge variant={c.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                    {c.difficulty}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{c.title}</h3>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Time left</p>
                <CountdownTimer endTime={c.endTime} />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={12} />
                <span>{c.participants.toLocaleString()} participants</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Swords size={12} />
                <span>{c.totalQuestions} questions</span>
              </div>
              {c.myRank && (
                <div className="ml-auto text-xs">
                  <span className="text-muted-foreground">My rank: </span>
                  <span className="text-cyan-300 font-semibold metric-value">#{c.myRank}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              {c.tags.map((tag) => (
                <span key={`tag-${c.id}-${tag}`} className="problem-tag">{tag}</span>
              ))}
            </div>

            <Link href="/live-contest-workspace">
              <button className="btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95">
                {c.myRank ? 'Continue Contest' : 'Join Contest'}
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}