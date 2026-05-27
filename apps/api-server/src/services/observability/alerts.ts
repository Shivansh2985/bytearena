import { logger } from './logger';
import { getSystemMetrics } from './metrics';

export const checkSystemHealth = async () => {
  try {
    const metrics = await getSystemMetrics();
    
    // Check Redis Connections
    const connectedClients = parseInt(metrics.redis.clients?.connected_clients || '0', 10);
    if (connectedClients > 15) {
      logger.error('alert_redis_clients', { connectedClients }, 'CRITICAL ALERT: Redis connection count exceeded threshold (15)');
    }

    // Check Queue Backlog
    const judgePending = metrics.queues.judgeQueue.waiting + metrics.queues.judgeQueue.delayed;
    if (judgePending > 50) {
      logger.warn('alert_queue_backlog', { queue: 'judgeQueue', pending: judgePending }, 'WARNING: Judge Queue has a high backlog.');
    }

    // Check Cloudinary limit (example: limit is dependent on plan, warn if high)
    // In free tier, transformations/bandwidth can spike.
    if (metrics.cloudinary && (metrics.cloudinary as any).credits?.usage > 20) {
      logger.warn('alert_cloudinary_usage', { usage: (metrics.cloudinary as any).credits?.usage }, 'WARNING: Cloudinary credit usage is getting high.');
    }

  } catch (error: any) {
    logger.error('alert_system_error', { error: error.message }, 'Failed to run health checks.');
  }
};

// Poller (can be started in a cron or setTimeout)
export const startHealthPoller = () => {
  logger.info('health_poller_start', {}, 'Starting system health poller (1 min intervals)');
  setInterval(() => {
    checkSystemHealth();
  }, 60000);
};
