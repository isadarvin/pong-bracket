-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('joining', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'completed');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('winners', 'losers', 'final');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinDeadline" TIMESTAMP(3) NOT NULL,
    "status" "TournamentStatus" NOT NULL,
    "tournamentPasswordHash" TEXT NOT NULL,
    "winnerPlayerId" TEXT,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalPlayer" (
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "GlobalPlayer_pkey" PRIMARY KEY ("playerId")
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "skillRating" INTEGER NOT NULL,
    "seed" INTEGER,
    "finalRank" INTEGER,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "eliminationOrder" INTEGER,
    "winsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TournamentPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "bracket" "BracketType" NOT NULL,
    "round" INTEGER NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "player1Id" INTEGER,
    "player2Id" INTEGER,
    "winnerId" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'pending',
    "nextWinnerMatchId" TEXT,
    "nextLoserMatchId" TEXT,
    "player1Score" INTEGER,
    "player2Score" INTEGER,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "GlobalPlayer"("playerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "GlobalPlayer"("playerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextWinnerMatchId_fkey" FOREIGN KEY ("nextWinnerMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextLoserMatchId_fkey" FOREIGN KEY ("nextLoserMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
