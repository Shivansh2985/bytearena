'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Users, Code2, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default function AdminContestDetailsPage() {
  const params = useParams();
  const contestId = params?.id as string;
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contests/${contestId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setContest(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [contestId]);

  if (loading) {
    return (
      <AppLayout currentPath="/admin/contests" role="admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!contest) {
    return (
      <AppLayout currentPath="/admin/contests" role="admin">
        <div className="text-center py-20 text-muted-foreground">Contest not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/admin/contests" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/admin/contests" className="text-sky-400 hover:text-sky-300 text-sm font-medium mb-2 inline-block">
            &larr; Back to Contests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{contest.title}</h1>
            <Badge variant={contest.status as any} dot={contest.status === 'live'}>{contest.status}</Badge>
            <Badge variant={contest.difficulty.toLowerCase()}>{contest.difficulty}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(contest.startTime).toLocaleString()} - {new Date(contest.endTime).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participants */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card-elevated border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                <Users size={18} className="text-primary" />
                Participants ({contest.participants?.length || 0})
              </h2>
              {contest.participants?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No participants yet.</p>
              ) : (
                <div className="space-y-3">
                  {contest.participants.map((p: any, idx: number) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.user.name || p.user.email}</p>
                        <p className="text-xs text-muted-foreground">Rank: #{idx + 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{p.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submissions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card-elevated border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                <Code2 size={18} className="text-accent" />
                Submissions ({contest.submissions?.length || 0})
              </h2>
              {contest.submissions?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {contest.submissions.map((sub: any) => (
                    <div key={sub.id} className="border border-border/50 rounded-xl overflow-hidden bg-background/30">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                      >
                        <div className="flex items-center gap-4">
                          {sub.status === 'ACCEPTED' ? (
                            <CheckCircle size={18} className="text-emerald-400" />
                          ) : sub.status === 'PENDING' ? (
                            <Clock size={18} className="text-amber-400" />
                          ) : (
                            <XCircle size={18} className="text-red-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{sub.user.name || sub.user.email}</p>
                            <p className="text-xs text-muted-foreground">{sub.question.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono px-2 py-1 bg-border/50 rounded-md text-muted-foreground">{sub.language}</span>
                          <span className="text-xs font-semibold text-foreground">{sub.score} pts</span>
                          {expandedSubmission === sub.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                        </div>
                      </div>
                      
                      {expandedSubmission === sub.id && (
                        <div className="p-4 border-t border-border/50 bg-black/40">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Submitted Code</p>
                          <pre className="p-4 rounded-lg bg-[#0A0A0A] border border-border/30 overflow-x-auto text-xs font-mono text-sky-100">
                            <code>{sub.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Snapshots */}
        <div className="bg-card-elevated border border-border rounded-xl p-5 mt-6">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Users size={18} className="text-pink-400" />
            Proctoring Snapshots ({contest.snapshots?.length || 0})
          </h2>
          {contest.snapshots?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No snapshots taken yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {contest.snapshots.map((snap: any) => (
                <div key={snap.id} className="border border-border/50 rounded-lg overflow-hidden bg-background/30 group">
                  <div className="aspect-video relative bg-black/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={snap.imageUrl} alt="Proctor Snapshot" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-foreground truncate">{snap.user.name || snap.user.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(snap.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
