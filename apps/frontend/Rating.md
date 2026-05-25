# ByteArena Rating & Badge Algorithms

## 1. Rating Calculation Algorithm

The rating system uses a modified Elo-based system specifically designed for coding contests where time, difficulty, correctness, and penalties are factored in.

### Core Philosophy
- Base rating is updated after each contest based on the user's final score relative to expected performance.
- Accuracy (minimizing incorrect submissions) gives a slight boost.
- Fast solving times on harder problems yield higher rating multipliers.

### Mathematical Model

**Variables:**
- `R_initial`: The user's rating before the contest.
- `Score`: The total score achieved in the contest.
- `ExpectedScore`: Derived from the user's current rating and average problem difficulty in the contest.
- `Penalties`: Number of incorrect submissions.
- `TimeBonus`: Bonus multiplier based on completion speed.

**Algorithm:**
1. **Expected Score Calculation:**
   `ExpectedScore = BaseScore * (1 / (1 + 10^((AverageContestRating - R_initial) / 400)))`

2. **Performance Delta:**
   `Delta = (Score - ExpectedScore) * K_Factor`
   (Where `K_Factor` is 32 for new users, and 16 for established users > 1500 rating)

3. **Accuracy & Penalty Modifier:**
   If the user has zero penalties, multiply positive `Delta` by `1.1` (10% boost).
   For every incorrect submission, subtract a flat `5` rating points from the `Delta` (max penalty of -50 points).

4. **Time Modifier:**
   If solved within the first 25% of the contest time, add a `+10` bonus to `Delta`.
   
5. **Final Rating Update:**
   `R_new = R_initial + Delta + PenaltyModifier + TimeModifier`
   *(Rating cannot drop below a minimum threshold, e.g., 0)*

---

## 2. Badge Progression Algorithm

Badges are awarded based on reaching predefined thresholds in the database for streaks, specific problem types, or rating tiers.

### Rules Engine

1. **Streak Badges:**
   - Evaluates consecutive days of activity (from `heatmapData` logic).
   - *3-Day Streak*: "Rising Star"
   - *7-Day Streak*: "Unstoppable"
   - *30-Day Streak*: "ByteArena Legend"

2. **Topic Mastery Badges:**
   - Requires a minimum of 10 solved problems in a specific tag (e.g., "Graphs") with an accuracy > 70%.
   - *Examples*: "Graph Guru", "Dynamic Programming Master"

3. **Rating Tier Badges:**
   - Evaluated after every rating change.
   - `< 1200`: Novice
   - `1200 - 1500`: Specialist
   - `1501 - 1800`: Expert
   - `1801 - 2100`: Master
   - `2100+`: Grandmaster

4. **Contest Specific:**
   - "Top 10 Finish": Awarded to users finishing in the top 10 of any contest with > 50 participants.
   - "Flawless Victory": Completed a contest with 100% accuracy and 0 penalties.
