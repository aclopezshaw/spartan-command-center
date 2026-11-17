import type { CampaignEvent, ReadinessScores } from "../data/events.ts";
import { PHASE_THREE_EVENT_IDS } from "../data/events.ts";
import { COMMAND_TRUST_COMPANIES, type TrustEntry } from "./command-trust.ts";
import type { buildCommandTrustInsights } from "./command-trust-insights.ts";
import type { replayBattalionCohesion } from "./battalion-cohesion.ts";
import type { BattalionStandingId } from "./battalion-rankings.ts";
import { getEventOutcomeState } from "./event-outcome.ts";
import { getEventReadinessCopy } from "./event-readiness.ts";

export type DashboardTrust = {
  state: string;
  ledger: { phaseId: string; through: string; companies: { id: string; trust: number }[]; entries: TrustEntry[] } | null;
  insights: ReturnType<typeof buildCommandTrustInsights> | null;
};
export type DashboardCohesion = { state: string; ledger: ReturnType<typeof replayBattalionCohesion> | null };
export type DashboardRankings = {
  state: string; resolvedEventCount: number | null; finalized: boolean; finalizable: boolean;
  standings: { battalionId: BattalionStandingId; rank: number; points: number; eventWins: number; movement: number }[];
};
export type DashboardPhase = { phaseId: string | null; phaseName: string | null; phaseStartDate: string | null; campaignDay: number | null; events: CampaignEvent[] };
export type DashboardInput = {
  assignmentState: string | null; targetPhaseId: string | null; today: string;
  launchHeld?: boolean;
  readiness: ReadinessScores | null; phase: DashboardPhase | null;
  trust: DashboardTrust | null; cohesion: DashboardCohesion | null; rankings: DashboardRankings | null;
};
type Concern = { id: string; scope: "battalion" | "company"; title: string; detail: string; href: string; action: string };
type Change = { id: string; scope: string; date: string; weekly: boolean; delta: number; balance: number; explanation: string; href: string };

/** Read-only presentation model. Missing/held evidence never becomes zero or good health. */
export function buildLeadershipDashboard(input: DashboardInput) {
  const { phase } = input;
  const assignmentReady = input.assignmentState === "completed";
  const active = Boolean(!input.launchHeld && assignmentReady && phase?.phaseId && phase.phaseId === input.targetPhaseId && /^phase iii(?:\s|[-—–:]|$)/i.test(phase.phaseName ?? "") && phase.phaseStartDate && phase.phaseStartDate <= input.today && phase.campaignDay && phase.events.length === 8 && new Set(phase.events.map(event => event.id)).size === 8 && phase.events.every(event => event.phaseId === phase.phaseId && PHASE_THREE_EVENT_IDS.some(id => id === event.id)));
  const declaredPhaseThree = assignmentReady && phase && /^phase iii(?:\s|[-—–:]|$)/i.test(phase.phaseName ?? "");
  const gateUnknown = !input.assignmentState || input.assignmentState === "conflict" || assignmentReady && !phase && !input.launchHeld || Boolean(declaredPhaseThree && !input.launchHeld && (!phase?.phaseStartDate || phase.phaseStartDate <= input.today && !active));
  const windowEnded = Boolean(active && phase!.campaignDay! > 56);
  const trust = active && input.trust?.state === "current" && input.trust.ledger?.phaseId === phase?.phaseId ? input.trust : null;
  const cohesion = active && input.cohesion?.state === "current" ? input.cohesion.ledger : null;
  const rankings = active && input.rankings?.state === "current" ? input.rankings : null;
  const sourceState = (source: { state: string } | null, verified: boolean) => !active ? gateUnknown ? "unavailable" : "held" : verified ? "current" : source?.state === "stale" ? "stale" : source?.state === "recovery" ? "recovery" : "unavailable";
  const concerns: Concern[] = [];
  const changes: Change[] = [];

  const companies = COMMAND_TRUST_COMPANIES.map(company => {
    const balance = trust?.ledger?.companies.find(item => item.id === company.id)?.trust;
    const verified = typeof balance === "number" && Number.isFinite(balance) && balance >= 0 && balance <= 100;
    const insight = verified ? trust?.insights?.find(item => item.companyId === company.id) ?? null : null;
    const readiness = input.readiness?.[company.category.toLowerCase() as keyof ReadinessScores];
    if (insight && ["at_risk", "neglect", "weekly_cap"].includes(insight.risk)) concerns.push({ id: `risk:${company.id}`, scope: "company", title: `${company.name} · ${insight.risk === "at_risk" ? "Neglect approaching" : insight.risk === "weekly_cap" ? "Weekly loss limit reached" : "Neglect active"}`, detail: insight.riskExplanation, href: `/command/trust#${company.id}`, action: "Review company" });
    return {
      id: company.id, name: company.name, category: company.category,
      readiness: typeof readiness === "number" && Number.isFinite(readiness) ? readiness : null,
      state: sourceState(input.trust, verified), trust: verified ? balance : null,
      trend: insight?.trend ?? null, risk: insight?.risk ?? null,
      unreviewedDays: insight?.unreviewedDays ?? null,
      dailyGuidance: insight?.dailyGuidance ?? null, weeklyGuidance: insight?.weeklyGuidance ?? null,
      href: `/command/trust#${company.id}`,
    };
  });
  const trustVerified = Boolean(trust && companies.every(company => company.state === "current"));
  if (active) {
    for (const source of [
      { id: "trust", verified: trustVerified, name: "Company Trust", href: "/command/trust", state: input.trust?.state },
      { id: "cohesion", verified: Boolean(cohesion), name: "Battalion Cohesion", href: "/command/cohesion", state: input.cohesion?.state },
      { id: "rankings", verified: Boolean(rankings), name: "Battalion Rankings", href: "/command/leaderboard", state: input.rankings?.state },
    ]) if (!source.verified) concerns.push({ id: `source:${source.id}`, scope: "battalion", title: `${source.name} · Verification needed`, detail: source.state === "stale" ? "Source records have changed. Refresh the detailed view before trusting its values." : source.state === "recovery" ? "A saved review or result needs recovery. No score is inferred while the operation is incomplete." : "The source is unavailable or conflicting. Its values and guidance are withheld.", href: source.href, action: "Open detailed view" });
    const reviewGaps = Math.max(0, ...companies.map(company => company.unreviewedDays ?? 0));
    if (reviewGaps) concerns.push({ id: "day-review", scope: "battalion", title: "Recent habit evidence needs review", detail: `At least one company has ${reviewGaps} recent finished day(s) awaiting complete or reviewed evidence. Missing data is not neglect.`, href: "/command/trust", action: "Review habit records" });
    if (rankings?.finalizable && !rankings.finalized) concerns.push({ id: "final-placement", scope: "battalion", title: "Final placement ready to record", detail: "All eight results and the phase-end boundary verify. Record the permanent placement on the Rankings board.", href: "/command/leaderboard", action: "Review final placement" });
  }
  if (gateUnknown) concerns.push({ id: "command-verification", scope: "battalion", title: "Command records need verification", detail: "Command identity or phase records are unavailable or conflicting. Operational values remain unavailable.", href: "/command", action: "Review command records" });
  if (!input.readiness) concerns.push({ id: "readiness", scope: "battalion", title: "Training readiness unavailable", detail: "The current player readiness reference could not be loaded. No readiness score is assumed.", href: "/service-record", action: "Open Service Record" });

  if (trust?.ledger) for (const [index, entry] of trust.ledger.entries.filter(entry => entry.rule !== "initial").entries()) changes.push({ id: `trust:${index}`, scope: COMMAND_TRUST_COMPANIES.find(company => company.id === entry.companyId)?.name ?? "Company Trust", date: entry.date, weekly: entry.rule === "weekly", delta: entry.delta, balance: entry.balance, explanation: entry.explanation, href: `/command/trust#${entry.companyId}` });
  if (cohesion) for (const [index, entry] of cohesion.entries.entries()) changes.push({ id: `cohesion:${index}`, scope: "Battalion Cohesion", date: entry.date, weekly: false, delta: entry.delta, balance: entry.balance, explanation: `${entry.eventTitle} · Attempt ${entry.attempt} · ${entry.outcome === "success" ? "Passed" : "Failed"}`, href: "/command/cohesion" });
  const completed = cohesion?.entries.filter(entry => entry.outcome === "success").map(entry => entry.eventId) ?? [];
  const evaluations = active && cohesion && phase ? phase.events.filter(event => !completed.includes(event.id)).sort((a, b) => a.unlockDay - b.unlockDay).slice(0, 3).map(event => ({
    id: event.id, title: event.title, day: event.unlockDay, type: event.type,
    status: windowEnded ? "phase-ended" as const : getEventOutcomeState({ event, campaignDay: phase.campaignDay!, completedEventIds: completed }),
    requirement: getEventReadinessCopy(event),
  })) : [];
  const next = evaluations[0];
  if (windowEnded && cohesion && cohesion.successes < 8) concerns.push({ id: "phase-window-ended", scope: "battalion", title: "Phase window ended with unfinished exercises", detail: "New exercise attempts are no longer available. Review the verified outcomes and any saved recovery records before determining next steps.", href: "/command/cohesion", action: "Review exercise record" });
  if (next && ["active", "missed", "retry-ready", "failed-terminal"].includes(next.status)) concerns.push({ id: "evaluation", scope: "battalion", title: next.status === "failed-terminal" ? "Exercise has no remaining retry days" : "Exercise ready for review", detail: `${next.title} · Day ${next.day}. ${next.requirement}`, href: next.status === "failed-terminal" ? "/command/cohesion" : "/command-hud", action: next.status === "failed-terminal" ? "Review outcome" : "Open Command HUD" });
  const athena = rankings?.standings.find(standing => standing.battalionId === "athena") ?? null;
  const sourcesVerified = trustVerified && Boolean(cohesion) && Boolean(rankings);
  return {
    state: !active ? gateUnknown ? "unavailable" as const : "held" as const : sourcesVerified && input.readiness ? "current" as const : "partial" as const,
    today: input.today, day: active ? phase!.campaignDay : null, companies,
    cohesion: { state: sourceState(input.cohesion, Boolean(cohesion)), score: cohesion?.score ?? null, successes: cohesion?.successes ?? null, failures: cohesion?.failures ?? null },
    rankings: { state: sourceState(input.rankings, Boolean(rankings)), rank: athena?.rank ?? null, points: athena?.points ?? null, wins: athena?.eventWins ?? null, movement: athena?.movement ?? null, resolvedEventCount: rankings?.resolvedEventCount ?? null, finalized: rankings?.finalized ?? false },
    concerns, changes: changes.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, 8), evaluations,
    concernsVerified: active && sourcesVerified && companies.every(company => company.risk !== null),
    morale: { state: "unavailable" as const },
  };
}
