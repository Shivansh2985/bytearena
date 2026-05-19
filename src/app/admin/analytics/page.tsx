'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { BarChart2, Users, Swords, Activity, TrendingUp, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const dailySubmissions = [
  { day: 'Mon', count: 4200 }, { day: 'Tue', count: 5800 }, { day: 'Wed', count: 3900 },
  { day: 'Thu', count: 7200 }, { day: 'Fri', count: 6100 }, { day: 'Sat', count: 9800 },
  { day: 'Sun', count: 8400 },
];

const userGrowth = [
  { month: 'Nov', users: 62000 }, { month: 'Dec', users: 68000 },
  { month: 'Jan', users: 71000 }, { month: 'Feb', users: 75000 },
  { month: 'Mar', users: 79000 }, { month: 'Apr', users: 82000 },
  { month: 'May', users: 84219 },
];

const tierDistribution = [
  { name: 'Grandmaster', value: 120, color: '#EF4444' },
  { name: 'Master', value: 840, color: '#F59E0B' },
  { name: 'Expert', value: 4200, color: '#0EA5E9' },
  { name: 'Specialist', value: 18000, color: '#06B6D4' },
  { name: 'Pupil', value: 61059, color: '#10B981' },
];

const contestParticipation = [
  { contest: 'ByteBlitz #14', participants: 2800 },
  { contest: 'ByteBlitz #15', participants: 3100 },
  { contest: 'ByteBlitz #16', participants: 3200 },
  { contest: 'ByteBlitz #17', participants: 3400 },
  { contest: 'ByteBlitz #18', participants: 3842 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip-dark">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-sky-300">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const kpis = [
  { label: 'Total Users', value: '84,219', icon: Users, change: '+2,341 this month', color: 'sky' },
  { label: 'Contests Run', value: '1,847', icon: Swords, change: '+12 this month', color: 'amber' },
  { label: 'Total Submissions', value: '2.3M+', icon: Activity, change: '+48k this week', color: 'emerald' },
  { label: 'Avg Rating', value: '1,847', icon: TrendingUp, change: '+12 this week', color: 'cyan' },
  { label: 'Avg Solve Time', value: '22 min', icon: Clock, change: 'Medium difficulty', color: 'orange' },
  { label: 'Acceptance Rate', value: '61.2%', icon: BarChart2, change: 'Platform-wide', color: 'violet' },
];

export default function AdminAnalyticsPage() {
  return (
    <AppLayout currentPath="/admin/analytics" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 size={22} className="text-sky-400" />
            Platform Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform-wide metrics and insights</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card-elevated border border-border rounded-xl p-4">
                <Icon size={14} className={`text-${kpi.color}-400 mb-2`} />
                <p className="text-xl font-bold text-foreground metric-value">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Daily Submissions (This Week)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySubmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">User Growth</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">User Tier Distribution</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={tierDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {tierDistribution.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="text-xs text-muted-foreground">{t.name}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{t.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contest Participation Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={contestParticipation}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="contest" tick={{ fill: '#6B7A8A', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="participants" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: '#0EA5E9', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
