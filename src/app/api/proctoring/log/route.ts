import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contestId, eventType, description } = body;

    if (!contestId || !eventType || !description) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const log = await prisma.proctoringLog.create({
      data: {
        userId,
        contestId,
        eventType,
        description
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error saving proctoring log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
