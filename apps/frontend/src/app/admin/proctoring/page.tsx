'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Eye, AlertTriangle, Camera, CameraOff, Monitor, ShieldOff, Users, Activity, X, CheckCircle, ChevronRight, Video } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { LiveKitRoom, useTracks, VideoTrack, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

function SingleParticipantVideo({ identity }: { identity: string }) {
  const tracks = useTracks([Track.Source.Camera]);
  const audioTracks = useTracks([Track.Source.Microphone]);
  const track = tracks.find(t => t.participant.identity === identity);
  const audioTrack = audioTracks.find(t => t.participant.identity === identity);
  
  if (!track) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-muted-foreground text-sm flex-col gap-2">
        <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center animate-pulse">
          <Camera size={14} className="text-muted-foreground" />
        </div>
        Connecting...
      </div>
    );
  }
  
  return (
    <>
      <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      {audioTrack && <AudioTrack trackRef={audioTrack} />}
    </>
  );
}

interface Participant {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  rank: number;
  score: number;
  status: 'clean' | 'warning' | 'flagged';
  warnings: number;
  cameraStatus: 'active' | 'blocked' | 'away';
  tabSwitches: number;
  lastActivity: string;
  contest: string; // contestId
  contestTitle?: string;
  latestSnapshot?: string | null;
  logs?: { time: string, event: string }[];
}

const statusConfig = {
  clean: { label: 'Clean', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  flagged: { label: 'Flagged', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

function ContestSnapshots({ contestId }: { contestId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [enlargedSnap, setEnlargedSnap] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;
    
    const fetchSnaps = () => {
      apiFetch(`/api/contests/${contestId}`)
        .then(res => res.json())
        .then(data => {
          if (data.snapshots) setSnapshots(data.snapshots);
        })
        .catch(console.error);
    };

    fetchSnaps();
    const interval = setInterval(fetchSnaps, 60000);
    return () => clearInterval(interval);
  }, [contestId]);

  return (
    <div className="mt-6">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <Camera size={14} className="text-sky-400" />
        Live Snapshots
      </h4>
      {snapshots.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center p-4 border border-dashed border-border rounded-lg">
          No snapshots available
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {snapshots.map((snap) => (
            <div key={snap.id} className="relative aspect-video rounded-md overflow-hidden border border-border group cursor-pointer bg-black" onClick={() => setEnlargedSnap(snap.imageUrl)}>
              <img src={snap.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-3">
                <p className="text-[9px] text-white truncate px-0.5">{snap.user?.name || snap.user?.email || 'Unknown'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {enlargedSnap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setEnlargedSnap(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img src={enlargedSnap} className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/20 shadow-2xl" />
            <button className="absolute -top-4 -right-4 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors" onClick={() => setEnlargedSnap(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProctoringPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<Participant[]>([]);
  const [liveContests, setLiveContests] = useState<any[]>([]);
  
  // Hierarchy State
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [livekitTokens, setLivekitTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    // Aggressively pre-fetch LiveKit tokens for all live contests to ensure immediate streaming
    const uniqueContests = Array.from(new Set(liveParticipants.map(p => p.contest)));
    uniqueContests.forEach(contestId => {
      if (!livekitTokens[contestId]) {
        apiFetch(`/api/proctoring/token?room=contest-${contestId}`)
          .then(res => res.json())
          .then(data => {
            if (data.token) {
              setLivekitTokens(prev => ({ ...prev, [contestId]: data.token }));
            }
          })
          .catch(console.error);
      }
    });
  }, [liveParticipants, livekitTokens]);

  useEffect(() => {
    const fetchSocket = async () => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
      const newSocket = io(socketUrl, { auth: { token: accessToken } });
      setSocket(newSocket);
      newSocket.on('proctor:alert', (data) => console.log('Proctor alert:', data));
    };

    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/api/admin?action=proctoring');
        const data = await res.json();
        if (!data.error && Array.isArray(data)) {
          // Add mock contest title if missing from backend for testing hierarchy
          const enriched = data.map(p => ({
            ...p,
            contestTitle: p.contestTitle || `Contest ${p.contest.substring(0,6)}`
          }));
          setLiveParticipants(enriched);
          
          // Auto-select removed to let admin choose the contest
        }
      } catch (err) {
        console.error('Failed to fetch proctoring data', err);
      }
    };

    const fetchContests = async () => {
      try {
        const res = await apiFetch('/api/contests?status=live');
        const data = await res.json();
        if (Array.isArray(data)) setLiveContests(data);
      } catch (err) {
        console.error('Failed to fetch live contests', err);
      }
    };

    fetchSocket();
    fetchContests();
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => { socket?.disconnect(); clearInterval(interval); };
  }, [accessToken, selectedContestId]);

  // Derived state: Merge all live contests from /api/contests with participants data
  const contests = liveContests.map(c => {
    const pCount = liveParticipants.filter(x => x.contest === c.id).length;
    return { id: c.id, title: c.title, participantsCount: pCount };
  });

  // Also include any contests that might not be marked 'live' but have active participants (edge case)
  Array.from(new Set(liveParticipants.map(p => p.contest))).forEach(id => {
    if (!contests.find(c => c.id === id)) {
      const p = liveParticipants.find(p => p.contest === id);
      contests.push({ id, title: p?.contestTitle || id, participantsCount: liveParticipants.filter(x => x.contest === id).length });
    }
  });

  const participantsInSelectedContest = liveParticipants.filter(p => p.contest === selectedContestId);
  const selectedParticipant = liveParticipants.find(p => p.id === selectedParticipantId) || null;

  return (
    <AppLayout currentPath="/admin/proctoring" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto flex flex-col h-[calc(100vh-80px)]">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-sm mb-6 bg-card-elevated px-4 py-3 rounded-xl border border-border">
          <Eye size={16} className="text-sky-400" />
          <span className="font-semibold text-foreground">Proctoring</span>
          
          {selectedContestId && (
            <>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="font-medium text-sky-400">
                {contests.find(c => c.id === selectedContestId)?.title || 'Live Contest'}
              </span>
            </>
          )}

          {selectedParticipant && (
            <>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                <Video size={14} />
                Live Stream: {selectedParticipant.name}
              </span>
            </>
          )}
        </div>

        {/* Single View Hierarchy Layout */}
        <div className="flex-1 min-h-0 flex flex-col bg-card-elevated border border-border rounded-xl overflow-hidden">
          
          {/* View 1: Contests List */}
          {!selectedContestId && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Live Contests
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {contests.length === 0 ? (
                   <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">No live contests.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {contests.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedContestId(c.id); setSelectedParticipantId(null); }}
                        className="text-left p-6 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{c.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={14} />
                          <span>{c.participantsCount} Participants</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View 2: Participants in Selected Contest */}
          {selectedContestId && !selectedParticipantId && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedContestId(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Participants in {contests.find(c => c.id === selectedContestId)?.title}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {participantsInSelectedContest.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">No participants currently live.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {participantsInSelectedContest.map(p => {
                      const cfg = statusConfig[p.status];
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedParticipantId(p.id)}
                          className="text-left p-4 rounded-xl border border-border bg-background hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm text-white font-bold shrink-0">
                              {p.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {(p.warnings > 0 || p.tabSwitches > 2) && (
                                  <span className="text-[10px] text-red-400 flex items-center gap-0.5 font-medium">
                                    <AlertTriangle size={10} /> {p.warnings + p.tabSwitches} Flags
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {p.cameraStatus === 'active' ? (
                             <Camera size={16} className="text-emerald-400" />
                          ) : (
                             <CameraOff size={16} className="text-red-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View 3: Live Stream & Action Panel */}
          {selectedParticipantId && selectedParticipant && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedParticipantId(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Monitor size={16} className="text-primary" />
                    {selectedParticipant.name}&apos;s Live Feed
                  </h3>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left side: Instant Video Stream + Snapshots */}
                <div className="flex flex-col w-full md:w-2/3 border-b md:border-b-0 md:border-r border-border h-[60vh] md:h-full">
                  <div className="flex-1 bg-slate-950 relative">
                  {selectedParticipant.cameraStatus === 'active' ? (
                    livekitTokens[selectedContestId!] ? (
                      <LiveKitRoom
                        video={false}
                        audio={true}
                        token={livekitTokens[selectedContestId!]}
                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud'}
                        className="w-full h-full"
                      >
                        <SingleParticipantVideo identity={selectedParticipant.userId} />
                      </LiveKitRoom>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-muted-foreground">Initializing connection...</div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <CameraOff size={48} className="text-red-400 mb-4 opacity-80" />
                      <p className="text-lg text-red-400 font-medium">Camera is {selectedParticipant.cameraStatus}</p>
                    </div>
                  )}
                  {/* Overlay Tag */}
                  <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-md flex items-center gap-2 shadow-lg z-10">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                </div>

                {/* Snapshots horizontally aligned below live stream */}
                <div className="h-[25vh] overflow-y-auto bg-background p-4 border-t border-border">
                  {selectedContestId && <ContestSnapshots contestId={selectedContestId} />}
                </div>
              </div>

                {/* Right side: Metrics & Logs */}
                <div className="w-full md:w-1/3 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/20 border border-border rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rank</p>
                      <p className="text-2xl font-bold text-sky-400">#{selectedParticipant.rank}</p>
                    </div>
                    <div className="bg-muted/20 border border-amber-500/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-amber-400/80 mb-1">Warnings</p>
                      <p className="text-2xl font-bold text-amber-400">{selectedParticipant.warnings}</p>
                    </div>
                    <div className="bg-muted/20 border border-red-500/20 rounded-xl p-4 text-center col-span-2">
                      <p className="text-xs text-red-400/80 mb-1">Tab Switches</p>
                      <p className="text-2xl font-bold text-red-400">{selectedParticipant.tabSwitches}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Events</h4>
                    {selectedParticipant.logs && selectedParticipant.logs.length > 0 ? (
                      <div className="space-y-2">
                         {selectedParticipant.logs.slice(0,10).map((log, i) => (
                           <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-muted/10 border border-border items-start">
                             <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{new Date(log.time).toLocaleTimeString()}</span>
                             <span className="text-foreground">{log.event}</span>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center p-6 border border-dashed border-border rounded-xl bg-muted/5">
                        No suspicious events detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
