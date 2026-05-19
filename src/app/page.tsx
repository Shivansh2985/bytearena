import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardContent from './components/DashboardContent';

export default function UserDashboardPage() {
  return (
    <AppLayout currentPath="/user-dashboard">
      <DashboardContent />
    </AppLayout>
  );
}