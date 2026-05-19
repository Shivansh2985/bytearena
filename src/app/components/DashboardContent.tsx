import React from 'react';
import MetricsBentoGrid from './MetricsBentoGrid';
import ContestFeed from './ContestFeed';
import RatingChart from './RatingChart';
import ActivityFeed from './ActivityFeed';
import UpcomingContests from './UpcomingContests';

export default function DashboardContent() {
  return (
    <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, Rahul — 3 contests this week
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-success pulse-live inline-block" />
          Live data · Updated 12s ago
        </div>
      </div>

      {/* Bento grid */}
      <MetricsBentoGrid />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        {/* Rating chart — 2 cols */}
        <div className="xl:col-span-2">
          <RatingChart />
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