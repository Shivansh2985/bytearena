export interface ContestPerformance {
  userId: string;
  initialRating: number;
  score: number;
  expectedScore: number;
  penalties: number; // number of incorrect submissions
  timeToCompleteMinutes: number; // how quickly they finished
  contestDurationMinutes: number;
}

export function calculateNewRating(performance: ContestPerformance): number {
  const {
    initialRating,
    score,
    expectedScore,
    penalties,
    timeToCompleteMinutes,
    contestDurationMinutes
  } = performance;

  // 1. Calculate K Factor
  const kFactor = initialRating < 1500 ? 32 : 16;

  // 2. Base Delta
  let delta = (score - expectedScore) * kFactor;

  // 3. Accuracy and Penalty Modifier
  if (penalties === 0 && delta > 0) {
    delta *= 1.1; // 10% boost for flawless
  } else {
    // Penalty subtraction
    const penaltyReduction = Math.min(penalties * 5, 50); // max 50 points penalty
    delta -= penaltyReduction;
  }

  // 4. Time Bonus
  if (timeToCompleteMinutes <= contestDurationMinutes * 0.25) {
    delta += 10; // Fast solver bonus
  }

  // 5. Final Rating
  const finalRating = Math.max(0, initialRating + Math.round(delta));
  
  return finalRating;
}

export function evaluateBadges(
  userId: string,
  currentStreak: number,
  topicMap: Record<string, { solved: number; accuracy: number }>,
  rating: number,
  top10Finishes: number
): string[] {
  const newBadges: string[] = [];

  // Streak Badges
  if (currentStreak >= 30) newBadges.push("ByteArena Legend");
  else if (currentStreak >= 7) newBadges.push("Unstoppable");
  else if (currentStreak >= 3) newBadges.push("Rising Star");

  // Topic Mastery
  Object.entries(topicMap).forEach(([topic, stats]) => {
    if (stats.solved >= 10 && stats.accuracy >= 70) {
      newBadges.push(`${topic} Guru`);
    }
  });

  // Rating Tiers
  if (rating >= 2100) newBadges.push("Grandmaster");
  else if (rating >= 1801) newBadges.push("Master");
  else if (rating >= 1501) newBadges.push("Expert");
  else if (rating >= 1200) newBadges.push("Specialist");
  else newBadges.push("Novice");

  // Contest Badges
  if (top10Finishes > 0) newBadges.push("Top 10 Finisher");

  return newBadges;
}
