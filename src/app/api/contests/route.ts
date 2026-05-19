import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // LIVE, UPCOMING, COMPLETED
    const difficulty = searchParams.get('difficulty');
    
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (difficulty) whereClause.difficulty = difficulty;

    const contests = await prisma.contest.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: { participants: true, questions: true },
        },
        ...(userId ? {
          registrations: { where: { userId: userId } },
          participants: { where: { userId: userId } }
        } : {})
      }
    });

    // Format for frontend
    const now = Date.now();
    const formattedContests = contests.map((c: any) => {
      const startTime = new Date(c.startTime).getTime();
      const endTime = new Date(c.endTime).getTime();
      
      let computedStatus = 'upcoming';
      if (now >= startTime && now < endTime) {
        computedStatus = 'live';
      } else if (now >= endTime) {
        computedStatus = 'completed';
      }

      return {
        id: c.id,
        title: c.title,
        difficulty: c.difficulty,
        status: computedStatus,
        startTime,
        endTime,
        participants: c._count.participants,
        totalQuestions: c._count.questions,
        tags: c.tags,
        myRank: userId && c.participants.length > 0 ? c.participants[0].rank : null,
        myScore: userId && c.participants.length > 0 ? c.participants[0].score : null,
        registered: userId ? c.registrations.length > 0 : false,
      };
    });

    return NextResponse.json(formattedContests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
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
            constraints: '',
            inputFormat: '',
            outputFormat: '',
            difficulty: q.difficulty || 'MEDIUM',
            points: q.points || 100,
            testCases: {
              create: (q.testCases || []).map((tc: any) => ({
                input: tc.input || '',
                expectedOutput: tc.output || '',
                isHidden: tc.isHidden || false,
                isSample: false
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
