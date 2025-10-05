"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatScore, formatTime } from "@/lib/scoring";

export default function GameEndingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const leaderboard = useQuery(api.games.getGameLeaderboard, { slug });
  const winnerInfo = useQuery(api.games.getGameWinner, { slug });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10">
      <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Round Complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Results for game <span className="font-mono">{slug}</span>
        </p>

        {winnerInfo?.isGameOver && winnerInfo.winner ? (
          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <h2 className="text-lg font-semibold">Winner</h2>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-medium">{winnerInfo.winner.playerName}</span>
              <span className="text-muted-foreground">
                Score {formatScore(winnerInfo.winner.calculatedScore ?? 0)}
                {typeof winnerInfo.winner.completionTime === "number" && (
                  <>
                    {"  •  "}
                    {formatTime(winnerInfo.winner.completionTime)}
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            Final winner not locked yet. Current leader is shown below.
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Leaderboard
          </h3>
          <div className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {leaderboard?.leaderboard?.length ? (
              leaderboard.leaderboard.slice(0, 20).map((p, i) => (
                <div key={p.clientId} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium">{p.playerName}</span>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>Score {formatScore(p.calculatedScore ?? 0)}</div>
                    <div className="text-xs">
                      {typeof p.completionTime === "number"
                        ? formatTime(p.completionTime)
                        : "In progress"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No leaderboard yet.</div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/game/${slug}`}
            className="inline-flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to Game
          </Link>
          <Link
            href={`/spectate`}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Spectate
          </Link>
        </div>
      </div>
    </div>
  );
}


