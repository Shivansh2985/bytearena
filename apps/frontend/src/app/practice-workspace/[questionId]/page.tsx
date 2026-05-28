import React from 'react';
import PracticeWorkspaceShell from '../components/PracticeWorkspaceShell';

export default async function PracticeWorkspacePage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  
  return (
    <PracticeWorkspaceShell questionId={questionId} />
  );
}
