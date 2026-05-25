'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoTrack } from '@livekit/components-react';
import { useSocket } from '@/providers/SocketProvider';

export default function ContestantMonitor({ token }: { token: string }) {
  const [streamRequested, setStreamRequested] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState('');

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleStreamRequest = (data: { token: string }) => {
      console.log('Stream requested by admin. Starting LiveKit room...');
      setLiveKitToken(data.token);
      setStreamRequested(true);
    });

    const handleStreamStop = () => {
      console.log('Stream stopped by admin. Tearing down...');
      setStreamRequested(false);
      setLiveKitToken('');
      // The LiveKitRoom unmounts, effectively destroying tracks & peer connections.
    };

    socket.on('stream-request', handleStreamRequest);
    socket.on('stream-stop', handleStreamStop);

    // Handle presence/heartbeat
    const heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.off('stream-request', handleStreamRequest);
      socket.off('stream-stop', handleStreamStop);
      // Removed socket.disconnect() to prevent loop
    };
  }, [socket]);

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
