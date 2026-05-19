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
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const fetchSocket = async () => {
      await fetch('/api/socket');
      const newSocket = io({ path: '/api/socket' });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server as admin');
        newSocket.emit('join-room', 'admin-room', 'admin-123', 'admin');
      });

      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data);
      });

      // Handle incoming WebRTC offer from a participant
      newSocket.on('webrtc-offer', async (data) => {
        if (!peerConnectionRef.current) {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          peerConnectionRef.current = pc;

          pc.ontrack = (event) => {
            if (videoRef.current) {
              videoRef.current.srcObject = event.streams[0];
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              newSocket.emit('webrtc-ice-candidate', {
                candidate: event.candidate,
                toSocketId: data.fromSocketId
              });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          newSocket.emit('webrtc-answer', {
            answer: pc.localDescription,
            toSocketId: data.fromSocketId
          });
        }
      });

      newSocket.on('webrtc-ice-candidate', async (data) => {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
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

    return () => {
      socket?.disconnect();
      peerConnectionRef.current?.close();
    };
  }, []);

  const filtered = liveParticipants.filter((p) =>
    contestFilter === 'all' || p.contest === contestFilter
  );

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
          {/* Participant grid */}
          <div className={`${selectedParticipant ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => {
                const cfg = statusConfig[p.status];
                const camCfg = cameraConfig[p.cameraStatus];
                const CamIcon = camCfg.icon;
                return (
                  <div
                    key={p.id}
                    className={`bg-card-elevated border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                      p.status === 'flagged' ? 'border-red-500/30 bg-red-500/5' :
                      p.status === 'warning'? 'border-amber-500/30' : 'border-border'
                    } ${selectedParticipant?.id === p.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedParticipant(selectedParticipant?.id === p.id ? null : p)}
                  >
                    {/* Camera preview */}
                    <div className={`w-full h-24 rounded-lg mb-3 flex flex-col items-center justify-center gap-1 border overflow-hidden relative ${
                      p.cameraStatus === 'active' ? 'bg-slate-900 border-emerald-500/20' :
                      p.cameraStatus === 'blocked'? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {p.latestSnapshot ? (
                        <img src={p.latestSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <CamIcon size={20} className={camCfg.color} />
                          <span className={`text-xs font-medium ${camCfg.color}`}>{camCfg.label}</span>
                        </>
                      )}
                      
                      {p.cameraStatus === 'active' && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-live" />
                          <span className="text-[10px] text-red-300">REC</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.contest}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-lg border font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs font-bold text-foreground metric-value">#{p.rank}</p>
                        <p className="text-[10px] text-muted-foreground">Rank</p>
                      </div>
                      <div>
                        <p className={`text-xs font-bold metric-value ${p.warnings > 0 ? 'text-amber-400' : 'text-foreground'}`}>{p.warnings}</p>
                        <p className="text-[10px] text-muted-foreground">Warnings</p>
                      </div>
                      <div>
                        <p className={`text-xs font-bold metric-value ${p.tabSwitches > 2 ? 'text-red-400' : 'text-foreground'}`}>{p.tabSwitches}</p>
                        <p className="text-[10px] text-muted-foreground">Tab Switches</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selectedParticipant && (
            <div className="bg-card-elevated border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Participant Details</h2>
                <button onClick={() => setSelectedParticipant(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                  {selectedParticipant.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{selectedParticipant.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedParticipant.contest}</p>
                </div>
              </div>

              {/* Live camera feed */}
              <div className={`w-full h-48 rounded-xl flex flex-col items-center justify-center gap-2 border overflow-hidden relative ${
                selectedParticipant.cameraStatus === 'active' ? 'bg-slate-900 border-emerald-500/20' :
                selectedParticipant.cameraStatus === 'blocked'? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {selectedParticipant.cameraStatus === 'active' ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline controls className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="z-10 absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded">
                      <span className="w-2 h-2 rounded-full bg-red-400 pulse-live" />
                      <span className="text-xs text-red-300">Live Feed Active</span>
                    </div>
                  </>
                ) : (
                  <>
                    <CameraOff size={24} className="text-red-400" />
                    <span className="text-sm text-red-400 font-medium">Camera {selectedParticipant.cameraStatus}</span>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Rank', value: `#${selectedParticipant.rank}` },
                  { label: 'Score', value: selectedParticipant.score.toLocaleString() },
                  { label: 'Warnings', value: selectedParticipant.warnings.toString() },
                  { label: 'Tab Switches', value: selectedParticipant.tabSwitches.toString() },
                  { label: 'Last Activity', value: selectedParticipant.lastActivity },
                  { label: 'Status', value: statusConfig[selectedParticipant.status].label },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Proctoring Logs */}
              {selectedParticipant.logs && selectedParticipant.logs.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border-t border-border pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proctoring Log</h3>
                  {selectedParticipant.logs.map((log, idx) => (
                    <div key={idx} className="bg-background/50 border border-border/50 rounded-lg p-2.5 flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-mono">{log.time}</span>
                      <p className={`text-xs ${log.event.includes('focus lost') || log.event.includes('blur') ? 'text-amber-400' : 'text-foreground'}`}>
                        {log.event}
                      </p>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground italic mt-2">
                    Note: All proctoring events are reviewed by administrators after the contest.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-border">
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm font-medium hover:bg-amber-500/10 transition-colors">
                  <AlertTriangle size={14} />
                  Issue Warning
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                  <ShieldOff size={14} />
                  Block from Contest
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                  <Monitor size={14} />
                  View Snapshots
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
