import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";

import CreateGameButton from "../game/CreateGameButton";
import { api } from "@/convex/_generated/api";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { Badge } from "@/components/ui/badge";

const LOBBY_STATUSES = ["lobby"] as const;

const steps = [
  {
    title: "Create or Join",
    description: "Spin up a fresh lobby or drop into one with a shared code.",
  },
  {
    title: "Get Ready",
    description:
      "Sync with your teammate, review the challenge, and click Ready Up.",
  },
  {
    title: "Start Coding",
    description:
      "When everyone is locked in, launch the match and battle for the crown.",
  },
];

export default async function LobbyPage() {
  const preloaded = await preloadQuery(api.games.listGamesByStatus, {
    statuses: [...LOBBY_STATUSES],
  });
  const lobbies = preloadedQueryResult(preloaded);
  const lobbyCountLabel = `${lobbies.length} ${
    lobbies.length === 1 ? "open lobby" : "open lobbies"
  }`;

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        backgroundImage: "var(--home-page-background)",
        backgroundColor: "var(--home-page-background-color)",
      }}
    >
      <HomeBackdrop />
      <HomeHeader />
      <main className="flex flex-1 flex-col gap-14 py-10 md:gap-20 md:py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(700px at 10% 20%, rgba(247, 211, 84, 0.4), transparent 62%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(64, 142, 255, 0.22), transparent 72%)",
              }}
            />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4 md:max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
                  Lobby arena
                </span>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
                  Game lobbies
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
                  Summon your squad, storm the royale arena, and flex those
                  interview instincts before the crown is claimed.
                </p>
              </div>
              <ul className="flex flex-col gap-3 text-xs font-semibold tracking-[0.14em] text-slate-400 dark:text-slate-500">
                <li className="flex items-center gap-2 before:text-base before:text-amber-500 before:content-['⚔️']">
                  Draft your champions, lock in a problem, and clash for the
                  golden badge.
                </li>
                <li className="flex items-center gap-2 before:text-base before:text-sky-400 before:content-['🛡️']">
                  Ready checks are our shields—no contender enters the arena
                  unprepared.
                </li>
                <li className="flex items-center gap-2 before:text-base before:text-emerald-400 before:content-['👑']">
                  The crown goes to the squad that ships the cleanest interview
                  strat.
                </li>
              </ul>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_35px_90px_-35px_rgba(10,24,64,0.75)] dark:border-white/10 dark:bg-slate-950/75 dark:hover:shadow-[0_35px_90px_-30px_rgba(24,84,189,0.5)] md:p-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "radial-gradient(480px at 15% 25%, rgba(247, 211, 84, 0.32), transparent 72%)",
                }}
              />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.65)]" />
                  Create new lobby
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Start a fresh session and rally your crew. Everyone will need
                  to ready up before the countdown hits zero.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <CreateGameButton
                    redirectBase="/lobby"
                    label="Create lobby"
                  />
                  <span className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Launch instantly
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/45 bg-white/75 p-6 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:p-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(520px at 85% 65%, rgba(56, 189, 248, 0.24), transparent 70%)",
                }}
              />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
                  Join existing lobby
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Already have a code? Paste it after{" "}
                  <code className="rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[0.7rem] text-slate-100 dark:bg-slate-800/80">
                    /lobby/
                  </code>{" "}
                  in your browser and teleport straight to the arena.
                </p>
                <div className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 font-mono text-sm text-slate-700 shadow-inner shadow-white/30 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-100">
                  /lobby/your-lobby-id
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/lobby/example"
                    className="group inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15 dark:hover:text-white"
                  >
                    Try example lobby
                    <FiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <span className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Share codes via DM
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-6 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_28px_70px_-28px_rgba(24,84,189,0.45)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(500px at 8% 20%, rgba(56, 189, 248, 0.22), transparent 65%)",
              }}
            />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
                  {lobbyCountLabel}
                </Badge>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Tap a lobby card to jump into the arena.
                </p>
              </div>
              {lobbies.length === 0 ? (
                <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-10 text-center shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)]">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(520px at 20% 25%, rgba(247, 211, 84, 0.38), transparent 70%)",
                    }}
                  />
                  <div className="relative mx-auto flex max-w-md flex-col gap-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      No open lobbies yet
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Be the first to create a lobby and invite friends to
                      compete.
                    </p>
                    <div className="flex justify-center">
                      <CreateGameButton
                        redirectBase="/lobby"
                        label="Create the first lobby"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2">
                  {lobbies.map((lobby) => {
                    const problemLabel =
                      lobby.problemTitle ??
                      lobby.problemSlug ??
                      "Problem to be decided";
                    return (
                      <li key={lobby._id}>
                        <Link
                          href={`/lobby/${lobby.slug}`}
                          className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-br from-white/95 via-white/85 to-white/70 p-6 shadow-[0_22px_55px_-28px_rgba(10,26,68,0.55)] backdrop-blur-xl transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_35px_80px_-30px_rgba(10,26,68,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:border-amber-400/25 dark:from-slate-950/75 dark:via-slate-950/65 dark:to-slate-900/55"
                        >
                          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                            <div className="absolute -top-1/2 -right-1/3 h-[130%] w-[65%] rotate-12 bg-gradient-to-br from-amber-200/20 via-transparent to-transparent blur-3xl" />
                            <div className="absolute -bottom-1/2 -left-1/3 h-[120%] w-[55%] -rotate-6 bg-gradient-to-tr from-sky-300/15 via-transparent to-transparent blur-3xl" />
                          </div>
                          <div className="relative flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-white dark:group-hover:text-white">
                                {lobby.name}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                Problem: {problemLabel}
                              </p>
                            </div>
                            <Badge className="rounded-full border border-emerald-300/50 bg-emerald-100/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-400/35 dark:bg-emerald-400/20 dark:text-emerald-100">
                              Lobby
                            </Badge>
                          </div>
                          <dl className="relative grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between">
                              <dt className="font-medium text-slate-700 dark:text-white">
                                Players
                              </dt>
                              <dd>{lobby.presenceCount}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt className="font-medium text-slate-700 dark:text-white">
                                Ready
                              </dt>
                              <dd>{lobby.readyCount}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt className="font-medium text-slate-700 dark:text-white">
                                Created
                              </dt>
                              <dd>
                                {new Date(lobby.createdAt).toLocaleTimeString()}
                              </dd>
                            </div>
                          </dl>
                          <div className="relative flex items-center justify-between">
                            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                              Ready up and enter
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 transition-colors group-hover:text-amber-500 dark:text-amber-200">
                              Enter lobby
                              <FiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-6 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_28px_70px_-28px_rgba(24,84,189,0.45)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(520px at 12% 25%, rgba(56, 189, 248, 0.22), transparent 65%)",
              }}
            />
            <div className="relative grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/50 bg-white/75 p-5 shadow-[0_18px_45px_-25px_rgba(10,24,64,0.5)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_70px_-32px_rgba(10,24,64,0.65)] dark:border-white/10 dark:bg-slate-950/70"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      backgroundImage:
                        "radial-gradient(420px at 85% 25%, rgba(247, 211, 84, 0.24), transparent 75%)",
                    }}
                  />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/60 bg-amber-200/30 text-base font-semibold text-[#0d2f6f] shadow-inner dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
                    {index + 1}
                  </div>
                  <div className="relative space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="self-center text-center text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Claim your crown? Forge the first lobby and let the royale begin.
          </footer>
        </div>
      </main>
    </div>
  );
}
