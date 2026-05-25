import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const contestId = req.query.contestId as string;

    const whereClause: any = {};
    if (contestId) whereClause.contestId = contestId;

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        testCases: {
          where: { isSample: true } // Only return sample test cases to frontend
        }
      }
    });

    return res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    
    const question = await prisma.question.create({
      data: {
        title: data.title,
        problemStatement: data.problemStatement,
        constraints: data.constraints,
        inputFormat: data.inputFormat,
        outputFormat: data.outputFormat,
        difficulty: data.difficulty,
        points: data.points,
        contestId: data.contestId,
        testCases: {
          create: data.testCases?.map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            isSample: tc.isSample,
            explanation: tc.explanation
          }))
        }
      }
    });

    return res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Simplification: we only update main fields for now, test cases update requires delete/recreate typically.
    const question = await prisma.question.update({
      where: { id },
      data: {
        title: data.title,
        problemStatement: data.problemStatement,
        constraints: data.constraints,
        inputFormat: data.inputFormat,
        outputFormat: data.outputFormat,
        difficulty: data.difficulty,
        points: data.points,
      }
    });

    return res.json({ success: true, question });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
