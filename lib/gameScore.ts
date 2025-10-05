
export interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
}

/**
 * Calculates the score (in seconds) for a player based on start and submit timestamps.
 * @param startTime - The timestamp (ms) when the round started
 * @param submitTime - The timestamp (ms) when the player submitted
 * @returns The score in seconds (rounded to 2 decimals)
 */
export function calculatePlayerScore(startTime: number, submitTime: number): number {
  return Math.round(((submitTime - startTime) / 1000) * 100) / 100;
}

/**
 * Returns a sorted leaderboard (fastest first)
 */
export function getLeaderboard(scores: PlayerScore[]): PlayerScore[] {
  return [...scores].sort((a, b) => a.score - b.score);
}
