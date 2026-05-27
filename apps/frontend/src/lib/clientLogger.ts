import { getTelemetrySocket } from './socket';

export interface LogPayload {
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

const MAX_BATCH_SIZE = 50;
const MAX_BATCH_BYTES = 32 * 1024; // 32KB
const BATCH_INTERVAL_MS = 5000;

let logBatch: LogPayload[] = [];
let batchInterval: NodeJS.Timeout | null = null;
let isTelemetryActive = true;

const safeStringify = (value: any, { depth = 2, maxLength = 500 } = {}): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value !== 'object') {
    const str = String(value);
    return str.length > maxLength ? str.slice(0, maxLength) + '...[TRUNCATED]' : str;
  }

  const cache = new Set();
  const serialize = (obj: any, currentDepth: number): any => {
    if (currentDepth > depth) return '[MAX_DEPTH_REACHED]';
    if (typeof obj !== 'object' || obj === null) return obj;
    if (cache.has(obj)) return '[CIRCULAR]';
    cache.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => serialize(item, currentDepth + 1));
    }

    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serialize(obj[key], currentDepth + 1);
      }
    }
    return result;
  };

  try {
    const serialized = JSON.stringify(serialize(value, 0));
    return serialized.length > maxLength 
      ? serialized.slice(0, maxLength) + '...[TRUNCATED]' 
      : serialized;
  } catch (err) {
    return '[SERIALIZATION_ERROR]';
  }
};

const redactSecrets = (str: string): string => {
  let redacted = str;
  // Redact Bearer tokens
  redacted = redacted.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED]');
  // Redact JWTs loosely
  redacted = redacted.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/gi, '[REDACTED_JWT]');
  // Redact emails
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[REDACTED_EMAIL]');
  return redacted;
};

const flushLogs = () => {
  if (!isTelemetryActive || logBatch.length === 0) return;

  const socket = getTelemetrySocket();
  if (socket && socket.connected) {
    const payload = JSON.stringify(logBatch);
    const redactedPayload = redactSecrets(payload);
    
    if (new Blob([redactedPayload]).size <= MAX_BATCH_BYTES) {
      socket.emit('client:logs_batch', JSON.parse(redactedPayload));
    } else {
      socket.emit('client:logs_batch', [{ level: 'error', message: '[TELEMETRY_ERROR] Payload exceeded 32KB limit', timestamp: Date.now() }]);
    }
  }
  
  logBatch = [];
};

const pushLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (!isTelemetryActive) return;

  logBatch.push({
    level,
    message: redactSecrets(message),
    data: data ? safeStringify(data) : undefined,
    timestamp: Date.now(),
  });

  if (logBatch.length >= MAX_BATCH_SIZE) {
    flushLogs();
  }
};

export const clientLogger = {
  info: (message: string, data?: any) => pushLog('info', message, data),
  warn: (message: string, data?: any) => pushLog('warn', message, data),
  error: (message: string, data?: any) => pushLog('error', message, data),
  
  enable: () => {
    isTelemetryActive = true;
    if (!batchInterval) {
      batchInterval = setInterval(flushLogs, BATCH_INTERVAL_MS);
    }
  },
  
  disable: () => {
    isTelemetryActive = false;
    if (batchInterval) {
      clearInterval(batchInterval);
      batchInterval = null;
    }
  }
};
