import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Simple Elo rating update for competitive programming
// Base K factor
const K = 32;

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: true },
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!contest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const participants = contest.participants;
    if (participants.length === 0) return NextResponse.json({ success: true, message: 'No participants' });

    // Ensure ranks are assigned based on score
    let currentRank = 1;
    for (let i = 0; i < participants.length; i++) {
      if (i > 0 && participants[i].score < participants[i - 1].score) {
        currentRank = i + 1;
      }
      participants[i].rank = currentRank;
      
      await prisma.contestParticipant.update({
        where: { id: participants[i].id },
        data: { rank: currentRank }
      });
    }

    // Calculate Elo changes
    const updates = [];
    for (let i = 0; i < participants.length; i++) {
      const pA = participants[i];
      let actualScore = 0;
      let expected = 0;

      for (let j = 0; j < participants.length; j++) {
        if (i === j) continue;
        const pB = participants[j];
        
        // pA's actual score against pB (1 for win, 0.5 for tie, 0 for loss)
        let s = 0;
        if (pA.score > pB.score) s = 1;
        else if (pA.score === pB.score) s = 0.5;
        else s = 0;

        actualScore += s;
        expected += expectedScore(pA.user.rating, pB.user.rating);
      }

      // If only 1 participant, no change
      if (participants.length > 1) {
        // Average the score differences for multi-player ELO approximation
        // Actually, Codeforces uses a more complex system, but this standard multi-player ELO works for our scale.
        const N = participants.length - 1;
        const ratingChange = Math.round(K * (actualScore - expected) / N);
        const newRating = Math.max(0, pA.user.rating + ratingChange);

        updates.push(
          prisma.user.update({
            where: { id: pA.user.id },
            data: { rating: newRating }
          }),
          prisma.ratingHistory.create({
            data: {
              userId: pA.user.id,
              contestId: contest.id,
              ratingChange,
              newRating
            }
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true, updated: participants.length });
  } catch (error) {
    console.error('Error calculating ratings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
