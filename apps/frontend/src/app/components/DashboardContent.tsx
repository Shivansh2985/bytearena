'use client';
import { apiFetch } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import MetricsBentoGrid from './MetricsBentoGrid';
import ContestFeed from './ContestFeed';
import RatingChart from './RatingChart';
import ActivityFeed from './ActivityFeed';
import UpcomingContests from './UpcomingContests';

export default function DashboardContent() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (data.role === 'ADMIN') {
            window.location.href = '/admin/dashboard';
            return;
          }
          setUser(data);
        }
      })
      .catch((err) => console.error('Failed to fetch dashboard user data:', err));
  }, []);

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '') || 'User';

  return (
    <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {displayName} — {user?._count?.contests ?? 0} contests participated
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-success pulse-live inline-block" />
          Live data · Updated 12s ago
        </div>
      </div>

      {/* Bento grid */}
      <MetricsBentoGrid user={user} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        {/* Rating chart — 2 cols */}
        <div className="xl:col-span-2">
          <RatingChart user={user} />
        </div>
        {/* Activity feed — 1 col */}
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* Contest sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
        <ContestFeed />
        <UpcomingContests />
      </div>
    </div>
  );
}