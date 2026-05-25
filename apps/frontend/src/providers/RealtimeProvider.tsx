'use client';
import React from 'react';
import { SocketProvider } from './SocketProvider';
import { LiveKitProvider } from './LiveKitProvider';
import { useSession } from 'next-auth/react';

export const RealtimeProvider = ({
  children,
  token: propToken,
  url,
}: {
  children: React.ReactNode;
  token?: string;
  url?: string;
}) => {
  const { data: session } = useSession();
  const token = propToken || (session as any)?.accessToken;

  return (
    <SocketProvider token={token} url={url}>
      <LiveKitProvider>
        {children}
      </LiveKitProvider>
    </SocketProvider>
  );
};
