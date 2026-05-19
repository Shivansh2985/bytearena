'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Eye, AlertTriangle, Camera, CameraOff, Monitor, ShieldOff, Users, Activity, X, CheckCircle,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Participant {
  id: string;
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
}

const participants: Participant[] = [
  { id: 'p1', name: 'Rahul Kumar', avatar: 'RK', rank: 42, score: 1800, status: 'clean', warnings: 0, cameraStatus: 'active', tabSwitches: 0, lastActivity: '30s ago', contest: 'ByteBlitz #18' },
  { id: 'p2', name: 'Arjun Mehta', avatar: 'AM', rank: 1, score: 2800, status: 'clean', warnings: 0, cameraStatus: 'active', tabSwitches: 1, lastActivity: '12s ago', contest: 'ByteBlitz #18' },
  { id: 'p3', name: 'Sneha Rao', avatar: 'SR', rank: 89, score: 1200, status: 'warning', warnings: 2, cameraStatus: 'away', tabSwitches: 3, lastActivity: '2 min ago', contest: 'ByteBlitz #18' },
  { id: 'p4', name: 'Vikram Singh', avatar: 'VS', rank: 156, score: 900, status: 'flagged', warnings: 5, cameraStatus: 'blocked', tabSwitches: 8, lastActivity: '5 min ago', contest: 'ByteBlitz #18' },
  { id: 'p5', name: 'Priya Sharma', avatar: 'PS', rank: 3, score: 2600, status: 'clean', warnings: 0, cameraStatus: 'active', tabSwitches: 0, lastActivity: '8s ago', contest: 'AlgoArena #6' },
  { id: 'p6', name: 'Karan Patel', avatar: 'KP', rank: 7, score: 2200, status: 'warning', warnings: 1, cameraStatus: 'active', tabSwitches: 2, lastActivity: '45s ago', contest: 'AlgoArena #6' },
];

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

  const filtered = participants.filter((p) =>
    contestFilter === 'all' || p.contest === contestFilter
  );

  const flaggedCount = participants.filter((p) => p.status === 'flagged').length;
  const warningCount = participants.filter((p) => p.status === 'warning').length;

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
            <p className="text-sm text-muted-foreground mt-0.5">Monitor participants in real-time across all active contests</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-400 pulse-live" />
            <span className="text-sm font-medium text-red-300">2 Live Contests</span>
          </div>
        </div>

        {/* Alert stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Participants', value: participants.length.toString(), color: 'sky', icon: Users },
            { label: 'Clean', value: participants.filter((p) => p.status === 'clean').length.toString(), color: 'emerald', icon: CheckCircle },
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
        <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 w-fit">
          {['all', 'ByteBlitz #18', 'AlgoArena #6'].map((f) => (
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
                    <div className={`w-full h-24 rounded-lg mb-3 flex flex-col items-center justify-center gap-1 border ${
                      p.cameraStatus === 'active' ? 'bg-slate-900 border-emerald-500/20' :
                      p.cameraStatus === 'blocked'? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <CamIcon size={20} className={camCfg.color} />
                      <span className={`text-xs font-medium ${camCfg.color}`}>{camCfg.label}</span>
                      {p.cameraStatus === 'active' && (
                        <div className="flex items-center gap-1">
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
              <div className={`w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2 border ${
                selectedParticipant.cameraStatus === 'active' ? 'bg-slate-900 border-emerald-500/20' :
                selectedParticipant.cameraStatus === 'blocked'? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {selectedParticipant.cameraStatus === 'active' ? (
                  <>
                    <Camera size={24} className="text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">Live Feed Active</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 pulse-live" />
                      <span className="text-xs text-red-300">Recording</span>
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

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
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
