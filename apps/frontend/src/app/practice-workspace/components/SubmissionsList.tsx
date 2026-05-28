import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Clock, CheckCircle2, XCircle, Copy, AlertCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export function SubmissionsList({ problemId }: { problemId: string }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  useEffect(() => {
    async function fetchSubs() {
      try {
        const res = await apiFetch(`/api/submissions`);
        const data = await res.json();
        // filter by problem
        const filtered = data.submissions.filter((s: any) => s.questionId === problemId);
        setSubmissions(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSubs();
  }, [problemId]);

  if (loading) return <div className="p-4 text-muted-foreground text-sm">Loading submissions...</div>;
  if (submissions.length === 0) return <div className="p-4 text-muted-foreground text-sm">No submissions found for this problem.</div>;

  if (selectedSub) {
    return (
      <div className="flex flex-col h-full bg-[#060608]">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <button onClick={() => setSelectedSub(null)} className="text-sm text-sky-400 hover:underline">
            &larr; Back to list
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedSub.code);
              alert('Code copied!');
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors"
          >
            <Copy size={12} /> Copy Code
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex gap-4 text-sm">
            <span className={selectedSub.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400 font-semibold'}>
              {selectedSub.status}
            </span>
            <span className="text-muted-foreground">{selectedSub.language}</span>
            <span className="text-muted-foreground">{selectedSub.runtime}ms</span>
          </div>
          <div className="rounded-lg overflow-hidden border border-border">
            <SyntaxHighlighter
              language={selectedSub.language === 'python' ? 'python' : selectedSub.language === 'cpp' ? 'cpp' : 'javascript'}
              style={vscDarkPlus}
              customStyle={{ margin: 0, background: '#0a0a0c', fontSize: '13px' }}
            >
              {selectedSub.code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {submissions.map((sub: any) => (
          <div 
            key={sub.id} 
            onClick={() => setSelectedSub(sub)}
            className="bg-[#121216] border border-border hover:border-border-hover p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {sub.status === 'ACCEPTED' ? (
                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              ) : sub.status === 'WRONG_ANSWER' ? (
                <XCircle className="text-red-500 w-5 h-5" />
              ) : (
                <AlertCircle className="text-amber-500 w-5 h-5" />
              )}
              <div>
                <div className={`text-sm font-medium ${sub.status === 'ACCEPTED' ? 'text-emerald-400' : sub.status === 'WRONG_ANSWER' ? 'text-red-400' : 'text-amber-400'}`}>
                  {sub.status.replace('_', ' ')}
                </div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span className="uppercase">{sub.language}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <div>{sub.runtime} ms</div>
              <div>{sub.memory} KB</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
