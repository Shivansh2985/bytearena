'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Room, ConnectionState, RoomEvent } from 'livekit-client';
import { getLiveKitRoom } from '@/lib/livekit';

interface LiveKitContextValue {
  room: Room | null;
  connectionState: ConnectionState;
}

const LiveKitContext = createContext<LiveKitContextValue>({
  room: null,
  connectionState: ConnectionState.Disconnected,
});

export const useLiveKit = () => useContext(LiveKitContext);

export const LiveKitProvider = ({ children }: { children: React.ReactNode }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const r = getLiveKitRoom();
    
    if (mounted.current) {
      setRoom(r);
      setConnectionState(r.state);
    }

    const onStateChanged = (state: ConnectionState) => {
      if (mounted.current) setConnectionState(state);
    };

    r.on(RoomEvent.ConnectionStateChanged, onStateChanged);

    // IMPORTANT: DO NOT disconnect the room here on rerender.
    // Only unbind the state listener.
    return () => {
      mounted.current = false;
      r.off(RoomEvent.ConnectionStateChanged, onStateChanged);
    };
  }, []);

  return (
    <LiveKitContext.Provider value={{ room, connectionState }}>
      {children}
    </LiveKitContext.Provider>
  );
};
