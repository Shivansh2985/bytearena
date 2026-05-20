'use client';
import React, { useState } from 'react';
import { AlertTriangle, X, Eye, ShieldAlert, Camera } from 'lucide-react';

interface ProctoringOverlayProps {
  warning: boolean;
  cameraBlocked: boolean;
  warningLogs?: any[];
}

export default function ProctoringOverlay({ warning, cameraBlocked, warningLogs = [] }: ProctoringOverlayProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hasAlert = warning || cameraBlocked;

  if (!hasAlert && !logOpen) return null;

  return (
    <>
      {/* Warning toast */}
      {hasAlert && !dismissed && (
        <div className="fixed bottom-4 left-4 z-[200] max-w-xs fade-in">
          <div className={`rounded-xl border shadow-2xl p-4 ${
            cameraBlocked
              ? 'bg-red-950/90 border-red-500/50' :'bg-amber-950/90 border-amber-500/50'
          } backdrop-blur-md`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                cameraBlocked ? 'bg-red-500/20' : 'bg-amber-500/20'
              }`}>
                {cameraBlocked ? (
                  <Camera size={15} className="text-red-400" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold mb-0.5 ${cameraBlocked ? 'text-red-300' : 'text-amber-300'}`}>
                  {cameraBlocked ? 'Camera Blocked' : 'Focus Lost — Warning'}
                </p>
                <p className="text-xs text-foreground/70 leading-snug">
                  {cameraBlocked
                    ? 'Your camera has been blocked. Proctoring requires camera access throughout the contest.' :'You navigated away from the contest window. This has been flagged and logged.'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setLogOpen(true)}
                    className="text-xs text-primary hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <Eye size={11} />
                    View log
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring log modal */}
      {logOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLogOpen(false)} />
          <div className="relative w-full max-w-md glass border border-border rounded-xl shadow-2xl fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Proctoring Log</h3>
              </div>
              <button
                onClick={() => setLogOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label="Close proctoring log"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {warningLogs.map((log) => (
                <div
                  key={log.id || Math.random().toString()}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    log.severity === 'high' ?'bg-red-500/8 border-red-500/20'
                      : log.severity === 'medium' ?'bg-amber-500/8 border-amber-500/20' :'bg-muted/20 border-border'
                  }`}
                >
                  <span className={`text-xs font-mono flex-shrink-0 ${
                    log.severity === 'high' ? 'text-red-400' :
                    log.severity === 'medium' ? 'text-amber-400' : 'text-muted-foreground'
                  }`}>
                    {log.time}
                  </span>
                  <p className="text-xs text-foreground/80 leading-snug">{log.message}</p>
                  {log.severity === 'high' && (
                    <span className="flex-shrink-0 text-xs bg-red-500/15 text-red-300 border border-red-500/25 rounded-full px-1.5 py-0.5 font-medium">
                      Flag
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-border bg-amber-500/5">
              <p className="text-xs text-amber-200/70 leading-relaxed">
                <strong className="text-amber-300">Note:</strong> All proctoring events are reviewed by administrators after the contest. Repeated violations may result in disqualification.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}