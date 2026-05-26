'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Send, Maximize2, Minimize2, ChevronDown, Save, Trophy, ArrowLeft, Clock, CameraOff } from 'lucide-react';
import type { Language, Problem, ProblemStatus, RunResult } from './WorkspaceShell';
import AppLogo from '@/components/ui/AppLogo';

interface ContestTopBarProps {
  problems: Problem[];
  problemStatuses: Record<string, ProblemStatus>;
  currentProblem: number;
  onSelectProblem: (i: number) => void;
  language: Language;
  onLanguageChange: (l: Language) => void;
  onRun: () => void;
  onSubmit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  myRank: number;
  runResult: RunResult;
  mediaStream?: MediaStream | null;
  cameraBlocked?: boolean;
  onEndContest?: () => void;
  isCompleted?: boolean;
  contestTitle?: string;
  contestStartTime?: number | null;
  contestEndTime?: number | null;
}

const languages: { value: Language; label: string }[] = [
  { value: 'cpp', label: 'C++ 17' },
  { value: 'python', label: 'Python 3.11' },
  { value: 'java', label: 'Java 21' },
  { value: 'javascript', label: 'Node.js 20' },
];

const CONTEST_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const CONTEST_START = Date.now() - 23 * 60 * 1000; // started 23 min ago

function ContestTimer({ startTime, endTime }: { startTime?: number | null, endTime?: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = startTime || CONTEST_START;
    const calc = () => setElapsed(Date.now() - start);
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const duration = endTime && startTime ? endTime - startTime : CONTEST_DURATION;
  const remaining = Math.max(0, duration - elapsed);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 15 * 60 * 1000;
  const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
      isUrgent
        ? 'bg-red-500/10 border-red-500/30' :'bg-muted/40 border-border'
    }`}>
      <Clock size={13} className={isUrgent ? 'text-red-400' : 'text-muted-foreground'} />
      <div>
        <span className={`font-mono text-sm font-bold metric-value ${isUrgent ? 'text-red-300' : 'text-foreground'}`}>
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
        <div className="h-0.5 bg-muted rounded-full mt-0.5 overflow-hidden w-20">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-400' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ContestTopBar({
  problems,
  problemStatuses,
  currentProblem,
  onSelectProblem,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  isFullscreen,
  onToggleFullscreen,
  saveStatus,
  myRank,
  runResult,
  mediaStream,
  cameraBlocked,
  onEndContest,
  isCompleted = false,
  contestTitle = 'Practice',
  contestStartTime,
  contestEndTime,
}: ContestTopBarProps) {
  const [langOpen, setLangOpen] = useState(false);
  const isRunning = runResult.status === 'running' && runResult.actionType !== 'submit';
  const isSubmitting = runResult.status === 'running' && runResult.actionType === 'submit';
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream && !cameraBlocked) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream, cameraBlocked]);

  const saveLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Unsaved';
  const saveCls = saveStatus === 'saved' ? 'text-emerald-400' : saveStatus === 'saving' ? 'text-amber-300' : 'text-red-400';

  return (
    <header className="h-14 glass border-b border-border flex items-center px-3 gap-3 flex-shrink-0 z-20">
      {/* Logo + back */}
      <Link
        href="/user-dashboard"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group flex-shrink-0"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        <AppLogo size={22} />
        <span className="hidden md:block text-xs font-semibold text-foreground">{contestTitle}</span>
      </Link>

      <div className="w-px h-6 bg-border flex-shrink-0" />

      {/* Question navigation */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {problems.map((p, i) => {
          const status = problemStatuses[p.id] ?? p.status;
          return (
            <button
              key={`qnav-${p.id}`}
              onClick={() => onSelectProblem(i)}
              className={`q-nav-btn ${
                i === currentProblem
                  ? 'current'
                  : status === 'answered' ?'answered' :'unattempted'
              }`}
              title={`Q${i + 1}: ${p.title} — ${p.points}pts`}
              aria-label={`Navigate to question ${i + 1}`}
              aria-current={i === currentProblem ? 'true' : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-border flex-shrink-0" />

      {/* Timer / Completed Badge */}
      {isCompleted ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
        </div>
      ) : (
        <ContestTimer startTime={contestStartTime} endTime={contestEndTime} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Proctoring Video Box */}
      {!isCompleted && (
        <div className={`hidden md:flex relative w-16 h-10 rounded-md overflow-hidden border shadow-inner items-center justify-center transition-all ${cameraBlocked ? 'border-red-500/50 bg-red-500/10' : 'border-border bg-black/50'}`}>
          {!cameraBlocked ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                muted
                playsInline
              />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400 pulse-live shadow-md" />
            </>
          ) : (
            <CameraOff size={16} className="text-red-400 animate-pulse" />
          )}
        </div>
      )}

      {/* Save status */}
      {!isCompleted && (
        <div className={`hidden md:flex items-center gap-1.5 text-xs ${saveCls}`}>
          <Save size={11} />
          {saveLabel}
        </div>
      )}

      {/* My rank */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
        <Trophy size={12} className="text-amber-400" />
        <span className="text-xs text-muted-foreground">Rank</span>
        <span className="text-xs font-bold text-foreground metric-value">#{myRank}</span>
      </div>

      {/* Language selector */}
      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
        >
          <span className="font-mono">{languages.find((l) => l.value === language)?.label}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
        {langOpen && (
          <div className="absolute right-0 top-10 w-40 glass border border-border rounded-xl shadow-2xl z-50 fade-in overflow-hidden">
            {languages.map((l) => (
              <button
                key={`lang-${l.value}`}
                onClick={() => { onLanguageChange(l.value); setLangOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted/40 transition-colors ${
                  language === l.value ? 'text-primary bg-primary/5' : 'text-foreground'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Run */}
      {!isCompleted && (
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <div className="w-3.5 h-3.5 border border-emerald-300/40 border-t-emerald-300 rounded-full animate-spin" />
          ) : (
            <Play size={13} />
          )}
          Run
        </button>
      )}

      {/* Submit */}
      {!isCompleted && (
        <button
          onClick={onSubmit}
          disabled={isSubmitting || isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg btn-primary text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isRunning ? (
            <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={13} />
          )}
          Submit
        </button>
      )}

      {/* End Contest */}
      {!isCompleted && (
        <button
          onClick={onEndContest}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-150 active:scale-95"
        >
          End Contest
        </button>
      )}

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex-shrink-0"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
    </header>
  );
}