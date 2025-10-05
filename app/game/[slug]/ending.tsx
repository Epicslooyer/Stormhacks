import { Leaderboard } from "@/components/Leaderboard";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatScore } from "@/lib/scoring";

type GameScore = {
  playerName: string;
  clientId: string;
  userId?: string | null;
  calculatedScore: number;
};

export default function GameEndingPage({ params }: { params: { slug: string } }) {
  // Use client-side query for real-time updates
  const scores = useQuery(api.games.getScoresForGame, { slug: params.slug }) as GameScore[] ?? [];
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="mb-6 text-2xl font-bold">🏆 Game Over!</h1>
      <Leaderboard scores={scores.map((s: any, i: number) => ({
        playerId: s.clientId || s.userId || `player-${i}`,
        playerName: s.playerName,
        score: s.calculatedScore,
      }))} />
    </main>
  );
}
