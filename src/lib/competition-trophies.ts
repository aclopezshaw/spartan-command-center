import { calculateCumulativeStandings, PHASE_TWO_COMPETITIVE_EVENT_IDS, type FireteamStandingsResolution } from "./fireteam-standings.ts";
import { addDaysToDateKey } from "./date.ts";

export const PLACEMENT_HISTORY_PREFIX = "Final Competition Placement · v1 ·";
export const PLACEMENT_DESCRIPTION_MARKER = "\n\nPlacement record v1:\n";
export type CompetitionPlacement = {
  version: 1; phaseId: string; phaseNumber: 2 | 3; campaignNumber: number;
  competition: "fireteam" | "battalion"; unitName: string;
  rank: number; points: number; maximumPoints: number; eventWins: number;
  recordDate: string; sourceEventIds: string[];
};
export function placementTitle(record: CompetitionPlacement) { return `${PLACEMENT_HISTORY_PREFIX} Phase ${record.phaseNumber === 2 ? "II Fireteam" : "III Battalion"} · Campaign ${record.campaignNumber} · ${record.rank}${record.rank === 1 ? "st" : record.rank === 2 ? "nd" : record.rank === 3 ? "rd" : "th"} Place`; }
export function trophyLevel(record: CompetitionPlacement) {
  if (record.phaseNumber === 2) return record.rank === 1 ? "gold" : null;
  return record.rank === 1 ? "gold" : record.rank === 2 ? "silver" : record.rank === 3 ? "bronze" : null;
}
export function placementSummary(record: CompetitionPlacement) {
  return `${record.unitName} finished ${record.rank}${record.rank === 1 ? "st" : record.rank === 2 ? "nd" : record.rank === 3 ? "rd" : "th"} of 5 in the Phase ${record.phaseNumber === 2 ? "II Fireteam" : "III Battalion"} leaderboard, Campaign ${record.campaignNumber}, with ${record.points}/${record.maximumPoints} competition points and ${record.eventWins} first-place event finishes. Final placement verified after the phase boundary. No additional XP awarded.`;
}
export function parsePlacementDescription(description: string): CompetitionPlacement | null {
  const raw = description.split(PLACEMENT_DESCRIPTION_MARKER)[1];
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as CompetitionPlacement;
    const count = p.phaseNumber === 2 ? 5 : 8;
    if (p.version !== 1 || ![2, 3].includes(p.phaseNumber) || p.competition !== (p.phaseNumber === 2 ? "fireteam" : "battalion") || typeof p.phaseId !== "string" || !p.phaseId || !Number.isInteger(p.campaignNumber) || p.campaignNumber < 1 || typeof p.unitName !== "string" || !p.unitName || !Number.isInteger(p.rank) || p.rank < 1 || p.rank > 5 || !Number.isInteger(p.points) || p.points < 0 || p.maximumPoints !== count * 4 || p.points > p.maximumPoints || !Number.isInteger(p.eventWins) || p.eventWins < 0 || p.eventWins > count || typeof p.recordDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.recordDate) || addDaysToDateKey(p.recordDate, 0) !== p.recordDate || !Array.isArray(p.sourceEventIds) || p.sourceEventIds.length !== count || new Set(p.sourceEventIds).size !== count || p.sourceEventIds.some(id => typeof id !== "string" || !id)) return null;
    return p;
  } catch { return null; }
}

/** Validates final Phase II source results; never trusts a cached cumulative rank. */
export function finalFireteamPlacement({ phaseId, campaignNumber, recordDate, resolutions }: {
  phaseId: string; campaignNumber: number; recordDate: string; resolutions: FireteamStandingsResolution[];
}): CompetitionPlacement {
  const ids = ["alpha", "delta", "epsilon", "sigma", "theta"];
  if (resolutions.length !== 5 || new Set(resolutions.map(r => r.eventId)).size !== 5 || new Set(resolutions.map(r => r.eventPageId)).size !== 5) throw new Error("Incomplete or duplicate final standings");
  for (const r of resolutions) {
    if (r.version !== 1 || r.campaignPageId !== phaseId || !PHASE_TWO_COMPETITIVE_EVENT_IDS.includes(r.eventId as typeof PHASE_TWO_COMPETITIVE_EVENT_IDS[number]) || !Number.isInteger(r.eventDay) || r.eventDay < 1 || !Number.isFinite(Date.parse(r.resolvedAt)) || !Array.isArray(r.scores) || r.scores.length !== 5 || new Set(r.scores.map(s => s.fireteamId)).size !== 5 || new Set(r.scores.map(s => s.points)).size !== 5 || r.scores.some(s => !ids.includes(s.fireteamId) || !Number.isInteger(s.points) || s.points < 0 || s.points > 4 || s.placement !== 5 - s.points) || r.eventType !== (r.eventId === "fireteam-battle-assessment" ? "Major Event" : "Minor Event")) throw new Error("Invalid final standings evidence");
  }
  const epsilon = calculateCumulativeStandings(resolutions).find(s => s.fireteamId === "epsilon")!;
  return { version: 1, phaseId, phaseNumber: 2, campaignNumber, competition: "fireteam", unitName: "Fireteam Epsilon", rank: epsilon.rank, points: epsilon.points, maximumPoints: 20, eventWins: epsilon.eventWins, recordDate, sourceEventIds: resolutions.map(r => r.eventPageId).sort() };
}
