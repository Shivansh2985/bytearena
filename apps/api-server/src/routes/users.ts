import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: true,
        badges: true,
        ratingHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        languageStats: true,
        contests: {
          include: {
            contest: {
              include: {
                _count: {
                  select: { participants: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { submissions: true, contests: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate Global Rank (tie-breaker by name lexicographically)
    const higherRatedCount = await prisma.user.count({
      where: {
        OR: [
          { rating: { gt: user.rating } },
          { 
            rating: user.rating, 
            name: { lt: user.name || '' } 
          }
        ]
      }
    });
    const globalRank = higherRatedCount + 1;

    // Calculate Accepted Submissions
    const acceptedSubmissions = await prisma.submission.count({
      where: { userId, status: 'ACCEPTED' }
    });

    return res.json({
      ...user,
      globalRank,
      acceptedSubmissions
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /me
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = req.body;
    
    // Validate update fields (only allow safe fields)
    const updateData: any = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.resumeUrl !== undefined) updateData.resumeUrl = data.resumeUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// We can add the /leaderboard route here as well
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ],
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          rating: true,
          imageUrl: true,
          _count: {
            select: { submissions: { where: { status: 'ACCEPTED' } }, contests: true }
          }
        }
      }),
      prisma.user.count()
    ]);

    const formattedUsers = users.map((u, index) => ({
      ...u,
      contests: u._count.contests,
      solved: u._count.submissions
    }));

    return res.json({
      data: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
