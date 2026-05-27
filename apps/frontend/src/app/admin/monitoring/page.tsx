'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import AppLayout from '@/components/AppLayout';
import { apiFetch } from '@/lib/api';

interface Metrics {
  timestamp: number;
  redis: {
    commands: Record<string, string>;
    memory: Record<string, string>;
    clients: Record<string, string>;
  };
  queues: {
    judgeQueue: { waiting: number; active: number; completed: number; failed: number; delayed: number };
    snapshotQueue: { waiting: number; active: number; completed: number; failed: number; delayed: number };
  };
  cloudinary: any;
}

export default function MonitoringDashboard() {
  const { data: session, status } = useSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [telemetry, setTelemetry] = useState<any>({ socketConnections: 0, redisConnected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await apiFetch('/api/admin?action=system-metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Polling fallback

    // Connect to realtime telemetry
    const token = (session as any)?.accessToken || '';
    const newSocket = io(process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:8080', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('[Monitoring] Connected to telemetry socket');
    });

    newSocket.on('admin:telemetry', (data) => {
      setTelemetry((prev: any) => ({ ...prev, ...data }));
    });

    setSocket(newSocket);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [status, session]);

  if (status === 'loading') {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // NextAuth usually exposes role in the session object. We just trust the AppLayout's admin role wrapper.
  
  return (
    <AppLayout currentPath="/admin/monitoring" role="admin">
      <div className="min-h-screen bg-gray-900 text-white p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Platform Observability
          </h1>
          <p className="text-gray-400 mt-1">Realtime system metrics & diagnostics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${telemetry.redisConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm font-medium">Telemetry Active</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl">
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* OVERVIEW PANEL */}
          <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-blue-400">System Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Socket Connections</span>
                <span className="text-xl font-bold">{telemetry.socketConnections}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Active Judge Workers</span>
                <span className="text-xl font-bold text-green-400">{metrics.queues.judgeQueue.active}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Pending Jobs</span>
                <span className="text-xl font-bold text-yellow-400">{metrics.queues.judgeQueue.waiting}</span>
              </div>
            </div>
          </div>

          {/* REDIS ANALYTICS */}
          <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-rose-400">Redis Analytics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Connected Clients</span>
                <span className={`text-xl font-bold ${parseInt(metrics.redis.clients.connected_clients) > 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.redis.clients.connected_clients}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Memory Usage</span>
                <span className="text-xl font-bold">{metrics.redis.memory.used_memory_human}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">BZPOPMIN Calls</span>
                <span className="text-xl font-bold">{metrics.redis.commands['cmdstat_bzpopmin']?.split(',')[0].split('=')[1] || '0'}</span>
              </div>
            </div>
          </div>

          {/* CLOUDINARY ANALYTICS */}
          <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-purple-400">Media & Storage (Cloudinary)</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Total Credits Used</span>
                <span className="text-xl font-bold">{metrics.cloudinary?.credits?.usage || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Bandwidth</span>
                <span className="text-xl font-bold">{(metrics.cloudinary?.bandwidth?.usage / 1024 / 1024).toFixed(2) || 0} MB</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Storage</span>
                <span className="text-xl font-bold">{(metrics.cloudinary?.storage?.usage / 1024 / 1024).toFixed(2) || 0} MB</span>
              </div>
            </div>
          </div>
          
        </div>
      ) : null}

      <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl backdrop-blur-sm mt-8">
        <h2 className="text-lg font-semibold mb-4 text-blue-400">Live Event Log</h2>
        <div className="bg-gray-900/50 p-4 rounded-xl font-mono text-sm text-gray-300 h-64 overflow-y-auto">
          <p className="text-gray-500">Live telemetry connection established. Waiting for structured events...</p>
          {/* Logs will be appended here in the future via socket stream */}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
