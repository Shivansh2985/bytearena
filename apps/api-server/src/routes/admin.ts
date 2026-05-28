import { Router, Request, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAdmin } from '../middleware/auth';
import { getSystemMetrics } from '../services/observability/metrics';
import { sendNotification } from '../services/notifications';
import { getRedisClient } from '../lib/redis';

const router = Router();

router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;

    if (action === 'users') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ]);
      return res.json({ data: users, total, page, totalPages: Math.ceil(total / limit) });
    }

    if (action === 'submissions') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { username: true, id: true, name: true, email: true } }, question: { select: { title: true, contestId: true } } }
        }),
        prisma.submission.count()
      ]);
      return res.json({ data: submissions, total, page, totalPages: Math.ceil(total / limit) });
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
      const now = new Date();
      const [usersCount, submissionsCount, liveContestsCount, userStats] = await Promise.all([
        prisma.user.count(),
        prisma.submission.count(),
        prisma.contest.count({
          where: { startTime: { lte: now }, endTime: { gt: now } }
        }),
        prisma.user.aggregate({ _avg: { rating: true } })
      ]);

      // Calculate tier distribution
      // Since Prisma doesn't support grouping by arbitrary ranges, we can run multiple counts,
      // or a raw query. We'll use a raw query for Postgres.
      let tierDistributionRaw: any[] = [];
      try {
        tierDistributionRaw = await prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN rating >= 2400 THEN 'Grandmaster'
              WHEN rating >= 2100 THEN 'Master'
              WHEN rating >= 1900 THEN 'Expert'
              WHEN rating >= 1600 THEN 'Specialist'
              WHEN rating >= 1400 THEN 'Pupil'
              ELSE 'Beginner'
            END as name,
            CAST(COUNT(*) AS INTEGER) as value
          FROM "User"
          GROUP BY 
            CASE 
              WHEN rating >= 2400 THEN 'Grandmaster'
              WHEN rating >= 2100 THEN 'Master'
              WHEN rating >= 1900 THEN 'Expert'
              WHEN rating >= 1600 THEN 'Specialist'
              WHEN rating >= 1400 THEN 'Pupil'
              ELSE 'Beginner'
            END
        `;
      } catch (e) {
        console.error('Error fetching tier distribution', e);
      }

      // Contest participation trend (last 10 contests)
      const recentContests = await prisma.contest.findMany({
        where: { status: { in: ['COMPLETED', 'LIVE'] } },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: { _count: { select: { participants: true } } }
      });

      const contestParticipation = recentContests.reverse().map((c: any) => ({
        contest: c.title.substring(0, 15) + (c.title.length > 15 ? '...' : ''),
        participants: c._count.participants
      }));

      // Daily submissions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let dailySubmissionsRaw: any[] = [];
      try {
        dailySubmissionsRaw = await prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date,
            CAST(COUNT(*) AS INTEGER) as count
          FROM "Submission"
          WHERE "createdAt" >= ${sevenDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY DATE("createdAt") ASC
        `;
      } catch (e) {
        console.error('Error fetching daily submissions', e);
      }

      const dailySubmissions = dailySubmissionsRaw.map((d: any) => ({
        day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: d.count
      }));

      // Recent Alerts (Proctoring logs)
      const recentLogs = await prisma.proctoringLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } } }
      });
      const recentAlerts = recentLogs.map((l: any) => ({
        id: l.id,
        type: l.eventType === 'blur' ? 'warning' : 'danger',
        message: `${l.user?.name || l.user?.email || 'Unknown User'}: ${l.description}`,
        time: l.createdAt.toISOString()
      }));

      return res.json({
        usersCount,
        liveContestsCount,
        submissionsCount,
        avgRating: Math.round(userStats._avg.rating || 1200),
        tierDistribution: tierDistributionRaw.length > 0 ? tierDistributionRaw : null,
        contestParticipation,
        dailySubmissions: dailySubmissions.length > 0 ? dailySubmissions : null,
        recentAlerts
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

    // Prevent deleting system admins
    if (user.isSystemAdmin || user.email === 'admin@bytearena.dev') {
      return res.status(403).json({ error: 'Forbidden: Cannot delete system administrators' });
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

    // Notify user immediately and trigger live socket disconnect
    await sendNotification(
      participant.userId,
      "Removed from Contest",
      "An administrator has removed you from the live contest."
    );
    const redisClient = getRedisClient();
    await redisClient.publish('user:kick', JSON.stringify({
      userId: participant.userId,
      contestId: participant.contestId
    }));

    return res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Remove participant error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
