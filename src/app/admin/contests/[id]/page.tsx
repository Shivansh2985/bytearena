'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Users, Code2, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

function LiveVideo({ stream, userName }: { stream: MediaStream, userName: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-background/30 group">
      <div className="aspect-video relative bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-[10px] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-foreground truncate">{userName}</p>
        <p className="text-[10px] text-emerald-400 mt-0.5">Real-time WebRTC Feed</p>
      </div>
    </div>
  );
}

export default function AdminContestDetailsPage() {
  const params = useParams();
  const contestId = params?.id as string;
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const [streams, setStreams] = useState<Record<string, MediaStream>>({});

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

  useEffect(() => {
    if (loading) return;
    const socket = io({ path: '/api/socket' });
    const peerConnections: Record<string, RTCPeerConnection> = {};

    socket.on('connect', () => {
      socket.emit('admin-joined');
    });

    socket.on('webrtc-offer', async (data) => {
      if (!data.userId) return;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnections[data.userId] = pc;
      
      pc.ontrack = (event) => {
        setStreams(prev => ({ ...prev, [data.userId]: event.streams[0] }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            toSocketId: data.fromSocketId,
            userId: 'admin' // identify as admin
          });
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          answer: pc.localDescription,
          toSocketId: data.fromSocketId,
        });
      } catch (err) {
        console.error('WebRTC error', err);
      }
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      if (!data.userId) return;
      const pc = peerConnections[data.userId];
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('ICE Error', err);
        }
      }
    });

    return () => {
      socket.disconnect();
      Object.values(peerConnections).forEach(pc => pc.close());
    };
  }, [loading]);

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
            
            {contest.status === 'completed' && (
              <button 
                onClick={async () => {
                  if(!confirm('Calculate final ratings for this contest?')) return;
                  try {
                    const res = await fetch(`/api/contests/${contestId}/calculate-ratings`, { method: 'POST' });
                    const data = await res.json();
                    if(data.success) alert('Ratings updated successfully!');
                    else alert(data.error || 'Failed to update ratings');
                  } catch(err) {
                    alert('Error calculating ratings');
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Calculate Ratings
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
                <div className="overflow-x-auto">
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
                      {contest.submissions.map((sub: any, idx: number) => (
                        <React.Fragment key={sub.id}>
                          <tr className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-3 text-muted-foreground">{contest.submissions.length - idx}</td>
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
              {Object.entries(streams).map(([userId, stream]) => {
                const participant = contest.participants?.find((p: any) => p.user.id === userId);
                const userName = participant?.user.name || participant?.user.email || 'Unknown User';
                return <LiveVideo key={`stream-${userId}`} stream={stream} userName={userName} />;
              })}
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
