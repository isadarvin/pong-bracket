-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinDeadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "tournamentPasswordHash" TEXT NOT NULL,
    "winnerPlayerId" TEXT,
    CONSTRAINT "Tournament_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "GlobalPlayer" ("playerId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalPlayer" (
    "playerId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "skillRating" INTEGER NOT NULL,
    "seed" INTEGER,
    "finalRank" INTEGER,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "eliminationOrder" INTEGER,
    "winsCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "GlobalPlayer" ("playerId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" INTEGER NOT NULL,
    "bracket" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "player1Id" INTEGER,
    "player2Id" INTEGER,
    "winnerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "nextWinnerMatchId" TEXT,
    "nextLoserMatchId" TEXT,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_nextWinnerMatchId_fkey" FOREIGN KEY ("nextWinnerMatchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_nextLoserMatchId_fkey" FOREIGN KEY ("nextLoserMatchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
