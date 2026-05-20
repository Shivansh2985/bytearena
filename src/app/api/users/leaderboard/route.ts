import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const take = searchParams.get('take');

    const users = await prisma.user.findMany({
      orderBy: { rating: 'desc' },
      ...(take ? { take: parseInt(take, 10) } : {}),
      include: {
        ratingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            submissions: true,
            contests: true
          }
        }
      }
    });

    const formattedUsers = users.map((u: any) => {
      const displayName = u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}` : '') || 'User';
      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
      const latestHistory = u.ratingHistory[0];
      const change = latestHistory ? latestHistory.ratingChange : 0;

      let tier = 'Beginner';
      if (u.rating >= 2400) tier = 'Master';
      else if (u.rating >= 2100) tier = 'Candidate Master';
      else if (u.rating >= 1900) tier = 'Expert';
      else if (u.rating >= 1600) tier = 'Specialist';
      else if (u.rating >= 1400) tier = 'Pupil';

      return {
        id: u.id,
        name: displayName,
        avatar: initials,
        rating: u.rating,
        change,
        contests: u._count.contests,
        solved: u._count.submissions,
        country: '🇮🇳',
        tier,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
