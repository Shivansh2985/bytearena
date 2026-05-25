import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { judgeQueue } from '../queues';

const router = Router();

// POST /api/judge - Execute and judge code (Async via BullMQ)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { code, language, problemId, action, customInput } = req.body;

    if (!code || !language || !problemId || !action) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Push the job to the BullMQ queue
    const job = await judgeQueue.add('judgeExecution', {
      userId,
      code,
      language,
      problemId,
      action,
      customInput
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true, // Prevent queue memory leaks in Redis
      removeOnFail: { count: 100 }, // Keep last 100 failures for debugging
    });

    return res.status(202).json({ 
      status: 'queued', 
      jobId: job.id,
      message: 'Code execution has been queued.'
    });

  } catch (error: any) {
    console.error('Judge Queue Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/judge/job/:jobId - Poll job status
router.get('/job/:jobId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const job = await judgeQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const isCompleted = await job.isCompleted();
    const isFailed = await job.isFailed();
    
    if (isCompleted) {
      return res.json({
        jobStatus: 'completed',
        result: job.returnvalue,
      });
    } else if (isFailed) {
      return res.json({
        jobStatus: 'failed',
        error: job.failedReason,
      });
    } else {
      return res.json({
        jobStatus: 'processing',
      });
    }
  } catch (error: any) {
    console.error('Job Status Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/judge/:submissionId - Get judging results for a submission
router.get('/:submissionId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        testResults: true,
        question: {
          select: { id: true, title: true, points: true, difficulty: true, contestId: true }
        },
        user: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Only allow users to see their own submissions (unless admin)
    if (submission.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
