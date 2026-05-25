import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import { AccessToken } from 'livekit-server-sdk';

const router = Router();

// GET /api/proctoring/token - Generate a LiveKit token for streaming
router.get('/token', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const room = req.query.room as string;
    if (!room) {
      return res.status(400).json({ error: 'room parameter is required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    
    // In production, ensure these keys are valid. Fallbacks added for dev environment.
    const identity = req.user?.id || 'unknown';
    
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
    });
    
    at.addGrant({ 
      roomJoin: true, 
      canPublish: true, 
      canSubscribe: true, 
      room 
    });
    
    const token = await at.toJwt();
    return res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/proctoring/log - Log a proctoring event
router.post('/log', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { contestId, eventType, description, severity } = req.body;

    if (!contestId || !eventType || !description) {
      return res.status(400).json({ error: 'Missing required fields: contestId, eventType, description' });
    }

    const log = await prisma.proctoringLog.create({
      data: {
        userId,
        contestId,
        eventType,
        description,
        severity: severity || 'WARNING',
      }
    });

    return res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Error saving proctoring log:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/proctoring/logs - Get proctoring logs (admin only)
router.get('/logs', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.query.contestId as string;
    const userId = req.query.userId as string;

    if (!contestId) {
      return res.status(400).json({ error: 'contestId is required' });
    }

    const whereClause: any = { contestId };
    if (userId) whereClause.userId = userId;

    const logs = await prisma.proctoringLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, name: true, email: true }
        }
      }
    });

    return res.json(logs);
  } catch (error) {
    console.error('Error fetching proctoring logs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/proctoring/snapshot - Upload a webcam snapshot
router.post('/snapshot', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { contestId, imageBase64 } = req.body;

    if (!contestId || !imageBase64) {
      return res.status(400).json({ error: 'Missing required fields: contestId, imageBase64' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: `bytearena/snapshots/${contestId}`,
      resource_type: 'image',
    });

    // Save to DB
    const snapshot = await prisma.snapshot.create({
      data: {
        userId,
        contestId,
        imageUrl: uploadResult.secure_url,
      }
    });

    return res.status(201).json({ success: true, snapshot });
  } catch (error) {
    console.error('Error uploading snapshot:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/proctoring/snapshots - Get snapshots (admin only)
router.get('/snapshots', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.query.contestId as string;
    const userId = req.query.userId as string;

    if (!contestId) {
      return res.status(400).json({ error: 'contestId is required' });
    }

    const whereClause: any = { contestId };
    if (userId) whereClause.userId = userId;

    const snapshots = await prisma.snapshot.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    return res.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/proctoring/stats/:contestId - Get proctoring stats for a contest (admin only)
router.get('/stats/:contestId', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const [logCount, snapshotCount, flaggedUsers] = await Promise.all([
      prisma.proctoringLog.count({ where: { contestId } }),
      prisma.snapshot.count({ where: { contestId } }),
      prisma.proctoringLog.groupBy({
        by: ['userId'],
        where: { contestId, severity: 'CRITICAL' },
        _count: { id: true },
      }),
    ]);

    return res.json({
      contestId,
      totalLogs: logCount,
      totalSnapshots: snapshotCount,
      flaggedUserCount: flaggedUsers.length,
      flaggedUsers: flaggedUsers.map((u: any) => ({
        userId: u.userId,
        criticalEventCount: u._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching proctoring stats:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
