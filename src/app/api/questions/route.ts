import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get('contestId');

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

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await req.json();
    
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
          create: data.testCases.map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            isSample: tc.isSample,
            explanation: tc.explanation
          }))
        }
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
