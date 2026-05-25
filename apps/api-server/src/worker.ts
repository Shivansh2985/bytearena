import dotenv from 'dotenv';
import { createClient } from 'redis';

// ─────────────────────────────────────────────────────────────
// Load Environment Variables
// ─────────────────────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────────────────────
// Redis Configuration
// ─────────────────────────────────────────────────────────────
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.error('❌ Worker Redis Error:', err);
});

(async () => {
  try {
    await redis.connect();
    console.log('✅ Worker Redis Connected');
  } catch (err: any) {
    console.warn('⚠️ Worker Redis connection failed:', err.message);
  }
})();

// ─────────────────────────────────────────────────────────────
// BullMQ Workers / Queues
// ─────────────────────────────────────────────────────────────
console.log('🚀 ByteArena Worker Service Starting...');

import './queues';
import './workers/judgeWorker';

console.log('✅ ByteArena Worker Service Running (listening to queues)');

export { redis };
