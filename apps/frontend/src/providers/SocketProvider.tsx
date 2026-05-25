'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, getDebugMetrics } from '@/lib/socket';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  metrics: { reconnectCount: number; connected: boolean; id?: string };
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  metrics: { reconnectCount: 0, connected: false }
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({
  children,
  token,
  url,
}: {
  children: React.ReactNode;
  token?: string;
  url?: string;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!token) return;

    // Singleton socket ensures it isn't recreated across re-renders
    const s = getSocket(token, url);
    if (!s) return;
    
    if (mounted.current) {
      setSocket(s);
      setIsConnected(s.connected);
    }

    const onConnect = () => {
      if (mounted.current) setIsConnected(true);
    };

    const onDisconnect = () => {
      if (mounted.current) setIsConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // IMPORTANT: DO NOT CALL s.disconnect() here in cleanup!
    // That causes the React re-render disconnect loops.
    // Only unbind the listeners we just added.
    return () => {
      mounted.current = false;
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [token, url]);

  // Expose context
  const value = {
    socket,
    isConnected,
    metrics: getDebugMetrics()
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
