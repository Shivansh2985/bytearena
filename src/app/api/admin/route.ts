import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

async function isAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (email === 'admin@bytearena.dev') return true;

  const userId = session?.user?.id;
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === 'ADMIN';
}

export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'users') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(users);
    }

    if (action === 'submissions') {
      const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, id: true, name: true, email: true } }, question: { select: { title: true, contestId: true } } }
      });
      return NextResponse.json(submissions);
    }

    if (action === 'proctoring') {
      // Find all live or upcoming contests for now (or all for simplicity)
      const participants = await prisma.contestParticipant.findMany({
        where: { hasEnded: false }, // Only active participants
        include: {
          user: { select: { id: true, name: true, email: true, rating: true } },
          contest: { select: { id: true, title: true } }
        },
        orderBy: { score: 'desc' }
      });

      // Get latest snapshot per user
      const snapshots = await prisma.snapshot.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Get recent proctoring logs
      const logs = await prisma.proctoringLog.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const processed = participants.map((p, i) => {
        const userSnaps = snapshots.filter(s => s.userId === p.userId && s.contestId === p.contestId);
        const userLogs = logs.filter(l => l.userId === p.userId && l.contestId === p.contestId);
        const latestSnap = userSnaps[0];
        
        const tabSwitches = userLogs.filter(l => l.eventType === 'blur').length;
        const warnings = tabSwitches;

        return {
          id: p.id,
          userId: p.userId,
          name: p.user.name || p.user.email || 'Unknown',
          avatar: (p.user.name || p.user.email || 'US').substring(0, 2).toUpperCase(),
          rank: i + 1,
          score: p.score,
          status: warnings > 5 ? 'flagged' : warnings > 0 ? 'warning' : 'clean',
          warnings,
          cameraStatus: latestSnap ? 'active' : 'away',
          tabSwitches,
          lastActivity: latestSnap ? latestSnap.createdAt.toISOString() : 'Unknown',
          contest: p.contest.title,
          latestSnapshot: latestSnap?.imageUrl || null,
          logs: userLogs.map(l => ({ time: l.createdAt.toISOString(), event: l.description }))
        };
      });

      return NextResponse.json(processed);
    }
    
    if (action === 'stats') {
      const usersCount = await prisma.user.count();
      const liveContestsCount = await prisma.contest.count({ where: { status: 'LIVE' } });
      const submissionsCount = await prisma.submission.count();
      
      return NextResponse.json({
        usersCount,
        liveContestsCount,
        submissionsCount,
        avgRating: 1200 // Mock average rating for now as we don't calculate it fully
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
