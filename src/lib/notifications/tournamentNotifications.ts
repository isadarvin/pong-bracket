import { prisma } from "../prisma";
import { sendSMS } from "../sms/twilioClient";

/**
 * Notify all players when a tournament starts with their first match assignment
 */
export async function notifyTournamentStart(tournamentId: number): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: {
        where: { round: 1, bracket: "winners" },
        include: {
          player1: { include: { globalPlayer: true } },
          player2: { include: { globalPlayer: true } },
        },
      },
    },
  });

  if (!tournament) return;

  // Send SMS to each player about their first match
  const notifications: Promise<void>[] = [];

  for (const match of tournament.matches) {
    if (match.player1?.globalPlayer && match.player2?.globalPlayer) {
      const player1 = match.player1.globalPlayer;
      const player2 = match.player2.globalPlayer;

      // Notify player 1 (only if they have a phone number)
      if (player1.phoneNumber) {
        notifications.push(
          sendSMS(
            player1.phoneNumber,
            `${tournament.name} is starting! Your first match: You vs ${player2.name}`
          ).then(() => {})
        );
      }

      // Notify player 2 (only if they have a phone number)
      if (player2.phoneNumber) {
        notifications.push(
          sendSMS(
            player2.phoneNumber,
            `${tournament.name} is starting! Your first match: You vs ${player1.name}`
          ).then(() => {})
        );
      }
    } else if (match.player1?.globalPlayer && !match.player2) {
      // Player 1 has a bye
      if (match.player1.globalPlayer.phoneNumber) {
        notifications.push(
          sendSMS(
            match.player1.globalPlayer.phoneNumber,
            `${tournament.name} is starting! You have a bye in round 1.`
          ).then(() => {})
        );
      }
    } else if (match.player2?.globalPlayer && !match.player1) {
      // Player 2 has a bye
      if (match.player2.globalPlayer.phoneNumber) {
        notifications.push(
          sendSMS(
            match.player2.globalPlayer.phoneNumber,
            `${tournament.name} is starting! You have a bye in round 1.`
          ).then(() => {})
        );
      }
    }
  }

  // Fire and forget - don't block on SMS delivery
  Promise.allSettled(notifications).catch(console.error);
}

/**
 * Notify both players when a new match is ready (both players assigned)
 */
export async function notifyNewMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      player1: { include: { globalPlayer: true } },
      player2: { include: { globalPlayer: true } },
    },
  });

  if (!match || !match.player1 || !match.player2) return;

  const player1 = match.player1.globalPlayer;
  const player2 = match.player2.globalPlayer;
  const bracketName = match.bracket === "winners" ? "Winners" : match.bracket === "losers" ? "Losers" : "Final";

  const notifications: Promise<unknown>[] = [];

  if (player1.phoneNumber) {
    notifications.push(
      sendSMS(
        player1.phoneNumber,
        `${match.tournament.name}: Your next match is ready! You vs ${player2.name} (${bracketName} Bracket, Round ${match.round})`
      )
    );
  }

  if (player2.phoneNumber) {
    notifications.push(
      sendSMS(
        player2.phoneNumber,
        `${match.tournament.name}: Your next match is ready! You vs ${player1.name} (${bracketName} Bracket, Round ${match.round})`
      )
    );
  }

  // Fire and forget
  Promise.allSettled(notifications).catch(console.error);
}

/**
 * Notify all players when the tournament completes with final standings
 */
export async function notifyTournamentComplete(tournamentId: number): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      winner: true,
      players: {
        include: { globalPlayer: true },
        orderBy: { finalRank: "asc" },
      },
    },
  });

  if (!tournament || !tournament.winner) return;

  const notifications: Promise<void>[] = [];

  for (const player of tournament.players) {
    // Skip players without phone numbers
    if (!player.globalPlayer.phoneNumber) continue;

    const rank = player.finalRank || "N/A";
    const message =
      player.playerId === tournament.winnerPlayerId
        ? `${tournament.name} complete! Congratulations - you won!`
        : `${tournament.name} complete! Winner: ${tournament.winner.name}. You placed #${rank}.`;

    notifications.push(
      sendSMS(player.globalPlayer.phoneNumber, message).then(() => {})
    );
  }

  // Fire and forget
  Promise.allSettled(notifications).catch(console.error);
}
