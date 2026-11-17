import { eventCatalog, PHASE_THREE_EVENT_IDS, type CampaignEvent, type EventReadinessRequirements, type ReadinessScores } from "../data/events.ts";
import { evaluateEventReadiness } from "./event-readiness.ts";
import { calculateRetrySchedule } from "./event-outcome.ts";
import { addDaysToDateKey } from "./date.ts";

export const BATTALION_COHESION_PREFIX = "Battalion Cohesion · v1 ·";
export const BATTALION_COHESION_MARKER = "\n\nBattalion cohesion attempt v1:\n";
export const BATTALION_ID = "athena-training-battalion";

export type BattalionAttempt = {
  version: 1;
  battalionId: typeof BATTALION_ID;
  phaseId: string;
  eventPageId: string;
  eventId: string;
  eventTitle: string;
  eventType: "Minor Event" | "Major Event";
  attempt: number;
  date: string;
  campaignDay: number;
  eventDay: number;
  outcome: "success" | "failure";
  readiness: ReadinessScores;
  requirements: EventReadinessRequirements;
  retry: { slotsBefore: number; slotsAfter: number; availableDay: number | null; latestScheduledDay: number; phaseLength: number; delayDays: number };
};

export function battalionAttemptTitle(record: BattalionAttempt) {
  return `${BATTALION_COHESION_PREFIX} ${record.phaseId} · ${record.eventPageId} · ${record.attempt}`;
}

export function battalionAttemptSummary(record: BattalionAttempt) {
  const magnitude = record.eventType === "Major Event" ? 10 : 5;
  return `${record.eventTitle} · Attempt ${record.attempt} · ${record.outcome === "success" ? "Passed" : "Failed"} · ${record.outcome === "success" ? "+" : "−"}${magnitude} Battalion Cohesion before bounds. No XP or readiness awarded by this record.`;
}

export function serializeBattalionAttempt(record: BattalionAttempt) {
  return battalionAttemptSummary(record) + BATTALION_COHESION_MARKER + JSON.stringify(record);
}

function positiveInteger(value: number) { return Number.isInteger(value) && value > 0; }
function nonnegativeInteger(value: number) { return Number.isInteger(value) && value >= 0; }

/** Reject corrupted snapshots rather than deriving an authoritative score from them. */
export function validateBattalionAttempt(record: BattalionAttempt) {
  const catalog = eventCatalog.find(event => event.id === record.eventId);
  if (record.version !== 1 || record.battalionId !== BATTALION_ID || !record.phaseId || !record.eventPageId || !record.eventTitle || !PHASE_THREE_EVENT_IDS.some(id => id === record.eventId) || catalog?.type !== record.eventType || !positiveInteger(record.attempt) || !positiveInteger(record.campaignDay) || !positiveInteger(record.eventDay) || record.campaignDay < record.eventDay || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || addDaysToDateKey(record.date, 0) !== record.date || !["success", "failure"].includes(record.outcome)) throw new Error("Invalid Battalion Cohesion attempt");
  if (!record.readiness || !["physical", "recovery", "intelligence", "professional"].every(key => Number.isFinite(record.readiness[key as keyof ReadinessScores]) && record.readiness[key as keyof ReadinessScores] >= 0)) throw new Error("Invalid event readiness evidence");
  const requirements = record.requirements;
  const keys = ["physical", "recovery", "intelligence", "professional"];
  if (!requirements || (!requirements.atLeastOne && !Object.keys(requirements.minimums ?? {}).length) || Object.entries(requirements.minimums ?? {}).some(([key, value]) => !keys.includes(key) || !Number.isFinite(value) || value < 0) || (requirements.atLeastOne && (!requirements.atLeastOne.keys.length || requirements.atLeastOne.keys.some(key => !keys.includes(key)) || !Number.isFinite(requirements.atLeastOne.minimum) || requirements.atLeastOne.minimum < 0))) throw new Error("Missing or invalid review requirements");
  if (evaluateEventReadiness(requirements, record.readiness).eligible !== (record.outcome === "success")) throw new Error("Event outcome disagrees with readiness evidence");
  const retry = record.retry;
  if (!retry || !nonnegativeInteger(retry.slotsBefore) || !nonnegativeInteger(retry.slotsAfter) || retry.phaseLength !== 56 || retry.delayDays !== 5 || !positiveInteger(retry.latestScheduledDay) || retry.latestScheduledDay < record.eventDay || record.campaignDay > retry.phaseLength || retry.latestScheduledDay > retry.phaseLength) throw new Error("Invalid review schedule");
  const schedule = record.outcome === "failure" ? calculateRetrySchedule({ campaignDay: record.campaignDay, eventDay: record.eventDay, latestScheduledDay: retry.latestScheduledDay, phaseLength: retry.phaseLength, retryDelayDays: retry.delayDays }) : null;
  if (retry.availableDay !== (schedule?.retryAvailableDay ?? null) || retry.slotsAfter !== retry.slotsBefore + (schedule?.retrySlotsConsumed ?? 0)) throw new Error("Invalid attempt retry evidence");
}

export function parseBattalionAttempt(description: string): BattalionAttempt | null {
  try {
    const record = JSON.parse(description.split(BATTALION_COHESION_MARKER)[1]) as BattalionAttempt;
    validateBattalionAttempt(record);
    return serializeBattalionAttempt(record) === description ? record : null;
  } catch { return null; }
}

export function buildBattalionAttempt({ phaseId, event, readiness, campaignDay, date, latestScheduledDay, previous }: {
  phaseId: string; event: CampaignEvent; readiness: ReadinessScores; campaignDay: number; date: string; latestScheduledDay: number; previous: BattalionAttempt[];
}): BattalionAttempt {
  const outcome = evaluateEventReadiness(event.readinessRequirements, readiness).eligible ? "success" : "failure";
  const schedule = outcome === "failure" ? calculateRetrySchedule({ campaignDay, eventDay: event.unlockDay, latestScheduledDay, phaseLength: 56, retryDelayDays: 5 }) : null;
  const record: BattalionAttempt = {
    version: 1, battalionId: BATTALION_ID, phaseId, eventPageId: event.pageId, eventId: event.id, eventTitle: event.title, eventType: event.type,
    attempt: previous.filter(attempt => attempt.eventId === event.id).length + 1, date, campaignDay, eventDay: event.unlockDay, outcome, readiness,
    requirements: event.readinessRequirements ?? {},
    retry: { slotsBefore: event.retrySlotsUsed, slotsAfter: event.retrySlotsUsed + (schedule?.retrySlotsConsumed ?? 0), availableDay: schedule?.retryAvailableDay ?? null, latestScheduledDay, phaseLength: 56, delayDays: 5 },
  };
  validateBattalionAttempt(record);
  replayBattalionCohesion([...previous, record]);
  return record;
}

export function replayBattalionCohesion(attempts: BattalionAttempt[]) {
  let score = 50;
  const ordered = [...attempts].sort((a, b) => PHASE_THREE_EVENT_IDS.findIndex(id => id === a.eventId) - PHASE_THREE_EVENT_IDS.findIndex(id => id === b.eventId) || a.attempt - b.attempt);
  const seen = new Map<string, BattalionAttempt>();
  const phaseId = ordered[0]?.phaseId;
  const entries = ordered.map(record => {
    validateBattalionAttempt(record);
    if (record.phaseId !== phaseId) throw new Error("Mixed cohesion phases");
    const previous = seen.get(record.eventId);
    const index = PHASE_THREE_EVENT_IDS.findIndex(id => id === record.eventId);
    if (record.attempt !== (previous?.attempt ?? 0) + 1 || record.retry.slotsBefore !== (previous?.retry.slotsAfter ?? 0) || previous?.outcome === "success" || (previous && (previous.retry.availableDay === null || record.eventDay !== previous.retry.availableDay || record.campaignDay < previous.retry.availableDay || record.date < previous.date || record.eventPageId !== previous.eventPageId)) || (index > 0 && seen.get(PHASE_THREE_EVENT_IDS[index - 1])?.outcome !== "success")) throw new Error("Duplicate, missing or out-of-order cohesion attempt");
    seen.set(record.eventId, record);
    const requestedDelta = (record.eventType === "Major Event" ? 10 : 5) * (record.outcome === "success" ? 1 : -1);
    const next = Math.max(0, Math.min(100, score + requestedDelta));
    const entry = { ...record, requestedDelta, delta: next - score, balance: next };
    score = next;
    return entry;
  });
  return { score, baseline: 50, maximum: 100, entries, successes: entries.filter(entry => entry.outcome === "success").length, failures: entries.filter(entry => entry.outcome === "failure").length };
}

/** Journal first, verify, then apply/recover the event side of the operation. */
export async function persistBattalionAttempt({ read, create, apply, verify }: {
  read: () => Promise<boolean>; create: () => Promise<unknown>; apply: () => Promise<unknown>; verify: () => Promise<boolean>;
}) {
  if (!(await read())) {
    try { await create(); }
    catch (error) { if (!(await read())) throw error; }
  }
  if (!(await read())) throw new Error("Cohesion attempt write did not verify");
  if (!(await verify())) {
    try { await apply(); }
    catch (error) { if (!(await verify())) throw error; }
  }
  if (!(await verify())) throw new Error("Event outcome needs recovery before cohesion is authoritative");
}
