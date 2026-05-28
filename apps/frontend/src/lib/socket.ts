import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;
let telemetrySocket: Socket | null = null;
let reconnectCount = 0;
let tReconnectCount = 0;

// Centralized state machine approach to prevent simultaneous reconnect storms
let isGlobalConnecting = false;
let isTelemetryConnecting = false;

export const getSocket = (token?: string, url?: string): Socket | null => {
  if (globalSocket) {
    if (token && (globalSocket.auth as any).token !== token) {
      // Do not abruptly disconnect. Update auth payload for next reconnect
      (globalSocket.auth as any).token = token;
      if (!globalSocket.connected && !isGlobalConnecting) {
        globalSocket.connect();
      }
    }
    return globalSocket;
  }
  
  if (!token) return null;
  
  const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
  
  isGlobalConnecting = true;
  globalSocket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'], // Force WebSocket
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: 20, // Bounded retries
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5, // Jitter
    timeout: 20000,
    autoConnect: true,
  });

  globalSocket.on('connect', () => {
    isGlobalConnecting = false;
    reconnectCount = 0;
    console.log("[Socket Stabilization] socket connected", globalSocket?.id);
  });

  globalSocket.on('reconnect_attempt', (attempt) => {
    reconnectCount = attempt;
    console.log(`[Socket Debug] Reconnect attempt: ${attempt}`);
  });

  globalSocket.on('disconnect', (reason) => {
    isGlobalConnecting = false;
    console.log("[Socket Stabilization] socket disconnected", reason);
    if (reason === 'io server disconnect') {
      // Explicitly kicked, don't auto-reconnect
      globalSocket?.connect(); // wait, if server disconnects we might need to refresh auth
    }
  });

  globalSocket.on('force-disconnect', (reason: string) => {
    console.warn(`[Socket] Forcefully disconnected by server: ${reason}`);
    if (globalSocket) {
      globalSocket.io.reconnection(false);
      globalSocket.disconnect();
    }
  });

  return globalSocket;
};

export const getDebugMetrics = () => {
  return {
    reconnectCount,
    tReconnectCount,
    connected: globalSocket?.connected || false,
    telemetryConnected: telemetrySocket?.connected || false,
    id: globalSocket?.id,
    listeners: { ...trackedListeners }
  };
};

// Safe Listener Auditing wrapper to prevent memory leaks without relying on internal Socket.IO API
export const trackedListeners: Record<string, number> = {};

export const trackedOn = (socket: Socket | null, event: string, handler: any) => {
  if (!socket) return;
  trackedListeners[event] = (trackedListeners[event] || 0) + 1;
  socket.on(event, handler);
};

export const trackedOff = (socket: Socket | null, event: string, handler: any) => {
  if (!socket) return;
  trackedListeners[event] = Math.max(0, (trackedListeners[event] || 1) - 1);
  socket.off(event, handler);
};

export const disconnectGlobalSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    isGlobalConnecting = false;
  }
  if (telemetrySocket) {
    telemetrySocket.disconnect();
    telemetrySocket = null;
    isTelemetryConnecting = false;
  }
};

export const getTelemetrySocket = (token?: string, url?: string): Socket | null => {
  if (telemetrySocket) {
    if (token && (telemetrySocket.auth as any).token !== token) {
      (telemetrySocket.auth as any).token = token;
      if (!telemetrySocket.connected && !isTelemetryConnecting) {
        telemetrySocket.connect();
      }
    }
    return telemetrySocket;
  }
  
  if (!token) return null;
  
  const base = url || process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:8080';
  const socketUrl = `${base.replace(/\/$/, '')}/telemetry`;
  
  isTelemetryConnecting = true;
  telemetrySocket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000, // slower backoff for telemetry
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
    timeout: 20000,
    autoConnect: true,
  });

  telemetrySocket.on('connect', () => {
    isTelemetryConnecting = false;
    tReconnectCount = 0;
  });

  telemetrySocket.on('disconnect', () => {
    isTelemetryConnecting = false;
  });

  return telemetrySocket;
};
