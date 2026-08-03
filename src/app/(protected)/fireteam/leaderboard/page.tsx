import Image from "next/image";
import NavBar from "../../../components/NavBar";
import PageHeader from "../../../components/PageHeader";
import { getFireteamStandingsStatus } from "@/lib/notion";
import type {
  FireteamStandingId,
  FireteamEventScore,
} from "@/lib/fireteam-standings";
import { FIRETEAM_PATCHES } from "@/lib/personnel-insignia";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FIRETEAM_PRESENTATION: Record<
  FireteamStandingId,
  {
    name: string;
    patchPath: string;
    accent: string;
    accentMuted: string;
    specialty: string;
  }
> = {
  alpha: {
    name: "Fireteam Alpha",
    patchPath: FIRETEAM_PATCHES.alpha.path,
    accent: "#a5b56a",
    accentMuted: "rgba(165, 181, 106, 0.14)",
    specialty: "Formation · Professional",
  },
  delta: {
    name: "Fireteam Delta",
    patchPath: FIRETEAM_PATCHES.delta.path,
    accent: "#d59a3a",
    accentMuted: "rgba(213, 154, 58, 0.13)",
    specialty: "Sustainment · Recovery",
  },
  epsilon: {
    name: "Fireteam Epsilon",
    patchPath: FIRETEAM_PATCHES.epsilon.path,
    accent: "#38bdf8",
    accentMuted: "rgba(56, 189, 248, 0.15)",
    specialty: "Adaptive · Balanced",
  },
  sigma: {
    name: "Fireteam Sigma",
    patchPath: FIRETEAM_PATCHES.sigma.path,
    accent: "#a94b52",
    accentMuted: "rgba(169, 75, 82, 0.15)",
    specialty: "Aggression · Physical",
  },
  theta: {
    name: "Fireteam Theta",
    patchPath: FIRETEAM_PATCHES.theta.path,
    accent: "#28b8bd",
    accentMuted: "rgba(40, 184, 189, 0.13)",
    specialty: "Analysis · Intelligence",
  },
};

const EVENT_PRESENTATION: Record<string, string> = {
  "fireteam-coordination-drill": "Fireteam Coordination Drill",
  "casualty-evacuation-simulation": "Casualty Evacuation Simulation",
  "tactical-obstacle-course-trial": "Tactical Obstacle Course Trial",
  "squad-navigation-challenge": "Squad Navigation Challenge",
  "fireteam-battle-assessment": "Fireteam Battle Assessment",
};

function placementLabel(placement: number) {
  if (placement === 1) return "1st";
  if (placement === 2) return "2nd";
  if (placement === 3) return "3rd";
  return `${placement}th`;
}

function MovementIndicator({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="text-emerald-400" aria-label={`Up ${movement}`}>
        ▲ {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="text-rose-400" aria-label={`Down ${Math.abs(movement)}`}>
        ▼ {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="text-slate-600" aria-label="No change">
      —
    </span>
  );
}

function EventResult({
  eventId,
  eventDay,
  eventType,
  scores,
}: {
  eventId: string;
  eventDay: number;
  eventType: "Minor Event" | "Major Event";
  scores: FireteamEventScore[];
}) {
  const orderedScores = [...scores].sort(
    (a, b) => a.placement - b.placement
  );
  const winner = FIRETEAM_PRESENTATION[orderedScores[0].fireteamId];

  return (
    <article className="border border-slate-800 bg-black/55 p-4">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-500">
            Day {eventDay} · {eventType}
          </p>
          <h3 className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
            {EVENT_PRESENTATION[eventId] ?? eventId}
          </h3>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Event Winner{" "}
          <span style={{ color: winner.accent }}>{winner.name}</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1">
        {orderedScores.map((score) => {
          const team = FIRETEAM_PRESENTATION[score.fireteamId];

          return (
            <div
              key={score.fireteamId}
              className="min-w-0 border border-slate-900 px-1.5 py-2 text-center"
              style={{
                backgroundColor:
                  score.fireteamId === "epsilon"
                    ? team.accentMuted
                    : "rgba(2, 6, 23, 0.65)",
              }}
            >
              <p
                className="truncate text-[8px] font-black uppercase tracking-[0.1em]"
                style={{ color: team.accent }}
              >
                {team.name.replace("Fireteam ", "")}
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {score.points}
              </p>
              <p className="text-[7px] uppercase tracking-[0.12em] text-slate-600">
                {placementLabel(score.placement)}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default async function FireteamLeaderboardPage() {
  const status = await getFireteamStandingsStatus();
  const resolvedEventCount = status.resolvedEventCount;
  const latestResult =
    status.eventResults[status.eventResults.length - 1] ?? null;
  const finalResult =
    resolvedEventCount >= 5 &&
    latestResult?.eventType === "Major Event";
  const epsilonStanding = status.standings.find(
    (standing) => standing.fireteamId === "epsilon"
  );
  const epsilonWon = finalResult && epsilonStanding?.rank === 1;

  return (
    <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
          <PageHeader
            eyebrow="SCP Personnel Command · Competitive Operations"
            title="Fireteam Standings"
          />

          <div className="mt-6 grid gap-4 border border-cyan-900/60 bg-black/55 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">
                {status.campaignName} · {status.phaseName}
              </p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-white sm:text-2xl">
                Fireteam Performance Board
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">
                Personnel Command ranks each Fireteam by verified competitive
                Event performance. Consistent Event victories determine final
                precedence when cumulative scores are tied.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800 text-center">
              <div className="bg-slate-950 px-5 py-3">
                <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">
                  Events Complete
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {resolvedEventCount} / 5
                </p>
              </div>
              <div className="bg-slate-950 px-5 py-3">
                <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">
                  Board Status
                </p>
                <p
                  className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    finalResult ? "text-amber-300" : "text-cyan-300"
                  }`}
                >
                  {finalResult
                    ? "Final"
                    : resolvedEventCount > 0
                      ? "Active"
                      : "Awaiting Event 01"}
                </p>
              </div>
            </div>
          </div>

          {epsilonWon ? (
            <div className="mt-4 border border-cyan-400/70 bg-cyan-950/35 px-5 py-4 shadow-[inset_0_0_24px_rgba(34,211,238,0.1)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-400">
                Phase II Competitive Citation
              </p>
              <p className="mt-2 text-lg font-black uppercase tracking-[0.1em] text-white">
                Fireteam Epsilon · First Overall
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-200">
                FIVE, FORWARD. Consistent readiness secured the phase victory.
              </p>
            </div>
          ) : null}

          {status.duplicateEventPageIds.length > 0 ? (
            <div className="mt-4 border border-amber-600/60 bg-amber-950/30 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200">
              Standings verification hold · Personnel Command must reconcile a
              duplicate Event resolution before this board is considered final.
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden border border-slate-800">
            <div className="hidden grid-cols-[72px_92px_1fr_110px_100px_100px] items-center border-b border-slate-800 bg-slate-950 px-4 py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600 lg:grid">
              <span>Rank</span>
              <span>Patch</span>
              <span>Fireteam</span>
              <span className="text-center">Movement</span>
              <span className="text-center">Wins</span>
              <span className="text-right">Points</span>
            </div>

            {status.standings.map((standing) => {
              const team = FIRETEAM_PRESENTATION[standing.fireteamId];
              const isEpsilon = standing.fireteamId === "epsilon";

              return (
                <article
                  key={standing.fireteamId}
                  className="relative grid gap-3 border-b border-slate-800 px-4 py-4 last:border-b-0 lg:grid-cols-[72px_92px_1fr_110px_100px_100px] lg:items-center"
                  style={{
                    background: isEpsilon
                      ? `linear-gradient(90deg, ${team.accentMuted}, rgba(2, 6, 23, 0.72) 58%)`
                      : "rgba(2, 6, 23, 0.72)",
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: team.accent }}
                  />

                  <div className="flex items-baseline gap-2 lg:block">
                    <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600 lg:hidden">
                      Rank
                    </span>
                    <span
                      className="text-3xl font-black"
                      style={{ color: team.accent }}
                    >
                      {String(standing.rank).padStart(2, "0")}
                    </span>
                  </div>

                  <Image
                    src={team.patchPath}
                    alt={`${team.name} patch`}
                    width={76}
                    height={76}
                    className="h-[76px] w-[76px] object-contain shadow-[0_0_20px_rgba(0,0,0,0.55)]"
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black uppercase tracking-[0.1em] text-white">
                        {team.name}
                      </h3>
                      {isEpsilon ? (
                        <span className="border border-cyan-600/60 bg-cyan-950/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-cyan-300">
                          Your Fireteam
                        </span>
                      ) : null}
                    </div>
                    <p
                      className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: team.accent }}
                    >
                      {team.specialty}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-2 lg:block lg:border-0 lg:pt-0 lg:text-center">
                    <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600 lg:hidden">
                      Movement
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                      <MovementIndicator movement={standing.movement} />
                    </p>
                  </div>

                  <div className="flex items-center justify-between lg:block lg:text-center">
                    <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600 lg:hidden">
                      Event Wins
                    </span>
                    <p className="text-lg font-black text-slate-200">
                      {standing.eventWins}
                    </p>
                  </div>

                  <div className="flex items-end justify-between lg:block lg:text-right">
                    <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600 lg:hidden">
                      Points
                    </span>
                    <p
                      className="text-3xl font-black"
                      style={{ color: team.accent }}
                    >
                      {standing.points}
                    </p>
                    <p className="text-[7px] uppercase tracking-[0.14em] text-slate-600">
                      Competitive
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">
                    After Action Record
                  </p>
                  <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-white">
                    Competitive Event Results
                  </h2>
                </div>
                <p className="text-[8px] uppercase tracking-[0.16em] text-slate-600">
                  Newest First
                </p>
              </div>

              {status.eventResults.length === 0 ? (
                <div className="mt-3 grid min-h-48 place-items-center border border-dashed border-slate-800 bg-black/40 p-6 text-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      No Competitive Results
                    </p>
                    <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">
                      The standings board will update after Personnel Command
                      verifies the first Phase II Campaign Event result.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {[...status.eventResults].reverse().map((result) => (
                    <EventResult key={result.eventId} {...result} />
                  ))}
                </div>
              )}
            </section>

            <aside className="border border-slate-800 bg-black/45 p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">
                Personnel Command Brief
              </p>
              <h2 className="mt-2 text-base font-black uppercase tracking-[0.08em] text-white">
                Competitive Order
              </h2>
              <div className="mt-4 space-y-4 text-xs leading-5 text-slate-400">
                <p>
                  Every Phase II Campaign Event is a scored Fireteam operation.
                  Verified results are added to this board after the Event
                  record is finalized.
                </p>
                <p>
                  Cumulative points establish the initial order. Event victories
                  resolve tied totals, rewarding consistent performance across
                  the phase.
                </p>
                <p>
                  If both totals remain equal, the Fireteam Battle Assessment
                  determines final precedence.
                </p>
              </div>
              <div className="mt-5 border-l-2 border-cyan-700 bg-cyan-950/15 px-4 py-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-500">
                  Scoring Notice
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Internal readiness evaluation and opposing Fireteam planning
                  models are classified. This board displays only verified
                  operational outcomes.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
