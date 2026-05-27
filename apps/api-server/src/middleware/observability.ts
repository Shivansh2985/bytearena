import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/observability/logger';
import crypto from 'crypto';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  const correlationId = req.headers['x-correlation-id'] as string || requestId;

  // Add IDs to request for downstream use
  (req as any).requestId = requestId;
  (req as any).correlationId = correlationId;

  res.setHeader('X-Request-Id', requestId);

  // Log on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Do not log health checks heavily to avoid noise
    if (req.originalUrl.includes('/health')) {
      return;
    }

    const metadata = {
      requestId,
      correlationId,
      route: req.originalUrl,
      method: req.method,
      statusCode,
      duration,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      logger.error('api_request', metadata, `Server Error on ${req.method} ${req.originalUrl}`);
    } else if (statusCode >= 400) {
      logger.warn('api_request', metadata, `Client Error on ${req.method} ${req.originalUrl}`);
    } else {
      logger.info('api_request', metadata, `Success ${req.method} ${req.originalUrl}`);
    }
  });

  next();
};
