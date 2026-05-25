import React from 'react';
import WorkspaceShell from '../components/WorkspaceShell';
import { RealtimeProvider } from '@/providers/RealtimeProvider';

export default async function LiveContestWorkspacePage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  return (
    <RealtimeProvider>
      <WorkspaceShell contestId={contestId} />
    </RealtimeProvider>
  );
}