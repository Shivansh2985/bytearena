-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED', 'BANNED', 'DELETED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Contest_startTime_idx" ON "Contest"("startTime");

-- CreateIndex
CREATE INDEX "Contest_status_idx" ON "Contest"("status");

-- CreateIndex
CREATE INDEX "Contest_difficulty_idx" ON "Contest"("difficulty");

-- CreateIndex
CREATE INDEX "ContestParticipant_userId_idx" ON "ContestParticipant"("userId");

-- CreateIndex
CREATE INDEX "ContestParticipant_score_idx" ON "ContestParticipant"("score" DESC);

-- CreateIndex
CREATE INDEX "ProctoringLog_userId_contestId_idx" ON "ProctoringLog"("userId", "contestId");

-- CreateIndex
CREATE INDEX "ProctoringLog_createdAt_idx" ON "ProctoringLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Snapshot_userId_contestId_idx" ON "Snapshot"("userId", "contestId");

-- CreateIndex
CREATE INDEX "Snapshot_createdAt_idx" ON "Snapshot"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_questionId_idx" ON "Submission"("questionId");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "User_rating_name_idx" ON "User"("rating" DESC, "name" ASC);

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" DESC);

