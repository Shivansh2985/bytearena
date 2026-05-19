'use client';
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Bookmark, BookmarkCheck, Bell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Badge from '@/components/ui/Badge';
import ToastProvider from '@/components/ui/Toast';

interface Contest {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  startTime: number;
  endTime: number;
  participants: number;
  totalQuestions: number;
  tags: string[];
  registered?: boolean;
}

function TimeToStart({ startTime }: { startTime: number }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = startTime - Date.now();
      if (diff <= 0) { setLabel('Starting now'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setLabel(`in ${days}d ${hours}h`);
      else if (hours > 0) setLabel(`in ${hours}h ${mins}m`);
      else setLabel(`in ${mins}m`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="text-amber-300 font-semibold text-xs metric-value">{label}</span>;
}

export default function UpcomingContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/contests?status=UPCOMING')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setContests(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch upcoming contests', err);
        setLoading(false);
      });
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info('Contest removed from bookmarks'); }
      else { next.add(id); toast.success('Contest bookmarked!'); }
      return next;
    });
  };

  const handleRegister = (id: string, title: string) => {
    // In a real app, this would call a POST API endpoint to register
    setContests((prev) => 
      prev.map(c => c.id === id ? { ...c, registered: true, participants: c.participants + 1 } : c)
    );
    toast.success(`Registered for ${title}!`);
  };

  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5">
      <ToastProvider />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar size={15} className="text-accent" />
          Upcoming Contests
        </h2>
        <button className="text-xs text-primary hover:text-purple-300 transition-colors">View schedule</button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-4 border border-border rounded-xl animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-full mt-2"></div>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No upcoming contests at the moment.
          </div>
        ) : (
          contests.map((c) => {
            const isRegistered = c.registered;
            const isBookmarked = bookmarks.has(c.id);
            const durationMs = c.endTime - c.startTime;
            const durationH = Math.round(durationMs / 3600000);
            const maxParticipants = 10000;
            const fillPct = Math.round((c.participants / maxParticipants) * 100);

            return (
              <div key={c.id} className="contest-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="upcoming" dot>Upcoming</Badge>
                      <Badge variant={c.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}>
                        {c.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  </div>
                  <button
                    onClick={() => toggleBookmark(c.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark contest'}
                  >
                    {isBookmarked
                      ? <BookmarkCheck size={14} className="text-primary" />
                      : <Bookmark size={14} />
                    }
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    <TimeToStart startTime={c.startTime} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    Duration: <span className="text-foreground font-medium ml-1">{durationH}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={11} />
                    <span>{c.participants.toLocaleString()}</span>
                  </div>
                </div>

                {/* Fill bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Registrations</span>
                    <span className="metric-value">{c.participants.toLocaleString()} / {maxParticipants.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-700"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1 flex-wrap">
                    {c.tags.slice(0, 2).map((tag) => (
                      <span key={`utag-${c.id}-${tag}`} className="problem-tag">{tag}</span>
                    ))}
                  </div>
                  {isRegistered ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-xs text-emerald-300 font-medium">
                      <Bell size={11} />
                      Registered
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(c.id, c.title)}
                      className="btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
                    >
                      Register
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}