'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { History, Search, Code2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Submission {
  id: string;
  problem: string;
  contest: string;
  language: string;
  status: 'accepted' | 'wrong_answer' | 'tle' | 'runtime_error' | 'compile_error';
  time: string;
  memory: string;
  submittedAt: string;
  score?: number;
  problemId?: string;
  contestId?: string;
}

// Hardcoded array removed to avoid confusion; relying solely on fetched data.

const statusConfig = {
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  wrong_answer: { label: 'Wrong Answer', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  tle: { label: 'Time Limit', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  runtime_error: { label: 'Runtime Error', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  compile_error: { label: 'Compile Error', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function SubmissionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    apiFetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissionsList(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch submissions:', err);
        setLoading(false);
      });
  }, []);

  const mappedSubmissions: Submission[] = submissionsList.map((s: any) => {
    // Map backend status to lowercase statusConfig keys
    let statusKey: Submission['status'] = 'wrong_answer';
    const statusLower = s.status?.toLowerCase();
    if (statusLower === 'accepted') statusKey = 'accepted';
    else if (statusLower === 'wrong_answer' || statusLower === 'wa') statusKey = 'wrong_answer';
    else if (statusLower === 'time_limit_exceeded' || statusLower === 'tle') statusKey = 'tle';
    else if (statusLower === 'runtime_error' || statusLower === 're') statusKey = 'runtime_error';
    else if (statusLower === 'compile_error' || statusLower === 'ce') statusKey = 'compile_error';

    return {
      id: s.id,
      problem: s.question?.title || 'Unknown Problem',
      problemId: s.questionId,
      contestId: s.question?.contestId,
      contest: s.question?.contest?.title || 'Practice',
      language: s.language || 'C++',
      status: statusKey,
      time: s.runtime ? `${s.runtime}ms` : '—',
      memory: s.memory ? `${s.memory}MB` : '—',
      submittedAt: new Date(s.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: s.score || undefined,
      code: s.code
    };
  });

  const filtered = mappedSubmissions.filter((s) => {
    const matchSearch = s.problem.toLowerCase().includes(search.toLowerCase()) ||
      s.contest.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const acCount = mappedSubmissions.filter((s) => s.status === 'accepted').length;

  const totalCount = mappedSubmissions.length;
  const waCount = mappedSubmissions.filter((s) => s.status === 'wrong_answer').length;
  const tleReCount = mappedSubmissions.filter((s) => s.status === 'tle' || s.status === 'runtime_error').length;

  return (
    <AppLayout currentPath="/submissions" role="student">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History size={22} className="text-sky-400" />
              Submission History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{acCount}/{totalCount} accepted</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: totalCount.toLocaleString(), color: 'sky' },
            { label: 'Accepted', value: acCount.toLocaleString(), color: 'emerald' },
            { label: 'Wrong Answer', value: waCount.toLocaleString(), color: 'red' },
            { label: 'TLE / RE', value: tleReCount.toLocaleString(), color: 'amber' },
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
              placeholder="Search problems or contests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 flex-wrap">
            {['all', 'accepted', 'wrong_answer', 'tle', 'runtime_error'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f === 'wrong_answer' ? 'WA' : f === 'tle' ? 'TLE' : f === 'runtime_error' ? 'RE' : 'AC'}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions list */}
        <div className="bg-card-elevated border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Problem</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 hidden sm:block">Language</div>
            <div className="col-span-2 hidden md:block">Time / Memory</div>
            <div className="col-span-2 text-right">Submitted</div>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((s) => {
              const cfg = statusConfig[s.status];
              const Icon = cfg.icon;
              return (
                <div key={s.id}>
                  <div
                    className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.problem}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.contest}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                        <Icon size={11} />
                        <span className="hidden sm:inline">{cfg.label}</span>
                      </span>
                    </div>
                    <div className="col-span-2 hidden sm:block">
                      <span className="text-xs font-mono text-muted-foreground">{s.language}</span>
                    </div>
                    <div className="col-span-2 hidden md:block">
                      <p className="text-xs text-muted-foreground">{s.time}</p>
                      <p className="text-xs text-muted-foreground">{s.memory}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-xs text-muted-foreground">{s.submittedAt}</p>
                      {s.score && <p className="text-xs text-sky-400 font-medium">+{s.score} pts</p>}
                    </div>
                  </div>
                  {expanded === s.id && (
                    <div className="px-5 pb-4 bg-muted/10 border-t border-border/50">
                      <div className="flex items-center gap-3 pt-3 mb-3">
                        <button 
                          onClick={() => navigator.clipboard.writeText(s.code || '')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sky-300 text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Code2 size={12} />
                          Copy Code
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                          Resubmit
                        </button>
                      </div>
                      <pre className="p-4 rounded-lg bg-[#0A0A0A] border border-border/50 overflow-x-auto text-xs font-mono text-sky-100 max-h-96 custom-scrollbar">
                        <code>{s.code || 'No code found.'}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
