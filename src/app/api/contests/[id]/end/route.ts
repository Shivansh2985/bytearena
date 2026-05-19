import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const participant = await prisma.contestParticipant.findFirst({
      where: { userId, contestId: id }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not participating' }, { status: 400 });
    }

    await prisma.contestParticipant.update({
      where: { id: participant.id },
      data: { hasEnded: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending contest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
