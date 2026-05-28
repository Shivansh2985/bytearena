'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { Users, Swords, Activity, TrendingUp, AlertTriangle, Eye, PlusCircle, BarChart2, Zap, ArrowRight, Shield,  } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin?action=stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin stats', err);
        setLoading(false);
      });
  }, []);

  const kpis = stats ? [
    { label: 'Total Users', value: stats.usersCount.toLocaleString(), icon: Users, change: 'Active platform users', color: 'sky' },
    { label: 'Live Contests', value: stats.liveContestsCount.toString(), icon: Swords, change: 'Currently running', color: 'red' },
    { label: 'Total Submissions', value: stats.submissionsCount.toLocaleString(), icon: Activity, change: 'Across all problems', color: 'emerald' },
    { label: 'Avg Rating', value: stats.avgRating.toLocaleString(), icon: TrendingUp, change: 'Platform average', color: 'amber' },
  ] : [
    { label: 'Total Users', value: '-', icon: Users, change: 'Loading...', color: 'sky' },
    { label: 'Live Contests', value: '-', icon: Swords, change: 'Loading...', color: 'red' },
    { label: 'Total Submissions', value: '-', icon: Activity, change: 'Loading...', color: 'emerald' },
    { label: 'Avg Rating', value: '-', icon: TrendingUp, change: 'Loading...', color: 'amber' },
  ];

  // Map real data from stats if available
  const submissionFlow = stats?.dailySubmissions?.map((d: any) => ({
    time: d.day,
    count: d.count
  })) || [
    { time: 'Start', count: 0 },
    { time: 'Now', count: stats?.submissionsCount || 0 }
  ];

  const contestActivity = stats?.contestParticipation?.map((c: any) => ({
    name: c.contest,
    participants: c.participants,
    submissions: 0 // Optional: if we tracked submissions per contest we could show it here
  })) || [
    { name: 'Contest', participants: 0, submissions: 0 }
  ];

  const recentAlerts = stats?.recentAlerts?.map((a: any) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    time: new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })) || [];

  return (
    <AppLayout currentPath="/admin/dashboard" role="admin">
      <div className="px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield size={22} className="text-amber-400" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform overview and live monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/contests/create">
              <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                <PlusCircle size={14} />
                New Contest
              </button>
            </Link>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card-elevated border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={`text-${kpi.color}-400`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground metric-value">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Submission Flow</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={submissionFlow}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} fill="url(#subGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contest Activity</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={contestActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6B7A8A', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="participants" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts + Quick actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Alerts */}
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? recentAlerts.map((alert: any) => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  alert.type === 'danger' ? 'bg-red-500/5 border-red-500/20' :
                  alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  alert.type === 'success'? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-sky-500/5 border-sky-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.type === 'danger' ? 'bg-red-400' :
                    alert.type === 'warning' ? 'bg-amber-400' :
                    alert.type === 'success' ? 'bg-emerald-400' : 'bg-sky-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">No recent system alerts</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card-elevated border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Contest Manager', href: '/admin/contests', icon: Swords, color: 'sky' },
                { label: 'User Management', href: '/admin/users', icon: Users, color: 'emerald' },
                { label: 'Live Proctoring', href: '/admin/proctoring', icon: Eye, color: 'red' },
                { label: 'Analytics', href: '/admin/analytics', icon: BarChart2, color: 'amber' },
                { label: 'Question Builder', href: '/admin/questions', icon: Zap, color: 'cyan' },
                { label: 'Rating Manager', href: '/admin/ratings', icon: TrendingUp, color: 'violet' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border border-border hover:border-${action.color}-500/30 hover:bg-${action.color}-500/5 transition-all cursor-pointer group`}>
                      <Icon size={16} className={`text-${action.color}-400`} />
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                      <ArrowRight size={12} className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
