import { PHASE_THREE_EVENT_IDS } from "../data/events.ts";
import { resolveFireteamEventScores, calculateCumulativeStandings, type FireteamStandingId, type StandingsReadinessKey } from "./fireteam-standings.ts";
import { validateBattalionAttempt, type BattalionAttempt } from "./battalion-cohesion.ts";
import type { CompetitionPlacement } from "./competition-trophies.ts";

export const BATTALION_RANKINGS_PREFIX = "Battalion Rankings · v1 ·";
export const BATTALIONS = [
  { id: "hephaestus", origin: "alpha", name: "Hephaestus Training Battalion", affinity: "Professional", specialty: "Discipline · Logistics" },
  { id: "artemis", origin: "delta", name: "Artemis Training Battalion", affinity: "Recovery", specialty: "Resilience · Adaptability" },
  { id: "athena", origin: "epsilon", name: "Athena Training Battalion", affinity: "Balanced", specialty: "Integrated Leadership" },
  { id: "ares", origin: "sigma", name: "Ares Training Battalion", affinity: "Physical", specialty: "Strength · Execution" },
  { id: "apollo", origin: "theta", name: "Apollo Training Battalion", affinity: "Intelligence", specialty: "Analysis · Planning" },
] as const;
export type BattalionStandingId = typeof BATTALIONS[number]["id"];
export type BattalionEventScore = { battalionId: BattalionStandingId; points: number; placement: number };
export type BattalionStanding = { battalionId: BattalionStandingId; points: number; eventWins: number; finalMajorPlacement: number | null; rank: number };
export type BattalionRankingResolution = {
  version: 1; phaseId: string; eventId: string; eventPageId: string;
  sourceAttempt: BattalionAttempt; seed: string;
  scores: BattalionEventScore[]; cumulativeStandings: BattalionStanding[];
};

function origin(id: BattalionStandingId): FireteamStandingId {
  const battalion = BATTALIONS.find(item => item.id === id);
  if (!battalion) throw new Error("Unknown battalion identity");
  return battalion.origin;
}

export function calculateBattalionStandings(resolutions: BattalionRankingResolution[]): BattalionStanding[] {
  return calculateCumulativeStandings(resolutions.map(record => ({
    eventType: record.sourceAttempt.eventType,
    eventDay: record.sourceAttempt.eventDay,
    scores: record.scores.map(score => ({ fireteamId: origin(score.battalionId), points: score.points, placement: score.placement })),
  }))).map(({ fireteamId, ...standing }) => ({ battalionId: BATTALIONS.find(item => item.origin === fireteamId)!.id, ...standing }));
}

function resolve(attempt: BattalionAttempt, previous: BattalionRankingResolution[]): BattalionRankingResolution {
  validateBattalionAttempt(attempt);
  if (attempt.outcome !== "success") throw new Error("Only verified passed exercises earn standings");
  const minimums = Object.entries(attempt.requirements.minimums ?? {}).filter(([, value]) => value > 0) as [StandingsReadinessKey, number][];
  const major = attempt.eventType === "Major Event";
  if ((!major && (minimums.length !== 1 || attempt.requirements.atLeastOne)) || (major && (!attempt.requirements.atLeastOne || minimums.length))) throw new Error("Unsupported competitive readiness contract");
  const seed = `${attempt.phaseId}:${attempt.eventPageId}:battalion:v1`;
  const scores = resolveFireteamEventScores({ eventType: attempt.eventType, readiness: attempt.readiness, primaryReadiness: major ? "mixed" : minimums[0][0], requirement: major ? attempt.requirements.atLeastOne!.minimum : minimums[0][1], seed }).map(({ fireteamId, ...score }) => ({ battalionId: BATTALIONS.find(item => item.origin === fireteamId)!.id, ...score }));
  const record: BattalionRankingResolution = { version: 1, phaseId: attempt.phaseId, eventId: attempt.eventId, eventPageId: attempt.eventPageId, sourceAttempt: attempt, seed, scores, cumulativeStandings: [] };
  record.cumulativeStandings = calculateBattalionStandings([...previous, record]);
  return record;
}

/** Recompute every saved result and cached total from immutable review evidence. */
export function validateBattalionRankings(records: BattalionRankingResolution[]) {
  if (records.length > 8 || new Set(records.map(record => record.eventPageId)).size !== records.length) throw new Error("Duplicate or invalid Battalion Rankings evidence");
  const ordered = [...records].sort((a, b) => PHASE_THREE_EVENT_IDS.findIndex(id => id === a.eventId) - PHASE_THREE_EVENT_IDS.findIndex(id => id === b.eventId));
  const verified: BattalionRankingResolution[] = [];
  for (const [index, record] of ordered.entries()) {
    if (record.version !== 1 || record.eventId !== PHASE_THREE_EVENT_IDS[index] || record.phaseId !== (ordered[0]?.phaseId) || record.sourceAttempt.phaseId !== record.phaseId || record.sourceAttempt.eventId !== record.eventId || record.sourceAttempt.eventPageId !== record.eventPageId) throw new Error("Missing, foreign or out-of-order Battalion Rankings evidence");
    const expected = resolve(record.sourceAttempt, verified);
    if (JSON.stringify(expected) !== JSON.stringify(record)) throw new Error("Battalion Rankings snapshot disagrees with its source evidence");
    verified.push(record);
  }
  return verified;
}

export function buildBattalionRanking(attempt: BattalionAttempt, previous: BattalionRankingResolution[]) {
  const verified = validateBattalionRankings(previous);
  const record = resolve(attempt, verified);
  validateBattalionRankings([...verified, record]);
  return record;
}

export function parseBattalionRanking(value: string): BattalionRankingResolution | null {
  try {
    const record = JSON.parse(value) as BattalionRankingResolution;
    // Full cumulative validation requires the earlier results and is performed by the store.
    validateBattalionAttempt(record.sourceAttempt);
    if (record.version !== 1 || record.sourceAttempt.outcome !== "success" || !Array.isArray(record.scores) || !Array.isArray(record.cumulativeStandings)) return null;
    return record;
  } catch { return null; }
}

export function battalionRankingTitle(record: BattalionRankingResolution) {
  return `${BATTALION_RANKINGS_PREFIX} ${record.phaseId} · ${record.eventPageId}`;
}

export function buildBattalionBoard(records: BattalionRankingResolution[]) {
  const ordered = validateBattalionRankings(records);
  const previous = calculateBattalionStandings(ordered.slice(0, -1));
  return calculateBattalionStandings(ordered).map(standing => {
    const previousRank = previous.find(item => item.battalionId === standing.battalionId)!.rank;
    return { ...standing, previousRank, movement: ordered.length > 1 ? previousRank - standing.rank : 0 };
  });
}

export function finalBattalionPlacement({ phaseId, campaignNumber, recordDate, resolutions }: {
  phaseId: string; campaignNumber: number; recordDate: string; resolutions: BattalionRankingResolution[];
}): CompetitionPlacement {
  const ordered = validateBattalionRankings(resolutions);
  if (ordered.length !== 8 || ordered.some(record => record.phaseId !== phaseId)) throw new Error("All eight verified results are required for final placement");
  const athena = calculateBattalionStandings(ordered).find(standing => standing.battalionId === "athena")!;
  return { version: 1, phaseId, phaseNumber: 3, campaignNumber, competition: "battalion", unitName: "Athena Training Battalion", rank: athena.rank, points: athena.points, maximumPoints: 32, eventWins: athena.eventWins, recordDate, sourceEventIds: ordered.map(record => record.eventPageId).sort() };
}
