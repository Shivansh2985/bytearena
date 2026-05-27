import { Router, Request, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAdmin } from '../middleware/auth';
import { getSystemMetrics } from '../services/observability/metrics';

const router = Router();

router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;

    if (action === 'users') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(users);
    }

    if (action === 'submissions') {
      const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, id: true, name: true, email: true } }, question: { select: { title: true, contestId: true } } }
      });
      return res.json(submissions);
    }

    if (action === 'proctoring') {
      const participants = await prisma.contestParticipant.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, rating: true } },
          contest: { select: { id: true, title: true } }
        },
        orderBy: { score: 'desc' }
      });

      const snapshots = await prisma.snapshot.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const logs = await prisma.proctoringLog.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const processed = participants.map((p: any, i: number) => {
        const userSnaps = snapshots.filter((s: any) => s.userId === p.userId && s.contestId === p.contestId);
        const userLogs = logs.filter((l: any) => l.userId === p.userId && l.contestId === p.contestId);
        const latestSnap = userSnaps[0];
        
        const tabSwitches = userLogs.filter((l: any) => l.eventType === 'blur').length;
        const warnings = tabSwitches;

        let cameraStatus = 'away';
        if (latestSnap) {
          const snapAgeMinutes = (Date.now() - latestSnap.createdAt.getTime()) / (1000 * 60);
          cameraStatus = snapAgeMinutes > 1.5 ? 'away' : 'active';
        }

        return {
          id: p.id,
          userId: p.userId,
          name: p.user.name || p.user.email || 'Unknown',
          avatar: (p.user.name || p.user.email || 'US').substring(0, 2).toUpperCase(),
          rank: i + 1,
          score: p.score,
          status: warnings > 5 ? 'flagged' : warnings > 0 ? 'warning' : 'clean',
          warnings,
          cameraStatus,
          tabSwitches,
          lastActivity: latestSnap ? latestSnap.createdAt.toISOString() : 'Unknown',
          contest: p.contest.id,
          contestTitle: p.contest.title,
          latestSnapshot: latestSnap?.imageUrl || null,
          logs: userLogs.map((l: any) => ({ time: l.createdAt.toISOString(), event: l.description }))
        };
      });

      return res.json(processed);
    }
    
    if (action === 'stats') {
      const usersCount = await prisma.user.count();
      const liveContestsCount = await prisma.contest.count({ where: { status: 'LIVE' } });
      const submissionsCount = await prisma.submission.count();
      return res.json({
        usersCount,
        liveContestsCount,
        submissionsCount,
        avgRating: 1200
      });
    }

    if (action === 'system-metrics') {
      const metrics = await getSystemMetrics();
      return res.json(metrics);
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting oneself
    if (user.id === (req as any).user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/participants/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if participant exists
    const participant = await prisma.contestParticipant.findUnique({ where: { id } });
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    await prisma.contestParticipant.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Remove participant error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
