"use client";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Leaderboard } from "@/components/Leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GameEndingClient({ slug }: { slug: string }) {
  const router = useRouter();
  const scores = useQuery(api.games.getScoresForGame, { slug }) ?? [];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Game Over</CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard scores={scores.map((s: any, i: number) => ({
            playerId: s.clientId || s.userId || `player-${i}`,
            playerName: s.playerName,
            score: s.score,
          }))} />
        </CardContent>
      </Card>
    </main>
  );
}
