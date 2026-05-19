'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const ranges = ['All Time', '3 Months', '6 Months', '1 Year'];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tooltip-dark">
      <p className="font-semibold text-foreground mb-1">{d.contest}</p>
      <p className="text-xs text-muted-foreground mb-2">{d.date}</p>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-sm font-bold text-purple-300 metric-value">{d.rating.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function RatingChart({ user }: { user?: any }) {
  const [activeRange, setActiveRange] = useState('All Time');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-card-elevated border border-border rounded-xl p-5 h-80 animate-pulse flex flex-col justify-between">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  const currentRating = user?.rating ?? 1200;
  
  // Generate a dynamic placeholder progression curve up to their current rating
  const ratingData = [
    { contest: 'Initial Rating', rating: 1200, date: 'Start' },
    { contest: 'Recent Average', rating: Math.round((1200 + currentRating) / 2), date: 'Mid' },
    { contest: 'Current Rating', rating: currentRating, date: 'Now' },
  ];

  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Rating Progression
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Live rating updates</p>
        </div>
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={`range-${r}`}
              onClick={() => setActiveRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                activeRange === r
                  ? 'bg-primary text-white' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ratingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={2000} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#ratingGradient)"
              dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-primary rounded" />
          <span className="text-xs text-muted-foreground">Rating</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-accent rounded border-dashed" style={{ borderTop: '1px dashed' }} />
          <span className="text-xs text-muted-foreground">Expert threshold (2000)</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Current: <span className="text-purple-300 font-semibold metric-value">{currentRating.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}