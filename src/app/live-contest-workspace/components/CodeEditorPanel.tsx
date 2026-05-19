'use client';
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Copy, RotateCcw, Settings2, Video, VideoOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Language, Problem } from './WorkspaceShell';
import ToastProvider from '@/components/ui/Toast';

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((m) => m.default),
  { ssr: false, loading: () => (
    <div className="flex-1 bg-[#0A0A12] animate-pulse flex items-center justify-center">
      <span className="text-xs text-muted-foreground">Loading editor...</span>
    </div>
  )}
);

interface CodeEditorPanelProps {
  code: string;
  onChange: (val: string) => void;
  language: Language;
  problem: Problem;
  cameraBlocked: boolean;
  onToggleCamera: () => void;
}

const fontSizes = ['12px', '13px', '14px', '15px', '16px'];

export default function CodeEditorPanel({
  code,
  onChange,
  language,
  problem,
  cameraBlocked,
  onToggleCamera,
}: CodeEditorPanelProps) {
  const [fontSize, setFontSize] = useState('13px');
  const [showSettings, setShowSettings] = useState(false);
  const [tabSize, setTabSize] = useState(4);
  const [wordWrap, setWordWrap] = useState(false);
  const [cameraStream, setCameraStream] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    toast.success('Code copied to clipboard');
  };

  const handleReset = () => {
    toast.info('Code reset to template');
  };

  // Extensions loaded dynamically to avoid SSR
  const getExtensions = () => {
    const exts: unknown[] = [];
    return exts;
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A12] relative">
      <ToastProvider />

      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {language === 'cpp' ? 'main.cpp' : language === 'python' ? 'solution.py' : language === 'java' ? 'Solution.java' : 'solution.js'}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{code.split('\n').length} lines</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{code.length} chars</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Camera toggle */}
          <button
            onClick={onToggleCamera}
            className={`p-1.5 rounded-lg transition-colors ${
              cameraBlocked
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' :'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
            title={cameraBlocked ? 'Camera blocked — click to re-enable' : 'Camera active — proctoring on'}
          >
            {cameraBlocked ? <VideoOff size={14} /> : <Video size={14} />}
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Copy code to clipboard"
          >
            <Copy size={14} />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Reset to template code"
          >
            <RotateCcw size={14} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}
              title="Editor settings"
            >
              <Settings2 size={14} />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-9 w-52 glass border border-border rounded-xl shadow-2xl z-50 fade-in p-3 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Font Size</label>
                  <div className="flex gap-1 flex-wrap">
                    {fontSizes.map((fs) => (
                      <button
                        key={`fs-${fs}`}
                        onClick={() => setFontSize(fs)}
                        className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                          fontSize === fs
                            ? 'bg-primary text-white' :'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {fs}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Tab Size</label>
                  <div className="flex gap-1">
                    {[2, 4, 8].map((ts) => (
                      <button
                        key={`ts-${ts}`}
                        onClick={() => setTabSize(ts)}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          tabSize === ts
                            ? 'bg-primary text-white' :'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ts}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground font-medium">Word Wrap</label>
                  <button
                    onClick={() => setWordWrap(!wordWrap)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${wordWrap ? 'bg-primary' : 'bg-muted'}`}
                    role="switch"
                    aria-checked={wordWrap}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wordWrap ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera preview (proctoring) */}
      {!cameraBlocked && (
        <div className="absolute top-12 left-3 z-10 w-28 h-20 rounded-lg border border-border overflow-hidden shadow-xl">
          <div className="w-full h-full bg-[#0A0A12] flex flex-col items-center justify-center gap-1">
            <Video size={16} className="text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          <div className="absolute bottom-1 left-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-live" />
            <span className="text-[9px] text-red-300">REC</span>
          </div>
        </div>
      )}

      {/* Camera blocked warning */}
      {cameraBlocked && (
        <div className="absolute top-12 left-3 z-10 w-28 h-20 rounded-lg border border-red-500/40 bg-red-500/10 flex flex-col items-center justify-center gap-1 shadow-xl">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-[10px] text-red-300 text-center leading-tight px-1">Camera blocked</span>
        </div>
      )}

      {/* Code editor */}
      <div className="flex-1 overflow-hidden" style={{ fontSize }}>
        <CodeMirror
          value={code}
          onChange={(val) => {
            if (val !== code) onChange(val);
          }}
          height="100%"
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            bracketMatching: true,
            autocompletion: true,
            highlightActiveLine: true,
            indentOnInput: true,
            tabSize,
          }}
          style={{
            height: '100%',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize,
          }}
          extensions={getExtensions()}
        />
      </div>
    </div>
  );
}