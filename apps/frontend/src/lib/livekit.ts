import { Room, ConnectionState, RoomEvent } from 'livekit-client';

let globalLkRoom: Room | null = null;

export const getLiveKitRoom = (): Room => {
  if (globalLkRoom) {
    return globalLkRoom;
  }
  
  globalLkRoom = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  // Keep metrics for debugging
  globalLkRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    console.log(`[LiveKit Debug] State: ${state}`);
  });

  globalLkRoom.on(RoomEvent.Disconnected, (reason: any) => {
    console.log(`[LiveKit Debug] Disconnected:`, reason);
  });

  return globalLkRoom;
};

export const disconnectLiveKit = async () => {
  if (globalLkRoom) {
    await globalLkRoom.disconnect();
    globalLkRoom = null;
  }
};
