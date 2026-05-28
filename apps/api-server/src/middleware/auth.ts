import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
  } catch (err) {
    // ignore
  }
  next();
};

import { prisma } from '@bytearena/database';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, async () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    try {
      // Securely fetch from DB to prevent token spoofing or privilege escalation
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });
      if (!dbUser || dbUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error during auth check' });
    }
  });
};
