import { Router, Request, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Mark all as read
router.post('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Mark single as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { id } = req.params;
    
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Save push subscription
router.post('/push-subscription', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Create or update subscription based on endpoint
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        auth: keys.auth,
        p256dh: keys.p256dh
      },
      create: {
        userId,
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
