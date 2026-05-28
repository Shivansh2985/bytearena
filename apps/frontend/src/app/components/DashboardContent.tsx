'use client';
import React, { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Link from 'next/link';
import MetricsBentoGrid from './MetricsBentoGrid';
import ContestFeed from './ContestFeed';
import RatingChart from './RatingChart';
import ActivityFeed from './ActivityFeed';
import UpcomingContests from './UpcomingContests';

export default function DashboardContent() {
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      window.location.href = '/admin/dashboard';
    }
  }, [user]);

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
        <div className="flex gap-4">
          <Link href="/my-contests" className="flex items-center gap-2 text-sm text-sky-400 bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/20 rounded-lg px-4 py-2 transition-colors">
            My Contests
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-success pulse-live inline-block" />
            Live data · Updated 12s ago
          </div>
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