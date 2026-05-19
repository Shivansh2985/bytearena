'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Zap, Trophy, Code2, Flame, CheckCircle, Activity } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// Grid plan: 6 cards → grid-cols-3 on xl, 2×3
// Row 1: Rating (hero, spans 1 col large), Rank, Problems Solved
// Row 2: Streak (warning state), Acceptance Rate, Active Contests

const metrics = [
  {
    id: 'metric-rating',
    label: 'Contest Rating',
    value: '2,341',
    change: '+87',
    changeDir: 'up',
    changeLabel: 'this month',
    icon: Zap,
    hero: true,
    color: 'primary',
    sub: 'Expert Tier',
    progress: 78,
  },
  {
    id: 'metric-rank',
    label: 'Global Rank',
    value: '#342',
    change: '+56',
    changeDir: 'up',
    changeLabel: 'places this week',
    icon: Trophy,
    hero: false,
    color: 'accent',
    sub: 'Top 0.4% worldwide',
    progress: null,
  },
  {
    id: 'metric-solved',
    label: 'Problems Solved',
    value: '1,047',
    change: '+23',
    changeDir: 'up',
    changeLabel: 'this week',
    icon: Code2,
    hero: false,
    color: 'success',
    sub: '312 Hard · 489 Med · 246 Easy',
    progress: null,
  },
  {
    id: 'metric-streak',
    label: 'Contest Streak',
    value: '2 days',
    change: '-5',
    changeDir: 'down',
    changeLabel: 'streak broken',
    icon: Flame,
    hero: false,
    color: 'warning',
    sub: 'Best: 31 days · Missed yesterday',
    progress: null,
    alert: true,
  },
  {
    id: 'metric-accuracy',
    label: 'Acceptance Rate',
    value: '68.4%',
    change: '+2.1%',
    changeDir: 'up',
    changeLabel: 'vs last month',
    icon: CheckCircle,
    hero: false,
    color: 'success',
    sub: '1,047 AC / 1,531 total',
    progress: 68,
  },
  {
    id: 'metric-contests',
    label: 'Contests Joined',
    value: '94',
    change: '+3',
    changeDir: 'up',
    changeLabel: 'this month',
    icon: Activity,
    hero: false,
    color: 'accent',
    sub: '71 rated · 23 practice',
    progress: null,
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string; progress: string }> = {
  primary: {
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    text: 'text-sky-300',
    icon: 'bg-primary/15 text-sky-300',
    progress: 'from-primary to-sky-400',
  },
  accent: {
    bg: 'bg-accent/8',
    border: 'border-accent/20',
    text: 'text-cyan-300',
    icon: 'bg-accent/15 text-cyan-300',
    progress: 'from-accent to-cyan-300',
  },
  success: {
    bg: 'bg-success/8',
    border: 'border-success/20',
    text: 'text-emerald-300',
    icon: 'bg-success/15 text-emerald-300',
    progress: 'from-success to-emerald-400',
  },
  warning: {
    bg: 'bg-warning/8',
    border: 'border-warning/20',
    text: 'text-amber-300',
    icon: 'bg-warning/15 text-amber-300',
    progress: 'from-warning to-amber-400',
  },
};

export default function MetricsBentoGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const colors = colorMap[metric.color];
        const TrendIcon = metric.changeDir === 'up' ? TrendingUp : TrendingDown;

        return (
          <div
            key={metric.id}
            className={`relative rounded-xl p-5 border transition-all duration-200 hover:scale-[1.01] cursor-pointer group ${
              metric.alert
                ? 'bg-warning/5 border-warning/30 hover:border-warning/50'
                : `bg-card ${colors.border} hover:${colors.border} bg-card-elevated`
            }`}
          >
            {/* Alert indicator */}
            {metric.alert && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-warning/15 border border-warning/30 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-live" />
                <span className="text-xs text-amber-300 font-medium">Alert</span>
              </div>
            )}

            {/* Icon + label */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
                <Icon size={15} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {metric.label}
              </span>
            </div>

            {/* Value */}
            <p className={`text-3xl font-bold metric-value mb-1 ${metric.hero ? 'text-4xl' : ''} ${
              metric.alert ? 'text-amber-300' : 'text-foreground'
            }`}>
              {metric.value}
            </p>

            {/* Sub label */}
            <p className="text-xs text-muted-foreground mb-3 truncate">{metric.sub}</p>

            {/* Progress bar */}
            {metric.progress !== null && (
              <div className="mb-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-700`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Change indicator */}
            <div className="flex items-center gap-1.5">
              <TrendIcon
                size={13}
                className={metric.changeDir === 'up' ? 'text-success' : 'text-danger'}
              />
              <span
                className={`text-xs font-semibold metric-value ${
                  metric.changeDir === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {metric.change}
              </span>
              <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}