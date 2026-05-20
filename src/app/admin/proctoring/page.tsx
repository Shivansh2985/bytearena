'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Eye, AlertTriangle, Camera, CameraOff, Monitor, ShieldOff, Users, Activity, X, CheckCircle,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

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
  contest: string;
  latestSnapshot?: string | null;
  logs?: { time: string, event: string }[];
}

// Dynamic state will be used instead of hardcoded data

const statusConfig = {
  clean: { label: 'Clean', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  flagged: { label: 'Flagged', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const cameraConfig = {
  active: { icon: Camera, color: 'text-emerald-400', label: 'Active' },
  blocked: { icon: CameraOff, color: 'text-red-400', label: 'Blocked' },
  away: { icon: AlertTriangle, color: 'text-amber-400', label: 'Away' },
};

export default function AdminProctoringPage() {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [contestFilter, setContestFilter] = useState<string>('all');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<Participant[]>([]);
  const [participantStreams, setParticipantStreams] = useState<Record<string, MediaStream>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    // Initialize Socket.IO connection
    const fetchSocket = async () => {
      await fetch('/api/socket');
      const newSocket = io({ path: '/api/socket' });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server as admin');
        newSocket.emit('join-room', 'admin-room', 'admin-123', 'admin');
        newSocket.emit('admin-joined'); // Prompt participants to initiate WebRTC
      });

      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data);
      });

      // Handle incoming WebRTC offer from a participant
      newSocket.on('webrtc-offer', async (data) => {
        const participantId = data.userId || data.fromSocketId;
        if (!peerConnectionsRef.current.has(participantId)) {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          peerConnectionsRef.current.set(participantId, pc);

          pc.ontrack = (event) => {
            setParticipantStreams(prev => ({ ...prev, [participantId]: event.streams[0] }));
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              newSocket.emit('webrtc-ice-candidate', {
                candidate: event.candidate,
                toSocketId: data.fromSocketId,
                userId: participantId
              });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          newSocket.emit('webrtc-answer', {
            answer: pc.localDescription,
            toSocketId: data.fromSocketId,
            userId: participantId
          });
        }
      });

      newSocket.on('webrtc-ice-candidate', async (data) => {
        const participantId = data.userId || data.fromSocketId;
        const pc = peerConnectionsRef.current.get(participantId);
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin?action=proctoring');
        const data = await res.json();
        if (!data.error && Array.isArray(data)) {
          setLiveParticipants(data);
        }
      } catch (err) {
        console.error('Failed to fetch users for proctoring', err);
      }
    };

    fetchSocket();
    fetchUsers();
    const interval = setInterval(fetchUsers, 3000);

    return () => {
      socket?.disconnect();
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      clearInterval(interval);
    };
  }, []);

  const filtered = liveParticipants.filter((p) =>
    contestFilter === 'all' || p.contest === contestFilter
  );

  // Group participants by contest for hierarchical view
  const groupedParticipants = filtered.reduce((acc, participant) => {
    if (!acc[participant.contest]) {
      acc[participant.contest] = [];
    }
    acc[participant.contest].push(participant);
    return acc;
  }, {} as Record<string, Participant[]>);

  const flaggedCount = liveParticipants.filter((p) => p.status === 'flagged').length;
  const warningCount = liveParticipants.filter((p) => p.status === 'warning').length;
  const uniqueContests = Array.from(new Set(liveParticipants.map(p => p.contest)));

  return (
    <AppLayout currentPath="/admin/proctoring" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Eye size={22} className="text-sky-400" />
              Live Proctoring
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor participants in real-time across all active contests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {uniqueContests.length} Live Contests
            </span>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Participants', value: liveParticipants.length.toString(), color: 'sky', icon: Users },
            { label: 'Clean', value: liveParticipants.filter((p) => p.status === 'clean').length.toString(), color: 'emerald', icon: CheckCircle },
            { label: 'Warnings', value: warningCount.toString(), color: 'amber', icon: AlertTriangle },
            { label: 'Flagged', value: flaggedCount.toString(), color: 'red', icon: ShieldOff },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card-elevated border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={`text-${s.color}-400`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold metric-value text-${s.color}-400`}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Contest filter */}
        <div className="flex flex-wrap gap-1 bg-muted/30 border border-border rounded-xl p-1 w-fit">
          {['all', ...uniqueContests].map((f) => (
            <button
              key={f}
              onClick={() => setContestFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                contestFilter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Hierarchical Participant List */}
          <div className={`${selectedParticipant ? 'xl:col-span-1' : 'xl:col-span-3'} space-y-4`}>
            {Object.entries(groupedParticipants).map(([contestName, participants]) => (
              <div key={contestName} className="bg-card-elevated border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    {contestName}
                  </h3>
                  <span className="text-xs text-muted-foreground">{participants.length} Participants</span>
                </div>
                <div className={`divide-y divide-border ${selectedParticipant ? 'max-h-[500px]' : 'max-h-[800px]'} overflow-y-auto custom-scrollbar`}>
                  {participants.map((p) => {
                    const cfg = statusConfig[p.status];
                    const camCfg = cameraConfig[p.cameraStatus];
                    const CamIcon = camCfg.icon;
                    const isSelected = selectedParticipant?.id === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedParticipant(isSelected ? null : p)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-muted/10 ${
                          isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white">
                              {p.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                              p.cameraStatus === 'active' ? 'bg-emerald-500' : p.cameraStatus === 'blocked' ? 'bg-red-500' : 'bg-amber-500'
                            }`}>
                              <CamIcon size={8} className="text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground">#{p.rank}</span>
                            </div>
                          </div>
                          
                          {(p.warnings > 0 || p.tabSwitches > 2) && (
                            <div className="flex flex-col items-end gap-1">
                              {p.warnings > 0 && <span className="text-[10px] flex items-center gap-1 text-amber-400"><AlertTriangle size={10} /> {p.warnings}</span>}
                              {p.tabSwitches > 2 && <span className="text-[10px] flex items-center gap-1 text-red-400"><ShieldOff size={10} /> {p.tabSwitches}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedParticipants).length === 0 && (
              <div className="text-center py-12 bg-card-elevated border border-border rounded-xl">
                <Users size={32} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No active participants found.</p>
              </div>
            )}
          </div>

          {/* Detail panel with Live Stream and Logs */}
          {selectedParticipant && (
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-card-elevated border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                      {selectedParticipant.avatar}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground leading-tight">{selectedParticipant.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedParticipant.contest}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedParticipant(null)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Grid for Video and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Monitor size={16} className="text-primary" /> Live Feed
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedParticipant.cameraStatus === 'active' && (
                          <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-xs font-medium text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusConfig[selectedParticipant.status].bg} ${statusConfig[selectedParticipant.status].color}`}>
                          {statusConfig[selectedParticipant.status].label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Live camera feed container */}
                    <div className={`w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-3 border overflow-hidden relative shadow-inner ${
                      selectedParticipant.cameraStatus === 'active' ? 'bg-slate-950 border-emerald-500/20' :
                      selectedParticipant.cameraStatus === 'blocked'? 'bg-red-950/20 border-red-500/20' : 'bg-amber-950/20 border-amber-500/20'
                    }`}>
                      {selectedParticipant.cameraStatus === 'active' ? (
                        <>
                          <video 
                            autoPlay 
                            playsInline 
                            controls 
                            muted={false} // Ensure admin can hear the audio
                            className="absolute inset-0 w-full h-full object-contain z-0 bg-black" 
                            ref={(el) => {
                              if (el && participantStreams[selectedParticipant.userId]) {
                                if (el.srcObject !== participantStreams[selectedParticipant.userId]) {
                                  el.srcObject = participantStreams[selectedParticipant.userId];
                                }
                              }
                            }}
                          />
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <CameraOff size={32} className="mx-auto text-red-400 mb-2 opacity-80" />
                          <p className="text-sm text-red-400 font-medium">Camera is {selectedParticipant.cameraStatus}</p>
                          <p className="text-xs text-red-400/70 mt-1 max-w-xs">Participant has disabled or blocked their camera feed.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Stats */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Session Metrics</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Rank', value: `#${selectedParticipant.rank}` },
                          { label: 'Score', value: selectedParticipant.score.toLocaleString() },
                          { label: 'Warnings', value: selectedParticipant.warnings.toString(), highlight: selectedParticipant.warnings > 0 },
                          { label: 'Tab Switches', value: selectedParticipant.tabSwitches.toString(), highlight: selectedParticipant.tabSwitches > 2 },
                        ].map((item) => (
                          <div key={item.label} className={`bg-muted/20 border rounded-lg p-2.5 ${item.highlight ? 'border-amber-500/30' : 'border-border'}`}>
                            <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                            <p className={`text-sm font-bold ${item.highlight ? 'text-amber-400' : 'text-foreground'}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/20 border border-border rounded-lg p-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Last Activity</span>
                        <span className="text-xs font-medium text-foreground">{selectedParticipant.lastActivity}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 mt-auto">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs font-semibold hover:bg-amber-500/10 transition-colors">
                        <AlertTriangle size={14} />
                        Issue Warning
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors">
                        <ShieldOff size={14} />
                        Disqualify
                      </button>
                    </div>
                  </div>
                </div>

                {/* Proctoring Logs section */}
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-muted-foreground" />
                    Proctoring Event Logs
                  </h3>
                  
                  {selectedParticipant.logs && selectedParticipant.logs.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedParticipant.logs.map((log, idx) => {
                        const isWarning = log.event.toLowerCase().includes('focus lost') || log.event.toLowerCase().includes('blur');
                        return (
                          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isWarning ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/10 border-border'
                          }`}>
                            <span className={`text-xs font-mono whitespace-nowrap mt-0.5 ${isWarning ? 'text-amber-400/80' : 'text-muted-foreground'}`}>
                              {log.time}
                            </span>
                            <div className="flex-1">
                              <p className={`text-sm ${isWarning ? 'text-amber-200' : 'text-foreground/90'}`}>
                                {log.event}
                              </p>
                            </div>
                            {isWarning && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                FLAG
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted/10 rounded-lg border border-border border-dashed">
                      <CheckCircle size={24} className="mx-auto text-emerald-500/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No suspicious events logged.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
