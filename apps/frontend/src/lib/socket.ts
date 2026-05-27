import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;
let telemetrySocket: Socket | null = null;
let reconnectCount = 0;

export const getSocket = (token?: string, url?: string): Socket | null => {
  if (globalSocket) {
    if (token && (globalSocket.auth as any).token !== token) {
      globalSocket.auth = { token };
      globalSocket.disconnect().connect();
    }
    return globalSocket;
  }
  
  if (!token) return null;
  
  const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
  
  globalSocket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'], // Force WebSocket, no polling fallback (Prevents HTTP 400 looping)
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  globalSocket.on('reconnect_attempt', () => {
    reconnectCount++;
    console.log(`[Socket Debug] Reconnect attempt: ${reconnectCount}`);
  });

  globalSocket.on('force-disconnect', (reason: string) => {
    console.warn(`[Socket] Forcefully disconnected by server: ${reason}`);
    // Explicitly disconnect and prevent auto-reconnect
    if (globalSocket) {
      globalSocket.io.reconnection(false);
      globalSocket.disconnect();
    }
  });

  // Stabilization phase logging
  globalSocket.on("connect", () => {
    console.log("[Socket Stabilization] socket connected", globalSocket?.id);
  });

  globalSocket.on("disconnect", (reason) => {
    console.log("[Socket Stabilization] socket disconnected", reason);
  });

  // Debug metric interceptor
  const originalOn = globalSocket.on.bind(globalSocket);
  const originalOff = globalSocket.off.bind(globalSocket);
  let listenerCount = 0;

  // @ts-ignore
  globalSocket.on = (ev: string, fn: any) => {
    listenerCount++;
    // console.log(`[Socket Debug] + Listener attached: ${ev} (Total: ${listenerCount})`);
    return originalOn(ev, fn);
  };

  // @ts-ignore
  globalSocket.off = (ev: string, fn?: any) => {
    if (listenerCount > 0) listenerCount--;
    // console.log(`[Socket Debug] - Listener removed: ${ev} (Total: ${listenerCount})`);
    return originalOff(ev, fn);
  };

  return globalSocket;
};

export const getDebugMetrics = () => {
  return {
    reconnectCount,
    connected: globalSocket?.connected || false,
    id: globalSocket?.id
  };
};

export const disconnectGlobalSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
  if (telemetrySocket) {
    telemetrySocket.disconnect();
    telemetrySocket = null;
  }
};

export const getTelemetrySocket = (token?: string, url?: string): Socket | null => {
  if (telemetrySocket) {
    if (token && (telemetrySocket.auth as any).token !== token) {
      telemetrySocket.auth = { token };
      telemetrySocket.disconnect().connect();
    }
    return telemetrySocket;
  }
  
  if (!token) return null;
  
  const base = url || process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:8080';
  const socketUrl = `${base.replace(/\/$/, '')}/telemetry`;
  
  telemetrySocket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  return telemetrySocket;
};
