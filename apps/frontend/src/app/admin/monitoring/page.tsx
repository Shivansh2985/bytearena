'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
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

  const [clientLogs, setClientLogs] = useState<any[]>([]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Polling fallback

    const token = (session as any)?.accessToken || '';
    
    // Connect to /telemetry namespace
    const { getTelemetrySocket } = require('@/lib/socket');
    let tSocket = getTelemetrySocket(token, process.env.NEXT_PUBLIC_REALTIME_URL);

    const onConnect = () => console.log('[Monitoring] Connected to telemetry socket');
    const onTelemetry = (data: any) => setTelemetry((prev: any) => ({ ...prev, ...data }));
    const onClientLogs = (batch: any) => {
      setClientLogs((prev) => {
        // Keep last 100 log batches
        const newLogs = [batch, ...prev];
        return newLogs.slice(0, 100);
      });
    };

    const attachListeners = (s: Socket) => {
      s.on('connect', onConnect);
      s.on('admin:telemetry', onTelemetry);
      s.on('admin:client_logs_batch', onClientLogs);
    };

    const removeListeners = (s: Socket) => {
      s.off('connect', onConnect);
      s.off('admin:telemetry', onTelemetry);
      s.off('admin:client_logs_batch', onClientLogs);
    };

    if (tSocket) attachListeners(tSocket);
    setSocket(tSocket);

    // Hidden-tab suppression: Disconnect telemetry when admin tab is hidden to save backend cycles
    const handleVisibilityChange = () => {
      if (!tSocket) return;
      if (document.hidden) {
        console.log('[Monitoring] Tab hidden. Disconnecting telemetry to save resources.');
        tSocket.disconnect();
      } else {
        console.log('[Monitoring] Tab visible. Reconnecting telemetry.');
        tSocket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (tSocket) {
        removeListeners(tSocket);
        // Clean disconnect on unmount
        tSocket.disconnect();
      }
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
        <h2 className="text-lg font-semibold mb-4 text-blue-400">Live Client Event Log</h2>
        <div className="bg-gray-900/50 p-4 rounded-xl font-mono text-xs text-gray-300 h-96 overflow-y-auto space-y-2">
          {clientLogs.length === 0 ? (
            <p className="text-gray-500">Waiting for telemetry batches from active clients...</p>
          ) : (
            clientLogs.map((batch, i) => (
              <div key={i} className="border-b border-gray-800 pb-2 mb-2">
                <div className="flex items-center space-x-3 text-gray-400 mb-1">
                  <span className="text-purple-400 font-bold">{batch.email}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-blue-300">{batch.ip}</span>
                  <span className="text-gray-500">|</span>
                  <span className="truncate max-w-xs">{batch.userAgent}</span>
                </div>
                {batch.logs?.map((log: any, j: number) => (
                  <div key={j} className="pl-4">
                    <span className="text-gray-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="ml-2 text-gray-200">{log.message}</span>
                    {log.data && (
                      <pre className="mt-1 text-gray-500 text-[10px] pl-4 whitespace-pre-wrap">
                        {log.data}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
