import { Router, Request, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest, requireAdmin, optionalAuth } from '../middleware/auth';
import { sendNotification } from '../services/notifications';

const router = Router();

// ─── GET /api/contests - List all contests ──────────────────
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Parse query params
    const status = req.query.status as string;
    const difficulty = req.query.difficulty as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (difficulty) whereClause.difficulty = difficulty;

    const now = new Date();
    if (status) {
      if (status.toLowerCase() === 'live') {
        whereClause.startTime = { lte: now };
        whereClause.endTime = { gt: now };
      } else if (status.toLowerCase() === 'upcoming') {
        whereClause.startTime = { gt: now };
      } else if (status.toLowerCase() === 'completed') {
        whereClause.endTime = { lte: now };
      }
    }

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { participants: true, questions: true },
          },
          ...(userId ? {
            registrations: { where: { userId: userId } },
            participants: { where: { userId: userId } }
          } : {})
        }
      }),
      prisma.contest.count({ where: whereClause })
    ]);

    // Format for frontend
    const formattedContests = contests.map((c: any) => {
      const startTime = new Date(c.startTime).getTime();
      const endTime = new Date(c.endTime).getTime();
      const nowMs = Date.now();
      
      let computedStatus = 'upcoming';
      if (nowMs >= startTime && nowMs < endTime) {
        computedStatus = 'live';
      } else if (nowMs >= endTime) {
        computedStatus = 'completed';
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        status: computedStatus,
        startTime,
        endTime,
        participants: c._count.participants,
        totalQuestions: c._count.questions,
        tags: c.tags,
        myRank: userId && c.participants?.length > 0 ? c.participants[0].rank : null,
        myScore: userId && c.participants?.length > 0 ? c.participants[0].score : null,
        registered: userId ? c.registrations?.length > 0 : false,
      };
    });

    // Sort: Live (desc), Upcoming (asc), Completed (desc)
    formattedContests.sort((a: any, b: any) => {
      const statusOrder: Record<string, number> = { live: 1, upcoming: 2, completed: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.status === 'upcoming') {
        return a.startTime - b.startTime;
      }
      return b.startTime - a.startTime;
    });

    // If paginated param is explicitly passed or simply by default, we return paginated object
    // To not break existing apps, we can just return { data, total, page, totalPages }
    return res.json({ data: formattedContests, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/contests/my-contests - List contests for user ──────────────────
router.get('/my-contests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where: {
          OR: [
            { registrations: { some: { userId } } },
            { participants: { some: { userId } } }
          ]
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { participants: true, questions: true },
          },
          participants: { where: { userId } }
        }
      }),
      prisma.contest.count({
        where: {
          OR: [
            { registrations: { some: { userId } } },
            { participants: { some: { userId } } }
          ]
        }
      })
    ]);

    const formattedContests = contests.map((c: any) => {
      const nowMs = Date.now();
      const startTime = new Date(c.startTime).getTime();
      const endTime = new Date(c.endTime).getTime();
      
      let computedStatus = 'upcoming';
      if (nowMs >= startTime && nowMs < endTime) {
        computedStatus = 'live';
      } else if (nowMs >= endTime) {
        computedStatus = 'completed';
      }

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        status: computedStatus,
        resultsPublished: c.resultsPublished,
        startTime,
        endTime,
        participants: c._count.participants,
        totalQuestions: c._count.questions,
        myRank: c.participants?.length > 0 ? c.participants[0].rank : null,
        myScore: c.participants?.length > 0 ? c.participants[0].score : null,
      };
    });

    return res.json({ data: formattedContests, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching my-contests:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/contests - Create a new contest (admin only) ─
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const contest = await prisma.contest.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty || 'MEDIUM',
        status: data.status || 'UPCOMING',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        tags: data.tags || [],
        questions: {
          create: (data.questions || []).map((q: any) => ({
            title: q.title,
            problemStatement: q.description || '',
            constraints: q.constraints || '',
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            difficulty: q.difficulty || 'MEDIUM',
            points: q.points || 100,
            testCases: {
              create: (q.testCases || []).map((tc: any) => ({
                input: tc.input || '',
                expectedOutput: tc.output || tc.expectedOutput || '',
                isHidden: tc.isHidden || false,
                isSample: tc.isSample || false,
                explanation: tc.explanation || null,
              }))
            }
          }))
        }
      }
    });

    return res.status(201).json(contest);
  } catch (error) {
    console.error('Error creating contest:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
// ─── DELETE /api/contests/:id - Delete a contest (admin only) ────
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contest.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Error deleting contest:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ─── PUT /api/contests/:id - Edit a contest (admin only) ────
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const contest = await prisma.contest.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        status: data.status,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        tags: data.tags,
      }
    });
    return res.json({ success: true, contest });
  } catch (error) {
    console.error('Error updating contest:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/contests/:id - Get contest details ────────────
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    let isAdmin = false;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role === 'ADMIN') isAdmin = true;
    }

    // Auto-register participant if logged in
    let hasEnded = false;
    if (userId) {
      const existingParticipant = await prisma.contestParticipant.findFirst({
        where: { userId, contestId: id }
      });
      if (!existingParticipant) {
        await prisma.contestParticipant.create({
          data: { userId, contestId: id, score: 0 }
        });
      } else {
        hasEnded = existingParticipant.hasEnded;
      }
    }

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        questions: {
          include: { testCases: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, rating: true, username: true }
            }
          },
          orderBy: [
            { score: 'desc' },
            { updatedAt: 'asc' },
            { user: { name: 'asc' } }
          ]
        }
      }
    });

    if (!contest) return res.status(404).json({ error: 'Not Found' });

    let snapshots: any[] = [];
    let submissions: any[] = [];

    if (isAdmin) {
      snapshots = await prisma.snapshot.findMany({
        where: { contestId: id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });

      submissions = await prisma.submission.findMany({
        where: { question: { contestId: id } },
        include: {
          user: { select: { name: true, email: true } },
          question: { select: { title: true, points: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Compute status
    const now = Date.now();
    const startTime = new Date(contest.startTime).getTime();
    const endTime = new Date(contest.endTime).getTime();
    let computedStatus = 'upcoming';
    if (now >= startTime && now < endTime) {
      computedStatus = 'live';
    } else if (now >= endTime) {
      computedStatus = 'completed';
    }

    return res.json({
      ...contest,
      status: computedStatus,
      hasEnded,
      submissions: isAdmin ? submissions : undefined,
      snapshots: isAdmin ? snapshots : undefined,
    });
  } catch (error) {
    console.error('Error fetching contest details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/contests/:id/results - Get published results ────────────
router.get('/:id/results', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const contest = await prisma.contest.findUnique({
      where: { id },
      select: { resultsPublished: true, title: true }
    });

    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    if (!contest.resultsPublished) return res.status(403).json({ error: 'Results have not been published yet' });

    const [participants, total] = await Promise.all([
      prisma.contestParticipant.findMany({
        where: { contestId: id },
        orderBy: { rank: 'asc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              rating: true,
              imageUrl: true,
            }
          }
        }
      }),
      prisma.contestParticipant.count({ where: { contestId: id } })
    ]);

    // Fetch rating changes for these participants
    const userIds = participants.map(p => p.userId);
    const ratingChanges = await prisma.ratingHistory.findMany({
      where: {
        contestId: id,
        userId: { in: userIds }
      }
    });

    const results = participants.map(p => {
      const history = ratingChanges.find(r => r.userId === p.userId);
      return {
        id: p.id,
        userId: p.userId,
        rank: p.rank,
        score: p.score,
        user: {
          name: p.user.name || p.user.email,
          username: p.user.username,
          rating: p.user.rating,
          avatar: p.user.imageUrl || (p.user.name || p.user.email || 'U').substring(0, 2).toUpperCase()
        },
        ratingChange: history?.ratingChange || 0,
        newRating: history?.newRating || p.user.rating
      };
    });

    return res.json({
      contestTitle: contest.title,
      data: results,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/contests/:id/register - Register for a contest
router.post('/:id/register', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate contest exists and is not completed
      const contest = await tx.contest.findUnique({
        where: { id }
      });

      if (!contest) {
        throw new Error('CONTEST_NOT_FOUND');
      }

      if (Date.now() > new Date(contest.endTime).getTime()) {
        throw new Error('CONTEST_ENDED');
      }

      // 2. Prevent duplicate registrations safely
      const existing = await tx.contestRegistration.findFirst({
        where: { userId, contestId: id }
      });

      if (existing) {
        throw new Error('ALREADY_REGISTERED');
      }

      // 3. Perform registration
      const registration = await tx.contestRegistration.create({
        data: { userId, contestId: id }
      });

      // 4. Grant badge for first contest registration
      let newlyAwardedBadge = false;
      const regCount = await tx.contestRegistration.count({ where: { userId } });
      if (regCount === 1) { // includes the one we just created
        const hasBadge = await tx.badge.findFirst({ where: { userId, name: 'First Blood' } });
        if (!hasBadge) {
          await tx.badge.create({
            data: {
              userId,
              name: 'First Blood',
              description: 'Registered for your first contest!',
              imageUrl: '⚔️'
            }
          });
          newlyAwardedBadge = true;
        }
      }

      return { registration, newlyAwardedBadge, contestTitle: contest.title };
    });

    if (result.newlyAwardedBadge) {
      // Send a push notification for the badge!
      await sendNotification(userId, 'Badge Earned! 🏆', 'You earned the "First Blood" badge for registering for your first contest.');
    }

    // Send a push notification for the contest registration
    await sendNotification(userId, 'Registration Confirmed', `You have successfully registered for ${result.contestTitle}.`);

    return res.status(201).json({ success: true, registration: result.registration });
  } catch (error: any) {
    if (error.message === 'CONTEST_NOT_FOUND') return res.status(404).json({ error: 'Contest not found' });
    if (error.message === 'CONTEST_ENDED') return res.status(400).json({ error: 'Cannot register for a completed contest' });
    if (error.message === 'ALREADY_REGISTERED') return res.status(400).json({ error: 'Already registered' });
    
    console.error('Error registering for contest:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/contests/:id/end - End a contest for a user ─
router.post('/:id/end', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const participant = await prisma.contestParticipant.findFirst({
      where: { userId, contestId: id }
    });

    if (!participant) {
      return res.status(400).json({ error: 'Not participating' });
    }

    await prisma.contestParticipant.update({
      where: { id: participant.id },
      data: { hasEnded: true }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error ending contest:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/contests/:id/calculate-ratings - Elo calc ────
const K = 32;

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

router.post('/:id/calculate-ratings', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: true },
          orderBy: [
            { score: 'desc' },
            { updatedAt: 'asc' },
            { user: { name: 'asc' } }
          ]
        }
      }
    });

    if (!contest) return res.status(404).json({ error: 'Not found' });

    const participants = contest.participants;
    if (participants.length === 0) return res.json({ success: true, message: 'No participants' });

    // Assign strict unique ranks based on score, penalty, and name
    for (let i = 0; i < participants.length; i++) {
      const currentRank = i + 1;
      (participants[i] as any).rank = currentRank;

      await prisma.contestParticipant.update({
        where: { id: participants[i].id },
        data: { rank: currentRank }
      });
    }

    // Calculate Elo changes
    const updates: any[] = [];
    for (let i = 0; i < participants.length; i++) {
      const pA = participants[i];
      let actualScore = 0;
      let expected = 0;

      for (let j = 0; j < participants.length; j++) {
        if (i === j) continue;
        const pB = participants[j];

        let s = 0;
        if (pA.score > pB.score) s = 1;
        else if (pA.score === pB.score) s = 0.5;
        else s = 0;

        actualScore += s;
        expected += expectedScore(pA.user.rating, pB.user.rating);
      }

      if (participants.length > 1) {
        const N = participants.length - 1;
        const ratingChange = Math.round(K * (actualScore - expected) / N);
        const newRating = Math.max(0, pA.user.rating + ratingChange);

        updates.push(
          prisma.user.update({
            where: { id: pA.user.id },
            data: { rating: newRating }
          }),
          prisma.ratingHistory.create({
            data: {
              userId: pA.user.id,
              contestId: contest.id,
              ratingChange,
              newRating
            }
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return res.json({ success: true, updated: participants.length });
  } catch (error) {
    console.error('Error calculating ratings:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
