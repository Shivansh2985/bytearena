import dotenv from 'dotenv';
import { getRedisClient, closeRedisConnections } from './lib/redis';
import { logger } from './services/observability/logger';

// ─────────────────────────────────────────────────────────────
// Load Environment Variables
// ─────────────────────────────────────────────────────────────
dotenv.config();

// Initialize redis singleton early
const redis = getRedisClient();

// ─────────────────────────────────────────────────────────────
// BullMQ Workers / Queues
// ─────────────────────────────────────────────────────────────
logger.info('worker_startup', {}, '🚀 ByteArena Worker Service Starting...');

import './queues';
import './workers/judgeWorker';

logger.info('worker_running', {}, '✅ ByteArena Worker Service Running (listening to queues)');

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info('worker_shutdown', { signal }, `Received ${signal}, starting graceful shutdown...`);
  // Optionally await worker.close() here if we export it
  await closeRedisConnections();
  logger.info('worker_shutdown_complete', {}, 'Shutdown complete.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { redis };
