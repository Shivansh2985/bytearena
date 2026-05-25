export interface MonitorRequestEvent {
  type: 'STREAM_REQUEST';
  contestId: string;
  userId: string;
  adminId: string;
  liveKitToken: string;
}

export interface MonitorStopEvent {
  type: 'STREAM_STOP';
  contestId: string;
  userId: string;
  adminId: string;
}

export type RedisPubSubEvent = MonitorRequestEvent | MonitorStopEvent;

export interface StreamTokens {
  liveKitToken: string;
  roomName: string;
}

export interface SnapshotPayload {
  userId: string;
  contestId: string;
  imageUrl: string;
  timestamp: number;
}
