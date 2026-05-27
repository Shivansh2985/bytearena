import { getRedisClient } from '../../lib/redis';
import { judgeQueue, snapshotQueue } from '../../queues';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

export const getSystemMetrics = async () => {
  try {
    const redis = getRedisClient();

    // Redis Metrics
    const [infoCommandStats, infoMemory, infoClients] = await Promise.all([
      redis.info('commandstats'),
      redis.info('memory'),
      redis.info('clients')
    ]);

    const redisStats = {
      commands: parseRedisInfo(infoCommandStats),
      memory: parseRedisInfo(infoMemory),
      clients: parseRedisInfo(infoClients),
    };

    // BullMQ Metrics
    const [judgeCounts, snapshotCounts] = await Promise.all([
      judgeQueue.getJobCounts(),
      snapshotQueue.getJobCounts()
    ]);

    const queueStats = {
      judgeQueue: judgeCounts,
      snapshotQueue: snapshotCounts
    };

    // Cloudinary Metrics (usage API returns an object with usage stats)
    let cloudinaryStats = {};
    try {
      const usage = await cloudinary.api.usage();
      cloudinaryStats = usage;
    } catch (e: any) {
      logger.warn('cloudinary_metrics_error', { error: e.message });
      cloudinaryStats = { error: 'Failed to fetch Cloudinary metrics' };
    }

    return {
      timestamp: Date.now(),
      redis: redisStats,
      queues: queueStats,
      cloudinary: cloudinaryStats,
    };
  } catch (error: any) {
    logger.error('system_metrics_error', { error: error.message });
    throw error;
  }
};

const parseRedisInfo = (infoString: string) => {
  const result: Record<string, string> = {};
  infoString.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    }
  });
  return result;
};
