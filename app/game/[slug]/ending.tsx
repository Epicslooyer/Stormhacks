import { Leaderboard } from "@/components/Leaderboard";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function GameEndingPage({ params }: { params: { slug: string } }) {
  // Use client-side query for real-time updates
  const scores = useQuery(api.games.getScoresForGame, { slug: params.slug }) ?? [];
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <Leaderboard scores={scores.map((s: any, i: number) => ({
        playerId: s.clientId || s.userId || `player-${i}`,
        playerName: s.playerName,
        score: s.score,
      }))} />
    </main>
  );
}
