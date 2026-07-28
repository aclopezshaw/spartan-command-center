import Image from "next/image";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import FireteamAssignmentCeremony from "../../components/FireteamAssignmentCeremony";
import CampaignRolloverControl from "../../components/CampaignRolloverControl";
import { getAssemblyHallPresentation } from "@/lib/ceremonial-events";
import {
  getAlexServiceRecord,
  getActiveCampaignEventState,
  getCampaignPhaseXpSummary,
  getCampaignRolloverStatus,
  getFireteamAssignmentStatus,
} from "@/lib/notion";
import { buildRankProgression } from "@/lib/rank-progression";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function EvidenceItem({
  label,
  value,
  complete,
}: {
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div className="border-l border-cyan-700/50 pl-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xs font-bold uppercase ${
          complete ? "text-cyan-200" : "text-slate-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formulaNumber(
  properties: Record<
    string,
    { formula?: { number?: number | null; string?: string | null } }
  >,
  propertyName: string
) {
  return properties[propertyName]?.formula?.number ?? 0;
}

export default async function AssemblyHallPage() {
  const [assignment, rollover, serviceRecord, phaseXpSummary] =
    await Promise.all([
      getFireteamAssignmentStatus(),
      getCampaignRolloverStatus(),
      getAlexServiceRecord(),
      getActiveCampaignEventState().then((eventState) =>
        getCampaignPhaseXpSummary(eventState)
      ),
    ]);
  const eligibility = assignment.eligibility;
  const averageDailyHabitXp =
    phaseXpSummary && phaseXpSummary.elapsedDays > 0
      ? phaseXpSummary.dailyXp / phaseXpSummary.elapsedDays
      : null;
  const serviceProperties =
    serviceRecord && "properties" in serviceRecord
      ? (serviceRecord.properties as Record<
          string,
          {
            formula?: {
              number?: number | null;
              string?: string | null;
            };
          }
        >)
      : null;
  const rankProgression = serviceProperties
    ? buildRankProgression({
        currentRank:
          serviceProperties["Calculated Rank"]?.formula?.string ?? "Recruit",
        currentXp: formulaNumber(serviceProperties, "Service Score"),
        nextRankXp: formulaNumber(serviceProperties, "Next Rank XP"),
        xpToNextRank: formulaNumber(serviceProperties, "XP To Next Rank"),
        rankProgress:
          serviceProperties["Rank Progress %"]?.formula?.number ?? null,
        averageDailyHabitXp,
      })
    : null;
  const presentation = getAssemblyHallPresentation(
    eligibility.state,
    assignment.state
  );
  const isOrderActive = [
    "available",
    "in_progress",
    "finalizing",
    "conflict",
  ].includes(assignment.state);

  return (
    <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.25)] sm:p-6">
          <PageHeader
            eyebrow="UNSC Personnel Command · Ceremonial District"
            title="Command Assembly Hall"
          />

          <div className="mt-6 overflow-hidden border border-cyan-700/50 bg-black shadow-[0_0_45px_rgba(8,145,178,0.2)]">
            <div className="relative min-h-[620px] overflow-hidden lg:min-h-[720px]">
              <Image
                src={
                  isOrderActive
                    ? "/images/command-assembly-hall-active.png"
                    : "/images/command-assembly-hall.png"
                }
                alt={
                  isOrderActive
                    ? "SCP candidates seated for an active ceremony in the Command Assembly Hall"
                    : "Inactive interior of the SCP Command Assembly Hall"
                }
                fill
                priority
                className="object-cover object-center"
              />

              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_20%,rgba(0,0,0,0.76)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.62)_100%)]" />

              <div className="absolute left-4 top-4 z-10 border-l-2 border-cyan-400/70 bg-black/55 px-4 py-3 backdrop-blur-sm sm:left-7 sm:top-7">
                <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-400">
                  Hall Status
                </p>
                <p
                  className={`mt-1 text-sm font-bold uppercase tracking-[0.18em] ${
                    isOrderActive ? "text-amber-200" : "text-slate-200"
                  }`}
                >
                  {presentation.statusLabel}
                </p>
              </div>

              <div className="absolute right-4 top-4 z-10 hidden text-right sm:right-7 sm:top-7 sm:block">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                  Location
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  SCP Command Complex
                </p>
              </div>

              <div className="relative z-10 flex min-h-[620px] items-end justify-center px-4 pb-6 pt-28 lg:min-h-[720px] lg:px-8 lg:pb-8">
                <div className="w-full max-w-5xl border border-cyan-700/50 bg-black/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-7">
                  <div className="grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.36em] ${
                          isOrderActive ? "text-amber-300" : "text-cyan-400"
                        }`}
                      >
                        {presentation.eyebrow}
                      </p>
                      <h2 className="mt-3 max-w-3xl text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        {presentation.title}
                      </h2>
                      <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-300 sm:text-sm">
                        {presentation.summary}
                      </p>

                      <FireteamAssignmentCeremony
                        initialStatus={assignment}
                      />

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <EvidenceItem
                          label="Phase Boundary"
                          value={
                            eligibility.evidence.boundaryReached
                              ? "Verified"
                              : eligibility.evidence.boundaryDate ?? "Unscheduled"
                          }
                          complete={eligibility.evidence.boundaryReached}
                        />
                        <EvidenceItem
                          label="Required Events"
                          value={`${eligibility.evidence.eventCount - eligibility.evidence.incompleteEventTitles.length} / ${eligibility.evidence.eventCount} Complete`}
                          complete={
                            eligibility.evidence.eventCount > 0 &&
                            eligibility.evidence.incompleteEventTitles.length ===
                              0
                          }
                        />
                        <EvidenceItem
                          label="Service History"
                          value={
                            eligibility.evidence.eventHistoriesComplete
                              ? "Verified"
                              : "Review Required"
                          }
                          complete={
                            eligibility.evidence.eventHistoriesComplete
                          }
                        />
                        <EvidenceItem
                          label="Final Campaign Record"
                          value={
                            eligibility.evidence.snapshotFinalized
                              ? "Frozen"
                              : "Pending"
                          }
                          complete={eligibility.evidence.snapshotFinalized}
                        />
                      </div>
                    </div>

                    <aside className="border border-cyan-900/70 bg-slate-950/75 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-400">
                            Current Order
                          </p>
                          <p className="mt-2 text-sm font-bold uppercase text-white">
                            {isOrderActive
                              ? "Fireteam Assignment"
                              : "No order issued"}
                          </p>
                        </div>
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            isOrderActive
                              ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]"
                              : "bg-slate-700"
                          }`}
                        />
                      </div>

                      <div className="mt-4 space-y-2 border-t border-cyan-900/60 pt-4 text-[11px] uppercase tracking-[0.14em]">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Order Type</span>
                          <span className="text-slate-300">Ceremonial Event</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">XP Award</span>
                          <span className="text-slate-300">None</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Readiness</span>
                          <span className="text-slate-300">No Change</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Record</span>
                          <span className="text-slate-300">Service History</span>
                        </div>
                      </div>

                      <Link
                        href="/command-hud"
                        className="mt-5 block border border-cyan-500/70 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        Return to Command HUD
                      </Link>
                    </aside>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-4 border border-cyan-400/15" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(8,145,178,0.22)]" />
            </div>
          </div>

          <div className="mt-5 border border-cyan-800/70 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(0,0,0,0.92))] p-5 shadow-[0_0_24px_rgba(8,145,178,0.12)] sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-cyan-900/70 pb-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-400">
                  Personnel Advancement
                </p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                  Promotion Readiness
                </h2>
              </div>

              <div className="border-l-2 border-amber-400/70 pl-4 sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  Board Recommendation
                </p>
                <p
                  className={`mt-1 text-sm font-black uppercase tracking-[0.15em] ${
                    rankProgression?.thresholdMet
                      ? "text-emerald-300"
                      : "text-amber-200"
                  }`}
                >
                  {rankProgression?.terminalRank
                    ? "Service Apex Reached"
                    : rankProgression?.thresholdMet
                      ? "Threshold Met · Review Pending"
                      : "Hold · Criteria Not Met"}
                </p>
              </div>
            </div>

            {rankProgression ? (
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.55fr_0.8fr]">
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Current Rank
                      </p>
                      <p className="mt-1 text-xl font-black uppercase text-white">
                        {rankProgression.currentRank}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Promotion Target
                      </p>
                      <p className="mt-1 text-xl font-black uppercase text-amber-500">
                        {rankProgression.nextRank ?? "None"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between gap-4 text-[10px] uppercase tracking-[0.16em]">
                      <span className="text-slate-500">Rank Progress</span>
                      <span className="font-bold text-cyan-200">
                        {rankProgression.progressPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden border border-cyan-900/80 bg-black">
                      <div
                        className="h-full bg-[linear-gradient(90deg,#0e7490,#67e8f9)] shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                        style={{
                          width: `${rankProgression.progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Current XP", rankProgression.currentXp],
                      ["Required XP", rankProgression.nextRankXp],
                      ["XP Remaining", rankProgression.xpToNextRank],
                      ["Est. Days", rankProgression.estimatedDays],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="border border-cyan-900/60 bg-black/45 px-3 py-3"
                      >
                        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                          {label}
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-100">
                          {value === null
                            ? "—"
                            : Number(value).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!rankProgression.terminalRank && (
                    <p className="mt-3 text-[10px] leading-5 text-slate-500">
                      {rankProgression.averageDailyHabitXp === null
                        ? "A days-to-threshold forecast will appear after the current phase records Daily SITREP habit XP."
                        : `Estimated from the current phase average of ${rankProgression.averageDailyHabitXp.toFixed(1)} Daily SITREP habit XP per operational day.`}{" "}
                      This is a forecast, not a guaranteed ceremony date.
                    </p>
                  )}
                </div>

                <aside className="border border-cyan-900/60 bg-black/45 p-4">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400">
                    Rank-Up Criteria
                  </p>
                  <div className="mt-4 space-y-3 text-[11px] uppercase tracking-[0.12em]">
                    <div className="flex items-center justify-between gap-4 border-b border-cyan-950 pb-3">
                      <span className="text-slate-400">XP Threshold</span>
                      <span
                        className={
                          rankProgression.thresholdMet
                            ? "text-emerald-300"
                            : "text-amber-200"
                        }
                      >
                        {rankProgression.thresholdMet ? "Met" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-cyan-950 pb-3">
                      <span className="text-slate-400">Promotion Review</span>
                      <span className="text-slate-500">Not Issued</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Ceremonial Order</span>
                      <span className="text-slate-500">Awaiting Eligibility</span>
                    </div>
                  </div>
                  <p className="mt-5 text-[10px] leading-5 text-slate-500">
                    The Assembly Hall will issue the formal promotion order only
                    after the authoritative promotion review is connected.
                  </p>
                </aside>
              </div>
            ) : (
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">
                Service Record unavailable. Promotion readiness cannot be
                calculated.
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_2fr]">
            <div className="border border-cyan-900/60 bg-black/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
                Ceremony Archive
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                {assignment.state === "completed"
                  ? "1 recorded ceremony"
                  : "None at this time."}
              </p>
            </div>

            <div className="border border-cyan-900/60 bg-black/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
                Hall Protocol
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                The Assembly Hall records permanent progression transitions.
                Presentation may be revisited, but assignments, awards, history,
                and unlocks are issued only once by their authoritative
                operation. Personnel Command uses the same ceremonial-order
                channel for Fireteam assignments, promotions, campaign medals,
                command assignments, and graduation.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <CampaignRolloverControl initialStatus={rollover} />
          </div>
        </section>
      </div>
    </main>
  );
}
