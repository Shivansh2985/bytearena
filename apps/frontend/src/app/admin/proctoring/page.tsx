'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Eye, AlertTriangle, Camera, CameraOff, Monitor, ShieldOff, Users, Activity, X, CheckCircle, ChevronRight, Video, Volume2, VolumeX, Maximize, UserX, Mic, MicOff } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';
import { useSession } from 'next-auth/react';
import { LiveKitRoom, useTracks, VideoTrack, AudioTrack, useConnectionState } from '@livekit/components-react';
import { Track, Room, createLocalAudioTrack } from 'livekit-client';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import '@livekit/components-styles';

function AdminMicControls({ selectedParticipantId, contestId }: { selectedParticipantId: string, contestId: string }) {
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [micEnabled, setMicEnabled] = useState(false);
  const voiceRoomRef = useRef<Room | null>(null);

  // Hard cleanup when participant changes or unmounts
  useEffect(() => {
    return () => {
      if (voiceRoomRef.current) {
        voiceRoomRef.current.disconnect();
        voiceRoomRef.current = null;
      }
    };
  }, [selectedParticipantId]);

  useEffect(() => {
    // If selected participant changes, and mic was enabled, disable it securely
    if (micEnabled) {
      setMicEnabled(false);
      socket?.emit('admin:voice-disable', { contestId, targetUserId: selectedParticipantId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParticipantId]); // Only trigger when ID changes

  const toggleMic = async () => {
    if (!selectedParticipantId || !contestId || !socket || !session?.user?.id) return;
    
    if (micEnabled) {
      // Disable
      socket.emit('admin:voice-disable', { contestId, targetUserId: selectedParticipantId });
      if (voiceRoomRef.current) {
        voiceRoomRef.current.disconnect();
        voiceRoomRef.current = null;
      }
      setMicEnabled(false);
    } else {
      // Enable
      try {
        const adminId = session.user.id;
        const roomName = `voice-${contestId}-${selectedParticipantId}-${adminId}`;
        const res = await apiFetch(`/api/proctoring/token?room=${roomName}`);
        const data = await res.json();
        
        if (data.token) {
           const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud';
           const room = new Room();
           await room.connect(livekitUrl, data.token);
           const audioTrack = await createLocalAudioTrack();
           await room.localParticipant.publishTrack(audioTrack);
           voiceRoomRef.current = room;
           
           socket.emit('admin:voice-enable', { contestId, targetUserId: selectedParticipantId });
           setMicEnabled(true);
        }
      } catch (err) {
        console.error('Failed to start isolated voice room', err);
      }
    }
  };

  return (
    <button onClick={toggleMic} className={`p-2 rounded text-white backdrop-blur transition-colors ${micEnabled ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/50 hover:bg-black/80'}`} title={micEnabled ? "Mute Microphone" : "Talk to Contestant"}>
       {micEnabled ? <Mic size={16}/> : <MicOff size={16}/>}
    </button>
  );
}

function SingleParticipantVideo({ identity, contestId }: { identity: string, contestId: string }) {
  const tracks = useTracks([Track.Source.Camera]);
  const audioTracks = useTracks([Track.Source.Microphone]);
  const track = tracks.find(t => t.participant.identity === identity);
  const audioTrack = audioTracks.find(t => t.participant.identity === identity);
  
  const connectionState = useConnectionState();
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log(`[Admin] Checking subscription for identity: ${identity}`);
    if (track) {
      console.log(`[Admin] Found Track.Source.Camera for ${identity}.`);
      console.log(`[Admin] Track details:`, { 
        participant: track.participant.identity, 
        source: track.source, 
        kind: track.publication?.kind 
      });
    }
  }, [track, identity]);
  
  if (!track) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-muted-foreground text-sm flex-col gap-2">
        <div className={`w-8 h-8 rounded-full ${connectionState === 'disconnected' ? 'bg-red-500/20' : 'bg-muted/20 animate-pulse'} flex items-center justify-center`}>
          <Camera size={14} className={connectionState === 'disconnected' ? 'text-red-400' : 'text-muted-foreground'} />
        </div>
        {connectionState === 'connecting' ? 'Connecting...' : 
         connectionState === 'disconnected' ? 'TRACK_UNSUBSCRIBED / MEDIA_RECOVERING' : 'Waiting for Video Track...'}
        <span className="text-[10px] opacity-50 uppercase tracking-widest">{connectionState}</span>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="w-full h-full relative group">
      <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      {audioTrack && !isMuted && <AudioTrack trackRef={audioTrack} />}
      
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur">
          {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
        </button>
        <AdminMicControls selectedParticipantId={identity} contestId={contestId} />
        <button onClick={() => containerRef.current?.requestFullscreen()} className="p-2 bg-black/50 hover:bg-black/80 rounded text-white backdrop-blur">
          <Maximize size={16}/>
        </button>
      </div>
    </div>
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
  logs?: { time: string, event: string }[];
}

const statusConfig = {
  clean: { label: 'Clean', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  flagged: { label: 'Flagged', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

function ContestSnapshots({ contestId, userId, isAdmin }: { contestId: string, userId?: string, isAdmin?: boolean }) {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [enlargedSnap, setEnlargedSnap] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;
    
    const fetchSnaps = () => {
      apiFetch(`/api/contests/${contestId}`)
        .then(res => res.json())
        .then(data => {
          if (data.snapshots) {
            let filtered = data.snapshots;
            if (userId) {
              filtered = filtered.filter((s: any) => s.userId === userId || s.user?.id === userId);
            }
            setSnapshots(filtered);
          }
        })
        .catch(console.error);
    };

    fetchSnaps();
    const interval = setInterval(fetchSnaps, 60000);
    return () => clearInterval(interval);
  }, [contestId, userId]);

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

function AdminProctoringContent() {
  const { socket } = useSocket();
  const [liveParticipants, setLiveParticipants] = useState<Participant[]>([]);
  const [liveContests, setLiveContests] = useState<any[]>([]);
  
  // Hierarchy State
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  
  const [livekitTokens, setLivekitTokens] = useState<Record<string, string>>({});
  const fetchedTokensRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!socket) return;
    
    const handleProctorAlert = (data: any) => console.log('Proctor alert:', data);
    
    // ❌ ISSUE: Duplicate listener registration fixed by unbinding first
    socket.off('proctor:alert', handleProctorAlert);
    socket.on('proctor:alert', handleProctorAlert);
    
    return () => {
      socket.off('proctor:alert', handleProctorAlert);
    };
  }, [socket]);


  // Data Polling
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/api/admin?action=proctoring');
        const data = await res.json();
        if (!data.error && Array.isArray(data)) {
          // Add mock contest title if missing from backend for testing hierarchy
          const enriched = data.map((p: any) => ({
            ...p,
            contestTitle: p.contestTitle || `Contest ${p.contest.substring(0,6)}`
          }));
          setLiveParticipants(enriched);
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

    fetchContests();
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the contest?')) return;
    try {
      const res = await apiFetch(`/api/admin/participants/${participantId}`, { method: 'DELETE' });
      if (res.ok) {
        setLiveParticipants(prev => prev.filter(p => p.id !== participantId));
        setSelectedParticipantId(null);
      } else {
        alert('Failed to remove participant');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing participant');
    }
  };

  // Admin Token Fetching - Passive Subscription (SFU Model)
  useEffect(() => {
    if (!selectedContestId) return;

    // Admin needs a token to join the room
    if (!fetchedTokensRef.current[selectedContestId]) {
      fetchedTokensRef.current[selectedContestId] = true;
      apiFetch(`/api/proctoring/token?room=contest-${selectedContestId}`)
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setLivekitTokens(prev => ({ ...prev, [selectedContestId]: data.token }));
          }
        })
        .catch(err => {
          console.error(err);
          fetchedTokensRef.current[selectedContestId] = false;
        });
    }
  }, [selectedContestId]);

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
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                  {/* Left side: Instant Video Stream */}
                  <div className="flex flex-col w-full md:w-2/3 border-b md:border-b-0 md:border-r border-border h-full min-h-0">
                    <div className="flex-1 bg-slate-950 relative min-h-0">
                    {/* Live Stream Always Rendered */}
                    {livekitTokens[selectedContestId!] ? (
                      <LiveKitRoom
                        video={false}
                        audio={false}
                        connect={true}
                        token={livekitTokens[selectedContestId!]}
                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud'}
                        className="w-full h-full min-h-0 flex"
                      >
                        <SingleParticipantVideo identity={selectedParticipant.userId} contestId={selectedContestId!} />
                      </LiveKitRoom>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">Initializing connection...</div>
                    )}
                    
                    {/* Warning Overlay if away/blocked */}
                    {selectedParticipant.cameraStatus !== 'active' && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <CameraOff size={48} className="text-red-400 mb-4 opacity-90 drop-shadow-md" />
                        <p className="text-lg text-red-400 font-medium drop-shadow-md bg-black/60 px-4 py-2 rounded-full border border-red-500/30">
                          CAMERA_OFF / {selectedParticipant.cameraStatus.toUpperCase()}
                        </p>
                      </div>
                    )}
                    {/* Overlay Tag */}
                    <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-md flex items-center gap-2 shadow-lg z-10">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  </div>
                  
                  {/* Snapshots vertically aligned below live stream */}
                  <div className="h-1/3 min-h-[160px] overflow-y-auto bg-background p-4 border-t border-border shrink-0">
                    {selectedContestId && <ContestSnapshots contestId={selectedContestId} userId={selectedParticipant.userId} isAdmin={true} />}
                  </div>
                </div>

                {/* Right side: Actions & Logs */}
                <div className="w-full md:w-1/3 flex flex-col min-h-0 bg-muted/10 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-3 p-6">
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
                  <div className="px-6 pb-6 mt-auto">
                    <button 
                      onClick={() => handleRemoveParticipant(selectedParticipant.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                    >
                      <UserX size={16} />
                      Remove from Contest
                    </button>
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

export default function AdminProctoringPage() {
  return (
    <RealtimeProvider>
      <AdminProctoringContent />
    </RealtimeProvider>
  );
}
