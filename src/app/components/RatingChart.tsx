'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const AreaChart = dynamic(
  () => import('recharts').then((m) => m.AreaChart),
  { ssr: false }
);
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import('recharts').then((m) => m.ReferenceLine),
  { ssr: false }
);

const ratingData = [
  { contest: 'ByteBlitz #8', rating: 1820, date: 'Jan 12', rank: 892 },
  { contest: 'CodeStorm #9', rating: 1895, date: 'Jan 26', rank: 743 },
  { contest: 'ByteBlitz #9', rating: 1847, date: 'Feb 9', rank: 812 },
  { contest: 'AlgoArena #4', rating: 1980, date: 'Feb 23', rank: 521 },
  { contest: 'CodeStorm #10', rating: 2105, date: 'Mar 8', rank: 398 },
  { contest: 'ByteBlitz #10', rating: 2087, date: 'Mar 22', rank: 412 },
  { contest: 'AlgoArena #5', rating: 2210, date: 'Apr 5', rank: 302 },
  { contest: 'ByteBlitz #11', rating: 2195, date: 'Apr 19', rank: 318 },
  { contest: 'CodeStorm #11', rating: 2254, date: 'May 3', rank: 281 },
  { contest: 'ByteBlitz #12', rating: 2341, date: 'May 17', rank: 342 },
];

const ranges = ['All Time', '3 Months', '6 Months', '1 Year'];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof ratingData[0]; value: number }> }) {
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
        <div>
          <p className="text-xs text-muted-foreground">Rank</p>
          <p className="text-sm font-bold text-cyan-300 metric-value">#{d.rank}</p>
        </div>
      </div>
    </div>
  );
}

export default function RatingChart() {
  const [activeRange, setActiveRange] = useState('All Time');

  return (
    <div className="bg-card-elevated border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Rating Progression
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">10 rated contests · +521 total gain</p>
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
          Current: <span className="text-purple-300 font-semibold metric-value">2,341</span>
        </div>
      </div>
    </div>
  );
}