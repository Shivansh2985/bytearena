'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Eye, Clock, CheckCircle, XCircle, Code, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dropdown filters
  const [filterContest, setFilterContest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch all submissions (global)
    apiFetch('/api/submissions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
      
    // Fetch contests for dropdown
    apiFetch('/api/contests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContests(data);
        }
      })
      .catch(console.error);
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    const matchContest = filterContest === 'all' || sub.question?.contestId === filterContest;
    const matchStatus = filterStatus === 'all' || sub.status.toLowerCase() === filterStatus;
    return matchContest && matchStatus;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 lg:p-8 w-full space-y-8 fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary/80 mb-2">
              <Code size={18} />
              <h2 className="text-sm font-semibold tracking-wider uppercase">Monitoring</h2>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Global Submissions
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              View and filter all code submissions across all contests globally.
            </p>
          </div>
        </header>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">Contest:</label>
            <select 
              value={filterContest} 
              onChange={(e) => setFilterContest(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">All Contests</option>
              {contests.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="wrong_answer">Wrong Answer</option>
              <option value="pending">Pending</option>
              <option value="time_limit_exceeded">Time Limit Exceeded</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-muted/20 rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-border border-dashed">
            <Code size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-1">No submissions found</h3>
            <p className="text-muted-foreground">Adjust your filters to see results.</p>
          </div>
        ) : (
          <div className="bg-muted/10 rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Contest & Problem</th>
                  <th className="p-4 font-medium">Language</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((sub: any) => {
                  const isSuccess = sub.status === 'ACCEPTED';
                  const isPending = sub.status === 'PENDING';
                  return (
                    <React.Fragment key={sub.id}>
                      <tr className={`hover:bg-muted/20 transition-colors ${expandedSubmission === sub.id ? 'bg-muted/10' : ''}`}>
                        <td className="p-4">
                        <div className="font-medium text-foreground">{sub.user?.name || sub.user?.username || 'Unknown'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-foreground font-medium">{sub.question?.title || 'Unknown Problem'}</div>
                        <div className="text-xs text-muted-foreground">{sub.question?.contest?.title || 'Unknown Contest'}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-muted/40 font-mono text-[11px] text-muted-foreground">
                          {sub.language}
                        </span>
                      </td>
                      <td className="p-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                            <CheckCircle size={12} /> Accepted
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
                            <Clock size={12} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                            <XCircle size={12} /> {sub.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                          className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium transition-colors"
                        >
                          {expandedSubmission === sub.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                      </tr>
                      {expandedSubmission === sub.id && (
                        <tr className="bg-black/40 border-b border-border">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 border-t border-border">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Code size={14} className="text-sky-400" /> Source Code</h4>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(sub.code)} 
                                    className="text-xs px-3 py-1 bg-muted hover:bg-muted/80 text-foreground rounded border border-border transition-colors"
                                  >
                                    Copy Code
                                  </button>
                                  <button onClick={() => setExpandedSubmission(null)} className="text-muted-foreground hover:text-foreground">
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              </div>
                              <pre className="p-4 rounded-lg bg-[#0A0A0A] border border-border/50 overflow-x-auto text-xs font-mono text-sky-100 max-h-96 custom-scrollbar">
                                <code>{sub.code || 'No code found.'}</code>
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
