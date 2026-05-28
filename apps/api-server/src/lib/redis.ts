import IORedis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../services/observability/logger';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WORKER_REDIS_URL = process.env.WORKER_REDIS_URL || REDIS_URL;

const defaultRedisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 50) {
      logger.error('redis_fatal', { attempt: times }, 'Max Redis retries exceeded. Circuit broken.');
      return null; // Stop reconnecting after 50 attempts
    }
    logger.warn('redis_reconnect', { attempt: times, service: 'api-server' }, 'Redis reconnecting');
    return Math.min(times * 100, 3000); // Backoff up to 3s
  }
};

/**
 * We use `globalThis` to store the Redis clients in development 
 * to prevent multiple connections across hot module reloads (HMR).
 */
declare global {
  var __redisClient: IORedis | undefined;
  var __redisBullMQClient: IORedis | undefined;
  var __redisBullMQSubscriber: IORedis | undefined;
  var __redisBullMQWorkerClient: IORedis | undefined;
}

// ─── Standard Shared Redis Client (Cache/PubSub) ───────────────────────────
export const getRedisClient = (): IORedis => {
  if (!globalThis.__redisClient) {
    logger.info('redis_init', { type: 'standard' }, 'Initializing standard Redis client');
    globalThis.__redisClient = new IORedis(REDIS_URL, defaultRedisOptions);
    
    globalThis.__redisClient.on('error', (err) => {
      logger.error('redis_error', { error: err.message, type: 'standard' }, 'Standard Redis error');
    });
    
    globalThis.__redisClient.on('connect', () => {
      logger.info('redis_connect', { type: 'standard' }, 'Standard Redis connected');
    });
  }
  return globalThis.__redisClient;
};

// ─── BullMQ Shared Client (Producer - Queue) ───────────────────────────────
export const getBullMQClient = (): IORedis => {
  if (!globalThis.__redisBullMQClient) {
    logger.info('redis_init', { type: 'bullmq_client' }, 'Initializing BullMQ Client');
    globalThis.__redisBullMQClient = new IORedis(REDIS_URL, defaultRedisOptions);
    
    globalThis.__redisBullMQClient.on('error', (err) => {
      logger.error('redis_error', { error: err.message, type: 'bullmq_client' }, 'BullMQ Client error');
    });
  }
  return globalThis.__redisBullMQClient;
};

// ─── BullMQ Shared Subscriber (Producer Events) ────────────────────────────
export const getBullMQSubscriber = (): IORedis => {
  if (!globalThis.__redisBullMQSubscriber) {
    logger.info('redis_init', { type: 'bullmq_subscriber' }, 'Initializing BullMQ Subscriber');
    globalThis.__redisBullMQSubscriber = new IORedis(REDIS_URL, defaultRedisOptions);
    
    globalThis.__redisBullMQSubscriber.on('error', (err) => {
      logger.error('redis_error', { error: err.message, type: 'bullmq_subscriber' }, 'BullMQ Subscriber error');
    });
  }
  return globalThis.__redisBullMQSubscriber;
};

// ─── BullMQ Worker Dedicated Client (Isolates BZPOPMIN) ────────────────────
export const getBullMQWorkerClient = (): IORedis => {
  if (!globalThis.__redisBullMQWorkerClient) {
    logger.info('redis_init', { type: 'bullmq_worker' }, 'Initializing Dedicated BullMQ Worker Client');
    globalThis.__redisBullMQWorkerClient = new IORedis(WORKER_REDIS_URL, defaultRedisOptions);
    
    globalThis.__redisBullMQWorkerClient.on('error', (err) => {
      logger.error('redis_error', { error: err.message, type: 'bullmq_worker' }, 'BullMQ Worker error');
    });
  }
  return globalThis.__redisBullMQWorkerClient;
};

// ─── Graceful Shutdown Helper ──────────────────────────────────────────────
export const closeRedisConnections = async () => {
  logger.info('redis_shutdown', {}, 'Closing Redis connections...');
  const promises = [];
  if (globalThis.__redisClient) {
    promises.push(globalThis.__redisClient.quit());
    globalThis.__redisClient = undefined;
  }
  if (globalThis.__redisBullMQClient) {
    promises.push(globalThis.__redisBullMQClient.quit());
    globalThis.__redisBullMQClient = undefined;
  }
  if (globalThis.__redisBullMQSubscriber) {
    promises.push(globalThis.__redisBullMQSubscriber.quit());
    globalThis.__redisBullMQSubscriber = undefined;
  }
  if (globalThis.__redisBullMQWorkerClient) {
    promises.push(globalThis.__redisBullMQWorkerClient.quit());
    globalThis.__redisBullMQWorkerClient = undefined;
  }
  await Promise.allSettled(promises);
  logger.info('redis_shutdown_complete', {}, 'Redis connections closed.');
};

