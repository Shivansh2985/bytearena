'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { Swords, PlusCircle, Search, Edit2, Trash2, Eye, Calendar,  } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface Contest {
  id: string;
  title: string;
  status: 'live' | 'upcoming' | 'completed' | 'draft';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  startTime: string;
  duration: string;
  participants: number;
  questions: number;
  createdBy: string;
}

const contests: Contest[] = [
  { id: 'c1', title: 'ByteBlitz Weekly #18', status: 'live', difficulty: 'Medium', startTime: 'Today 10:00 AM', duration: '3h', participants: 3842, questions: 5, createdBy: 'Admin' },
  { id: 'c2', title: 'AlgoArena Qualifier #6', status: 'live', difficulty: 'Hard', startTime: 'Today 11:30 AM', duration: '2.5h', participants: 1204, questions: 4, createdBy: 'Admin' },
  { id: 'c3', title: 'CodeStorm Sprint #4', status: 'upcoming', difficulty: 'Easy', startTime: 'Tomorrow 9:00 AM', duration: '2h', participants: 0, questions: 6, createdBy: 'Admin' },
  { id: 'c4', title: 'ByteBlitz Weekly #19', status: 'upcoming', difficulty: 'Medium', startTime: 'Jun 1, 10:00 AM', duration: '3h', participants: 0, questions: 5, createdBy: 'Admin' },
  { id: 'c5', title: 'ICPC Practice Round', status: 'draft', difficulty: 'Hard', startTime: 'Not scheduled', duration: '5h', participants: 0, questions: 8, createdBy: 'Admin' },
  { id: 'c6', title: 'ByteBlitz Weekly #17', status: 'completed', difficulty: 'Medium', startTime: 'May 12, 10:00 AM', duration: '3h', participants: 3200, questions: 5, createdBy: 'Admin' },
  { id: 'c7', title: 'AlgoArena Qualifier #5', status: 'completed', difficulty: 'Hard', startTime: 'May 5, 11:00 AM', duration: '2.5h', participants: 1800, questions: 4, createdBy: 'Admin' },
];

export default function AdminContestsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = contests.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AppLayout currentPath="/admin/contests" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Swords size={22} className="text-sky-400" />
              Contest Manager
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create, edit, and manage all contests</p>
          </div>
          <Link href="/admin/contests/create">
            <button className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <PlusCircle size={14} />
              Create Contest
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Live', value: contests.filter((c) => c.status === 'live').length, color: 'red' },
            { label: 'Upcoming', value: contests.filter((c) => c.status === 'upcoming').length, color: 'amber' },
            { label: 'Completed', value: contests.filter((c) => c.status === 'completed').length, color: 'emerald' },
            { label: 'Drafts', value: contests.filter((c) => c.status === 'draft').length, color: 'slate' },
          ].map((s) => (
            <div key={s.label} className="bg-card-elevated border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold metric-value text-${s.color}-400`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
            {['all', 'live', 'upcoming', 'completed', 'draft'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Contest table */}
        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Contest</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 hidden md:block">Schedule</div>
            <div className="col-span-1 hidden lg:block text-right">Participants</div>
            <div className="col-span-1 hidden lg:block text-right">Questions</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={c.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>{c.difficulty}</Badge>
                    <span className="text-xs text-muted-foreground">{c.duration}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge
                    variant={c.status === 'draft' ? 'completed' : c.status as 'live' | 'upcoming' | 'completed'}
                    dot={c.status === 'live'}
                  >
                    {c.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-2 hidden md:block">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={11} />
                    <span>{c.startTime}</span>
                  </div>
                </div>
                <div className="col-span-1 hidden lg:block text-right">
                  <span className="text-sm text-muted-foreground metric-value">{c.participants > 0 ? c.participants.toLocaleString() : '—'}</span>
                </div>
                <div className="col-span-1 hidden lg:block text-right">
                  <span className="text-sm text-muted-foreground">{c.questions}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  {c.status === 'live' && (
                    <Link href="/admin/proctoring">
                      <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Monitor live">
                        <Eye size={14} />
                      </button>
                    </Link>
                  )}
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 size={14} />
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
