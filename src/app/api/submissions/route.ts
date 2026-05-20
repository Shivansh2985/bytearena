import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = await req.json();
    const { questionId, language, code, contestId } = data;

    if (!questionId || !language || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // In a real production app, we would send this code to a judge queue (like Judge0, Piston, or a custom worker)
    // For now, we simulate a compilation and execution delay, then mark it ACCEPTED.
    
    // Triggering Socket.io event for global logging:
    // Because we are in an App Router route, we can't directly access res.socket.server.io
    // To emit a socket event, we'd normally use a Redis pub/sub, or we can make a local HTTP call to a custom endpoint,
    // or just rely on the frontend to emit the 'new-submission' event to the socket server after getting a 200 OK.
    
    // We will assume frontend emits it for simplicity in a serverless environment.

    return NextResponse.json({
      submissionId: submission.id,
      status: 'PENDING',
      message: 'Submission received and is being evaluated'
    }, { status: 201 });

  } catch (error) {
    console.error('Error handling submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get('contestId');
    const questionId = searchParams.get('questionId');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
