'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoTrack } from '@livekit/components-react';
import { io, Socket } from 'socket.io-client';

export default function ContestantMonitor({ token }: { token: string }) {
  const [streamRequested, setStreamRequested] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState('');

  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080', {
      auth: { token }
    });
    
    socket.on('stream-request', (data: { token: string }) => {
      console.log('Stream requested by admin. Starting LiveKit room...');
      setLiveKitToken(data.token);
      setStreamRequested(true);
    });

    socket.on('stream-stop', () => {
      console.log('Stream stopped by admin. Tearing down...');
      setStreamRequested(false);
      setLiveKitToken('');
      // The LiveKitRoom unmounts, effectively destroying tracks & peer connections.
    });

    // Handle presence/heartbeat
    const heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.disconnect(); // Strict cleanup rules
    };
  }, [token]);

  if (!streamRequested) {
    return (
      <div className="p-4 border rounded bg-gray-100 text-gray-700">
        <p>Monitoring: Idle (Snapshot Mode)</p>
        <p className="text-sm">Camera is inactive. Snapshots are being captured periodically.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-red-50 text-red-900 border-red-200">
      <p className="font-bold mb-2">Live Monitoring Active</p>
      <LiveKitRoom
        token={liveKitToken}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={() => console.log('Disconnected from LiveKit')}
      >
      </LiveKitRoom>
    </div>
  );
}
