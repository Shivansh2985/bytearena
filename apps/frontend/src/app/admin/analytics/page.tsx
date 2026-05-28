'use client';
import { apiFetch } from '@/lib/api';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { BarChart2, Users, Swords, Activity, TrendingUp, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


import { useState, useEffect } from 'react';

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

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, contestsRes] = await Promise.all([
          apiFetch('/api/admin?action=stats').then(res => res.json()),
          apiFetch('/api/admin?action=users').then(res => res.json()),
          apiFetch('/api/contests').then(res => res.json())
        ]);

        if (!statsRes.error) setStats(statsRes);
        
        const actualUsers = Array.isArray(usersRes) ? usersRes : (usersRes.data || []);
        if (Array.isArray(actualUsers)) setUsers(actualUsers);
        
        const actualContests = Array.isArray(contestsRes) ? contestsRes : (contestsRes.data || []);
        if (Array.isArray(actualContests)) setContests(actualContests);
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalUsers = stats?.usersCount ?? 0;
  const contestsCount = stats?.liveContestsCount ?? contests.length;
  const submissionsCount = stats?.submissionsCount ?? 0;
  const avgRating = stats?.avgRating ?? 1200;

  // Use API provided tier distribution if available, otherwise compute from local users
  let tierDistribution = stats?.tierDistribution ?? [];
  if (tierDistribution.length === 0) {
    const tiers = {
      Grandmaster: 0,
      Master: 0,
      Expert: 0,
      Specialist: 0,
      Pupil: 0,
      Beginner: 0,
    };
    users.forEach((u) => {
      const rating = u.rating ?? 1200;
      if (rating >= 2400) tiers.Grandmaster++;
      else if (rating >= 2100) tiers.Master++;
      else if (rating >= 1900) tiers.Expert++;
      else if (rating >= 1600) tiers.Specialist++;
      else if (rating >= 1400) tiers.Pupil++;
      else tiers.Beginner++;
    });
    tierDistribution = [
      { name: 'Grandmaster', value: tiers.Grandmaster, color: '#EF4444' },
      { name: 'Master', value: tiers.Master, color: '#F59E0B' },
      { name: 'Expert', value: tiers.Expert, color: '#0EA5E9' },
      { name: 'Specialist', value: tiers.Specialist, color: '#06B6D4' },
      { name: 'Pupil', value: tiers.Pupil, color: '#10B981' },
      { name: 'Beginner', value: tiers.Beginner, color: '#6B7A8A' },
    ].filter(t => t.value > 0);
  } else {
    // map colors for API data
    const colorMap: Record<string, string> = {
      Grandmaster: '#EF4444',
      Master: '#F59E0B',
      Expert: '#0EA5E9',
      Specialist: '#06B6D4',
      Pupil: '#10B981',
      Beginner: '#6B7A8A',
    };
    tierDistribution = tierDistribution.map((t: any) => ({ ...t, color: colorMap[t.name] || '#6B7A8A' }));
  }

  const kpis = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: Users, change: 'Active platform users', color: 'sky' },
    { label: 'Live Contests', value: contestsCount.toString(), icon: Swords, change: 'Currently active contests', color: 'amber' },
    { label: 'Total Submissions', value: submissionsCount.toLocaleString(), icon: Activity, change: 'Across all tasks', color: 'emerald' },
    { label: 'Avg Rating', value: avgRating.toString(), icon: TrendingUp, change: 'Platform average', color: 'cyan' },
    { label: 'Avg Execution Time', value: stats?.avgRuntime ?? '0 ms', icon: Clock, change: 'System baseline', color: 'orange' },
    { label: 'Acceptance Rate', value: stats?.acceptanceRate ?? '0%', icon: BarChart2, change: 'Platform-wide', color: 'violet' },
  ];

  const dailySubmissions = stats?.dailySubmissions ?? [
    { day: 'Today', count: submissionsCount },
  ];

  const userGrowth = [
    { month: 'Start', users: 0 },
    { month: 'Now', users: totalUsers },
  ];

  const contestParticipation = stats?.contestParticipation ?? contests.map((c) => ({
    contest: c.title.substring(0, 15) + (c.title.length > 15 ? '...' : ''),
    participants: c.participants || 0,
  }));

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
            <h2 className="text-sm font-semibold text-foreground mb-4">Daily Submissions</h2>
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
              {tierDistribution.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8 w-full">No users to distribute</div>
              )}
            </div>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contest Participation Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              {contestParticipation.length > 0 ? (
                <LineChart data={contestParticipation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="contest" tick={{ fill: '#6B7A8A', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="participants" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: '#0EA5E9', r: 4 }} />
                </LineChart>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">No contests recorded</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
