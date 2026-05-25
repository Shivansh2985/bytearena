'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Users, Code2, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

// We no longer need the custom LiveVideo component since LiveKit provides VideoConference.

export default function AdminContestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: contestId } = React.use(params);
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [subPage, setSubPage] = useState(1);

  const [livekitToken, setLivekitToken] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;
    
    apiFetch(`/api/contests/${contestId}`)
      .then(res => res.json())
      .then(data => {
        setContest(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [contestId]);

  useEffect(() => {
    if (loading || !contest) return;
    
    // Fetch a LiveKit token for the admin to view all streams in this contest's room
    apiFetch(`/api/proctoring/token?room=contest-${contestId}`)
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setLivekitToken(data.token);
        }
      })
      .catch(console.error);
      
  }, [loading, contest, contestId]);

  if (loading) {
    return (
      <AppLayout currentPath="/admin/contests" role="admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!contest || contest.error) {
    return (
      <AppLayout currentPath="/admin/contests" role="admin">
        <div className="text-center py-20 text-muted-foreground">{contest?.error || 'Contest not found.'}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/admin/contests" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
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
            
            {(contest.status === 'completed' || contest.status === 'live') && (
              <button 
                onClick={async () => {
                  if(!confirm('Calculate and publish final results for this contest?')) return;
                  try {
                    const res = await apiFetch(`/api/contests/${contestId}/calculate-ratings`, { method: 'POST' });
                    const data = await res.json();
                    if(data.success) alert('Results calculated and published successfully!');
                    else alert(data.error || 'Failed to calculate results');
                  } catch(err) {
                    alert('Error calculating results');
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Trophy size={16} />
                Calculate / Publish Result
              </button>
            )}
          </div>
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
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {contest.participants.slice((page - 1) * 10, page * 10).map((p: any, idx: number) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.user.name || p.user.email}</p>
                          <p className="text-xs text-muted-foreground">Rank: #{p.rank || (page - 1) * 10 + idx + 1}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{p.score} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {contest.participants.length > 10 && (
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/50">
                      <button 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground rounded"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(contest.participants.length / 10)}</span>
                      <button 
                        onClick={() => setPage(Math.min(Math.ceil(contest.participants.length / 10), page + 1))}
                        disabled={page === Math.ceil(contest.participants.length / 10)}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground rounded"
                      >
                        Next
                      </button>
                    </div>
                  )}
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
              {(!contest.submissions || contest.submissions.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-10">No submissions yet.</p>
              ) : (
                <div className="overflow-x-auto space-y-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase border-y border-border">
                      <tr>
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">When</th>
                        <th className="px-4 py-3 font-medium">Who</th>
                        <th className="px-4 py-3 font-medium">Problem</th>
                        <th className="px-4 py-3 font-medium">Lang</th>
                        <th className="px-4 py-3 font-medium">Verdict</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(contest.submissions || []).slice((subPage - 1) * 10, subPage * 10).map((sub: any, idx: number) => (
                        <React.Fragment key={sub.id}>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-3 text-muted-foreground">{(contest.submissions || []).length - ((subPage - 1) * 10 + idx)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(sub.createdAt).toLocaleTimeString()}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{sub.user.name || sub.user.email}</td>
                            <td className="px-4 py-3 text-sky-400">{sub.question.title}</td>
                            <td className="px-4 py-3 font-mono text-xs">{sub.language}</td>
                            <td className="px-4 py-3 font-bold">
                              {sub.status === 'ACCEPTED' ? (
                                <span className="text-emerald-400">Accepted</span>
                              ) : sub.status === 'PENDING' ? (
                                <span className="text-amber-400">Pending</span>
                              ) : (
                                <span className="text-red-400">Wrong Answer</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                          {expandedSubmission === sub.id && (
                            <tr>
                              <td colSpan={7} className="p-0 border-0">
                                <div className="p-4 bg-black/40 border-y border-border/30">
                                  <pre className="p-4 rounded-lg bg-[#0A0A0A] border border-border/30 overflow-x-auto text-xs font-mono text-sky-100">
                                    <code>{sub.code}</code>
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  
                  {contest.submissions.length > 10 && (
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/50">
                      <button 
                        onClick={() => setSubPage(Math.max(1, subPage - 1))}
                        disabled={subPage === 1}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground rounded"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-muted-foreground">Page {subPage} of {Math.ceil(contest.submissions.length / 10)}</span>
                      <button 
                        onClick={() => setSubPage(Math.min(Math.ceil(contest.submissions.length / 10), subPage + 1))}
                        disabled={subPage === Math.ceil(contest.submissions.length / 10)}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground rounded"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Proctoring Streams */}
        <div className="bg-card-elevated border border-border rounded-xl p-5 mt-6">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Users size={18} className="text-pink-400" />
            Live Proctoring Streams
          </h2>
          <div className="mb-4">
            {livekitToken ? (
              <div className="h-[400px] w-full rounded-xl overflow-hidden border border-border/50">
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={livekitToken}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud'}
                  data-lk-theme="default"
                  style={{ height: '100%' }}
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              </div>
            ) : (
              <div className="h-[200px] w-full rounded-xl border border-border/50 flex items-center justify-center bg-black/50 text-muted-foreground text-sm">
                Connecting to live feeds...
              </div>
            )}
          </div>
        </div>


      </div>
    </AppLayout>
  );
}
