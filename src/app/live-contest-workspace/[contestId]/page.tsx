import React from 'react';
import WorkspaceShell from '../components/WorkspaceShell';

export default async function LiveContestWorkspacePage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  return <WorkspaceShell contestId={contestId} />;
}