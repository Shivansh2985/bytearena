import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';

interface StopwatchProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  time: number;
}

export function Stopwatch({ isRunning, onStart, onStop, time }: StopwatchProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-2 bg-[#121216] border border-border rounded-lg px-3 py-1.5">
      <span className="text-sky-400 font-mono text-sm w-12 text-center">{formatTime(time)}</span>
      {isRunning ? (
        <button onClick={onStop} className="text-red-400 hover:text-red-300">
          <Square size={14} />
        </button>
      ) : (
        <button onClick={onStart} className="text-emerald-400 hover:text-emerald-300">
          <Play size={14} />
        </button>
      )}
    </div>
  );
}
