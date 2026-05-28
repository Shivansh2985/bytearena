-- DropIndex
DROP INDEX "User_rating_name_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "Contest_startTime_idx";

-- DropIndex
DROP INDEX "Contest_status_idx";

-- DropIndex
DROP INDEX "Contest_difficulty_idx";

-- DropIndex
DROP INDEX "ContestParticipant_userId_idx";

-- DropIndex
DROP INDEX "ContestParticipant_score_idx";

-- DropIndex
DROP INDEX "Submission_userId_idx";

-- DropIndex
DROP INDEX "Submission_questionId_idx";

-- DropIndex
DROP INDEX "Submission_createdAt_idx";

-- DropIndex
DROP INDEX "ProctoringLog_userId_contestId_idx";

-- DropIndex
DROP INDEX "ProctoringLog_createdAt_idx";

-- DropIndex
DROP INDEX "Snapshot_userId_contestId_idx";

-- DropIndex
DROP INDEX "Snapshot_createdAt_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isSystemAdmin",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "UserStatus";

