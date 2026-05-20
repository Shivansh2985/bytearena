import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    const userId = session?.user?.id;
    let isAdmin = false;

    if (email === 'admin@bytearena.dev') {
      isAdmin = true;
    } else if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role === 'ADMIN') isAdmin = true;
    }

    const { id } = await params;

    // Auto-register participant if they are logged in
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
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!contest) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

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

    // Format output
    const now = Date.now();
    const startTime = new Date(contest.startTime).getTime();
    const endTime = new Date(contest.endTime).getTime();
    let computedStatus = 'upcoming';
    if (now >= startTime && now < endTime) {
      computedStatus = 'live';
    } else if (now >= endTime) {
      computedStatus = 'completed';
    }

    return NextResponse.json({
      ...contest,
      status: computedStatus,
      hasEnded,
      submissions: isAdmin ? submissions : undefined,
      snapshots: isAdmin ? snapshots : undefined
    });

  } catch (error) {
    console.error('Error fetching contest details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
