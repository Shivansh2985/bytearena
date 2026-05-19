import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;

    if (!userId && !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (email === 'admin@bytearena.dev') {
      return NextResponse.json({
        id: 'admin-123',
        email: 'admin@bytearena.dev',
        name: 'Administrator',
        role: 'ADMIN',
        rating: 9999,
        skills: ['System Design', 'React', 'Node.js'],
        projects: [],
        badges: [],
        ratingHistory: [],
        languageStats: [],
        _count: { submissions: 0, contests: 0 }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: true,
        badges: true,
        ratingHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        languageStats: true,
        _count: {
          select: { submissions: true, contests: true }
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
