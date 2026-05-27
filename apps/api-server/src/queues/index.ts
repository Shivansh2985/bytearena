import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import { getBullMQClient } from '../lib/redis';

dotenv.config();

const connection = getBullMQClient();

export const judgeQueue = new Queue('judgeQueue', { connection });
export const snapshotQueue = new Queue('snapshotQueue', { connection });
export const notificationQueue = new Queue('notificationQueue', { connection });
export const analyticsQueue = new Queue('analyticsQueue', { connection });

console.log('BullMQ Queues initialized');

