import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = req.body;
    const { questionId, language, code, contestId } = data;

    if (!questionId || !language || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the submission record
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        questionId: questionId,
        language: language,
        code: code,
        status: 'PENDING',
      }
    });

    return res.status(201).json({
      submissionId: submission.id,
      status: 'PENDING',
      message: 'Submission received and is being evaluated'
    });

  } catch (error) {
    console.error('Error handling submission:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const contestId = req.query.contestId as string;
    const questionId = req.query.questionId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isContestCompleted = false;
    if (contestId) {
      const contest = await prisma.contest.findUnique({ where: { id: contestId } });
      if (contest) {
        isContestCompleted = new Date(contest.endTime).getTime() <= Date.now();
      }
    }

    const whereClause: any = {};
    if (questionId) whereClause.questionId = questionId;
    if (contestId) {
      whereClause.question = { contestId: contestId };
    }

    // Only restrict to own submissions if it is not an admin AND not a completed contest
    if (user.role !== 'ADMIN' && !isContestCompleted) {
      whereClause.userId = user.id;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        question: { select: { id: true, title: true, points: true, difficulty: true, contestId: true, contest: { select: { title: true } } } },
        user: { select: { username: true, name: true } }
      }
    });

    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
