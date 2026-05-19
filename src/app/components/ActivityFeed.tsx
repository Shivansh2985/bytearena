'use client';
import React from 'react';
import { CheckCircle2, XCircle, Clock, Trophy, Zap, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/AppIcon';


const activities = [
  {
    id: 'act-1',
    type: 'accepted',
    title: 'Accepted — "Graph Coloring BFS"',
    meta: 'ByteBlitz Weekly #18 · Q3',
    time: '14 min ago',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  {
    id: 'act-2',
    type: 'wrong',
    title: 'Wrong Answer — "Segment Tree Range"',
    meta: 'ByteBlitz Weekly #18 · Q4',
    time: '31 min ago',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
  {
    id: 'act-3',
    type: 'contest',
    title: 'Joined: ByteBlitz Weekly #18',
    meta: 'Rank: #342 · Score: 1,800',
    time: '2h ago',
    icon: Trophy,
    iconColor: 'text-amber-400',
  },
  {
    id: 'act-4',
    type: 'accepted',
    title: 'Accepted — "Trie Autocomplete"',
    meta: 'Practice · Data Structures',
    time: '5h ago',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  {
    id: 'act-5',
    type: 'badge',
    title: 'Badge Unlocked: "Speed Demon"',
    meta: 'Solved 3 problems in under 5 min',
    time: '1d ago',
    icon: Award,
    iconColor: 'text-purple-400',
  },
  {
    id: 'act-6',
    type: 'tle',
    title: 'TLE — "Dijkstra Shortest Path"',
    meta: 'Practice · Graphs',
    time: '1d ago',
    icon: Clock,
    iconColor: 'text-amber-400',
  },
  {
    id: 'act-7',
    type: 'rating',
    title: 'Rating increased to 2,341',
    meta: '+87 from CodeStorm #12',
    time: '2d ago',
    icon: Zap,
    iconColor: 'text-purple-400',
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <button className="text-xs text-primary hover:text-purple-300 transition-colors">View all</button>
      </div>
      <div className="space-y-1">
        {activities?.map((act) => {
          const Icon = act?.icon;
          return (
            <div
              key={act?.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group submission-row-enter"
            >
              <div className={`mt-0.5 flex-shrink-0 ${act?.iconColor}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground leading-snug truncate">{act?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{act?.meta}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{act?.time}</span>
            </div>
          );
        })}
      </div>
      {/* Streak tracker */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weekly Streak</span>
          <span className="text-xs text-amber-300 font-medium">2 / 7 days</span>
        </div>
        <div className="flex gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']?.map((day, i) => (
            <div key={`streak-${day}`} className="flex-1 text-center">
              <div
                className={`h-6 rounded-md mb-1 ${
                  i < 2 ? 'bg-success/30 border border-success/40' : 'bg-muted border border-border'
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