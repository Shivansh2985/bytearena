import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const judgeQueue = new Queue('judgeQueue', { connection });
export const snapshotQueue = new Queue('snapshotQueue', { connection });
export const notificationQueue = new Queue('notificationQueue', { connection });
export const analyticsQueue = new Queue('analyticsQueue', { connection });

console.log('BullMQ Queues initialized');
