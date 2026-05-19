'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Trophy, Zap, Award, HelpCircle } from 'lucide-react';

interface Submission {
  id: string;
  status: string;
  createdAt: string;
  question: { title: string };
  user: { username: string };
}

function timeSince(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submissions')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const formatted = (data as Submission[]).slice(0, 10).map((sub) => {
            let icon = HelpCircle;
            let iconColor = 'text-muted-foreground';
            let titlePrefix = 'Submitted';
            
            if (sub.status === 'ACCEPTED') {
              icon = CheckCircle2;
              iconColor = 'text-emerald-400';
              titlePrefix = 'Accepted —';
            } else if (sub.status === 'WRONG_ANSWER' || sub.status === 'REJECTED') {
              icon = XCircle;
              iconColor = 'text-red-400';
              titlePrefix = 'Wrong Answer —';
            } else if (sub.status === 'TIME_LIMIT_EXCEEDED') {
              icon = Clock;
              iconColor = 'text-amber-400';
              titlePrefix = 'TLE —';
            } else if (sub.status === 'PENDING') {
              icon = Clock;
              iconColor = 'text-sky-400';
              titlePrefix = 'Evaluating —';
            }

            return {
              id: sub.id,
              type: sub.status.toLowerCase(),
              title: `${titlePrefix} "${sub.question?.title || 'Unknown Problem'}"`,
              meta: 'Practice',
              time: timeSince(sub.createdAt),
              icon,
              iconColor,
            };
          });
          setActivities(formatted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch activity', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <button className="text-xs text-primary hover:text-purple-300 transition-colors">View all</button>
      </div>
      <div className="space-y-1">
        {loading ? (
          <div className="animate-pulse space-y-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-4 h-4 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group submission-row-enter"
              >
                <div className={`mt-0.5 flex-shrink-0 ${act.iconColor}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug truncate">{act.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.meta}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{act.time}</span>
              </div>
            );
          })
        )}
      </div>
      {/* Streak tracker */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weekly Streak</span>
          <span className="text-xs text-amber-300 font-medium">1 / 7 days</span>
        </div>
        <div className="flex gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']?.map((day, i) => (
            <div key={`streak-${day}`} className="flex-1 text-center">
              <div
                className={`h-6 rounded-md mb-1 ${
                  i < 1 ? 'bg-success/30 border border-success/40' : 'bg-muted border border-border'
                }`}
              />
              <span className="text-xs text-muted-foreground">{day?.[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}