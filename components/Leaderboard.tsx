import React from "react";
export interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
}

interface LeaderboardProps {
  scores: PlayerScore[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="py-2">Rank</th>
            <th className="py-2">Player</th>
            <th className="py-2">Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, idx) => (
            <tr key={score.playerId} className={idx === 0 ? "font-bold text-green-600" : ""}>
              <td className="py-1">{idx + 1}</td>
              <td className="py-1">{score.playerName}</td>
              <td className="py-1">{score.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
