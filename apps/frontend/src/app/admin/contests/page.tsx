'use client';
import { apiFetch } from '@/lib/api';
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

export default function AdminContestsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  React.useEffect(() => {
    setLoading(true);
    apiFetch(`/api/contests?page=${currentPage}&limit=50${filter !== 'all' ? `&status=${filter}` : ''}`)
      .then(res => res.json())
      .then(resData => {
        if (!resData.error && Array.isArray(resData.data)) {
          const mapped = resData.data.map((c: any) => {
            const start = new Date(c.startTime);
            const end = new Date(c.endTime);
            const durationMs = end.getTime() - start.getTime();
            const durationH = Math.round(durationMs / 3600000);
            return {
              id: c.id,
              title: c.title,
              status: c.status.toLowerCase() as 'live' | 'upcoming' | 'completed' | 'draft',
              difficulty: c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1).toLowerCase() as any,
              startTime: start.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
              duration: `${durationH}h`,
              participants: c.participants || 0,
              questions: c.totalQuestions || 0,
              createdBy: 'Admin'
            };
          });
          setContests(mapped);
          setTotalPages(resData.totalPages || 1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch contests', err);
        setLoading(false);
      });
  }, [currentPage, filter]);

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
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium hidden sm:block">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
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
                  <Link href={`/admin/contests/${c.id}`}>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="View details & submissions">
                      <Eye size={14} />
                    </button>
                  </Link>
                  <Link href={`/admin/contests/${c.id}/edit`}>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Edit">
                      <Edit2 size={14} />
                    </button>
                  </Link>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-4 flex items-center justify-between border-t border-border bg-muted/5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/30 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
