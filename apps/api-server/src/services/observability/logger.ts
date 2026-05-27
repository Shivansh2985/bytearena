export type LogSeverity = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  service: string;
  requestId?: string;
  correlationId?: string;
  contestId?: string;
  roomId?: string;
  workerId?: string;
  socketId?: string;
  userId?: string;
  route?: string;
  event: string;
  duration?: number;
  metadata?: any;
  message: string;
}

const serviceName = process.env.SERVICE_NAME || 'api-server';

export const logger = {
  _log(severity: LogSeverity, event: string, metadata: any = {}, message: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      service: serviceName,
      event,
      metadata,
      message,
      // Pulling global context if set (e.g. via AsyncLocalStorage in a more complex setup)
      // For now, we extract known keys from metadata
      requestId: metadata.requestId,
      correlationId: metadata.correlationId,
      contestId: metadata.contestId,
      roomId: metadata.roomId,
      workerId: metadata.workerId,
      socketId: metadata.socketId,
      userId: metadata.userId,
      route: metadata.route,
      duration: metadata.duration,
    };

    // Keep it clean: remove undefined keys from the root payload
    Object.keys(entry).forEach(key => entry[key as keyof LogEntry] === undefined && delete entry[key as keyof LogEntry]);

    const logString = JSON.stringify(entry);

    if (severity === 'ERROR') {
      console.error(logString);
    } else if (severity === 'WARN') {
      console.warn(logString);
    } else {
      console.log(logString);
    }
  },

  info(event: string, metadata: any = {}, message = '') {
    this._log('INFO', event, metadata, message);
  },

  warn(event: string, metadata: any = {}, message = '') {
    this._log('WARN', event, metadata, message);
  },

  error(event: string, metadata: any = {}, message = '') {
    this._log('ERROR', event, metadata, message);
  }
};
