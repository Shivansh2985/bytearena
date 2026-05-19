import React from 'react';

type BadgeVariant =
  | 'live' |'upcoming' |'completed' |'accepted' |'wrong' |'tle' |'mle' |'ce' |'easy' |'medium' |'hard' |'primary' |'accent' |'muted';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  live: 'badge-live',
  upcoming: 'badge-upcoming',
  completed: 'badge-completed',
  accepted: 'badge-accepted',
  wrong: 'badge-wrong',
  tle: 'badge-tle',
  mle: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
  ce: 'bg-orange-500/10 text-orange-300 border border-orange-500/25',
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
  primary: 'bg-primary/10 text-purple-300 border border-primary/25',
  accent: 'bg-accent/10 text-cyan-300 border border-accent/25',
  muted: 'bg-muted text-muted-foreground border border-border',
};

export default function Badge({ variant, children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'live' ?'bg-red-400 pulse-live'
              : variant === 'accepted' ?'bg-emerald-400'
              : variant === 'upcoming' ?'bg-amber-400' :'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
}