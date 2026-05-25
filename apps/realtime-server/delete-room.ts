import { RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_API_URL = 'https://bytearena-be9570oz.livekit.cloud';
const LIVEKIT_API_KEY = 'APImshyUcHoEkEJ';
const LIVEKIT_API_SECRET = 'nqq3Je9nw74qegFGhzh7yuMcUWfKIEUiYTlF1eeEY4eL';

const roomService = new RoomServiceClient(LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

async function run() {
  const roomName = 'contest-28bec667-f718-48c3-b3a2-887073b0cc54';
  console.log(`Attempting to delete room: ${roomName}...`);
  try {
    await roomService.deleteRoom(roomName);
    console.log(`✅ Successfully deleted room: ${roomName}`);
  } catch (err: any) {
    console.error(`❌ Failed to delete room:`, err.message);
  }
}

run();
