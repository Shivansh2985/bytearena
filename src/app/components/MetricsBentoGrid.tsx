'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Zap, Trophy, Code2, Flame, CheckCircle, Activity } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// Grid plan: 6 cards → grid-cols-3 on xl, 2×3
// Row 1: Rating (hero, spans 1 col large), Rank, Problems Solved
// Row 2: Streak (warning state), Acceptance Rate, Active Contests



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

interface MetricsBentoGridProps {
  user?: any;
}

export default function MetricsBentoGrid({ user }: MetricsBentoGridProps) {
  const rating = user?.rating ?? 1200;
  
  let tier = 'Beginner Tier';
  if (rating >= 2400) tier = 'Master Tier';
  else if (rating >= 2100) tier = 'Candidate Master';
  else if (rating >= 1900) tier = 'Expert Tier';
  else if (rating >= 1600) tier = 'Specialist Tier';
  else if (rating >= 1400) tier = 'Pupil Tier';

  const progressPercent = Math.min(100, Math.max(0, ((rating - 800) / 2200) * 100)); // normalized scale

  const submissionsCount = user?._count?.submissions ?? 0;
  const contestsCount = user?._count?.contests ?? 0;

  const globalRank = contestsCount === 0 && !user?.globalRank
    ? 'Unranked' 
    : `#${user?.globalRank || 1}`;

  const rankPercent = contestsCount === 0
    ? 'Participate to rank'
    : `Top ${Math.max(0.1, 100 - ((rating - 800) / 2200) * 100).toFixed(1)}% worldwide`;

  const acceptedSubmissions = user?.acceptedSubmissions ?? 0;
  const accuracyPercent = submissionsCount > 0 ? Math.round((acceptedSubmissions / submissionsCount) * 100) : 0;

  const dynamicMetrics = [
    {
      id: 'metric-rating',
      label: 'Contest Rating',
      value: rating.toLocaleString(),
      change: contestsCount > 0 ? '+87' : '0',
      changeDir: 'up',
      changeLabel: 'this month',
      icon: Zap,
      hero: true,
      color: 'primary',
      sub: tier,
      progress: progressPercent,
    },
    {
      id: 'metric-rank',
      label: 'Global Rank',
      value: globalRank,
      change: contestsCount > 0 ? '+56' : '0',
      changeDir: 'up',
      changeLabel: 'places this week',
      icon: Trophy,
      hero: false,
      color: 'accent',
      sub: rankPercent,
      progress: null,
    },
    {
      id: 'metric-solved',
      label: 'Problems Solved',
      value: submissionsCount.toLocaleString(),
      change: '0',
      changeDir: 'up',
      changeLabel: 'this week',
      icon: Code2,
      hero: false,
      color: 'success',
      sub: `${Math.round(submissionsCount * 0.3)} Hard · ${Math.round(submissionsCount * 0.5)} Med · ${Math.round(submissionsCount * 0.2)} Easy`,
      progress: null,
    },
    {
      id: 'metric-streak',
      label: 'Contest Streak',
      value: contestsCount > 0 ? '1 day' : '0 days',
      change: '0',
      changeDir: 'up',
      changeLabel: 'streak active',
      icon: Flame,
      hero: false,
      color: 'warning',
      sub: contestsCount > 0 ? 'Best: 1 day' : 'No contests played yet',
      progress: null,
      alert: false,
    },
    {
      id: 'metric-accuracy',
      label: 'Acceptance Rate',
      value: submissionsCount > 0 ? `${accuracyPercent}%` : '0%',
      change: '0%',
      changeDir: 'up',
      changeLabel: 'vs last month',
      icon: CheckCircle,
      hero: false,
      color: 'success',
      sub: `${acceptedSubmissions} AC / ${submissionsCount} total`,
      progress: accuracyPercent,
    },
    {
      id: 'metric-contests',
      label: 'Contests Joined',
      value: contestsCount.toLocaleString(),
      change: contestsCount > 0 ? `+${contestsCount}` : '0',
      changeDir: 'up',
      changeLabel: 'this month',
      icon: Activity,
      hero: false,
      color: 'accent',
      sub: `${contestsCount} rated · 0 practice`,
      progress: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {dynamicMetrics.map((metric) => {
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