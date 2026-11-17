import "server-only";
import type { PageObjectResponse, QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints";
import { PHASE_THREE_EVENT_IDS, eventCatalog, type CampaignEvent } from "@/data/events";
import { getNotionClient, getRequiredNotionId } from "@/lib/notion-client";
import { collectNotionPages } from "@/lib/notion-pagination";
import { resolveNotionDataSourceId } from "@/lib/notion-data-source";
import { completeCampaignEvent, getActiveCampaignEventState, getAlexReadinessScores, getAlexServiceRecordPageId, getCommandAssignmentStatus, markCampaignEventFailed } from "@/lib/notion";
import { getOperationalDateKey, addDaysToDateKey } from "@/lib/date";
import { getEventOutcomeState } from "@/lib/event-outcome";
import { evaluateEventReadiness } from "@/lib/event-readiness";
import { BATTALION_COHESION_PREFIX, battalionAttemptTitle, buildBattalionAttempt, parseBattalionAttempt, persistBattalionAttempt, replayBattalionCohesion, serializeBattalionAttempt, type BattalionAttempt } from "@/lib/battalion-cohesion";

async function query(dataSourceId: string, filter: QueryDataSourceParameters["filter"]) {
  return (await collectNotionPages(cursor => getNotionClient().dataSources.query({ data_source_id: dataSourceId, filter, start_cursor: cursor }))).filter((page): page is PageObjectResponse => "properties" in page);
}
function text(page: PageObjectResponse, name: string) {
  const property = page.properties[name];
  return property?.type === "rich_text" ? property.rich_text.map(value => value.plain_text).join("") : property?.type === "title" ? property.title.map(value => value.plain_text).join("") : "";
}
function relationIs(page: PageObjectResponse, name: string, id: string) {
  const property = page.properties[name];
  return property?.type === "relation" && !("has_more" in property && property.has_more) && property.relation.length === 1 && property.relation[0].id === id;
}
async function historySource() { return resolveNotionDataSourceId(getNotionClient(), getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID")); }

async function context() {
  const assignment = await getCommandAssignmentStatus();
  if (assignment.state !== "completed") return null;
  const phaseId = assignment.eligibility.evidence.targetPhaseId;
  if (!phaseId) return null;
  const phase = await getNotionClient().pages.retrieve({ page_id: phaseId });
  if (!("properties" in phase)) throw new Error("Cohesion phase unavailable");
  const status = phase.properties["Phase Status"];
  const number = phase.properties["Phase Number"];
  const length = phase.properties["Phase Length"];
  const startProperty = phase.properties["Phase Start Date"];
  const start = startProperty?.type === "date" ? startProperty.date?.start.slice(0, 10) : null;
  const today = getOperationalDateKey();
  if (status?.type !== "select" || status.select?.name !== "Active" || number?.type !== "number" || number.number !== 3 || !start || start > today) return null;
  if (length?.type !== "number" || length.number !== 56 || !assignment.persisted.assignedAt || assignment.persisted.assignedAt.slice(0, 10) > start) throw new Error("Invalid Battalion Cohesion phase boundary");
  const [state, serviceId] = await Promise.all([getActiveCampaignEventState(), getAlexServiceRecordPageId()]);
  if (!serviceId || state.phaseId !== phaseId || state.phaseStartDate !== start || state.events.length !== 8 || new Set(state.events.map(event => event.id)).size !== 8 || state.events.some(event => !PHASE_THREE_EVENT_IDS.some(id => id === event.id) || event.phaseId !== phaseId || event.type !== eventCatalog.find(item => item.id === event.id)?.type || event.retryDelayDays !== 5)) throw new Error("Canonical Phase III event scope could not verify");
  return { phaseId, serviceId, start, end: addDaysToDateKey(start, 55), today, state };
}
type Context = NonNullable<Awaited<ReturnType<typeof context>>>;

async function readAttempts(ctx: Context) {
  const pages = await query(await historySource(), { property: "Title", title: { starts_with: `${BATTALION_COHESION_PREFIX} ${ctx.phaseId} ·` } });
  const attempts = pages.map(page => {
    const record = parseBattalionAttempt(text(page, "Description"));
    const xp = page.properties["XP Awarded"];
    const type = page.properties["Entry Type"];
    const readiness = page.properties["Readiness Category"];
    const eventRelation = page.properties["Related Event"];
    const event = ctx.state.events.find(event => event.id === record?.eventId);
    if (!record || record.phaseId !== ctx.phaseId || event?.pageId !== record.eventPageId || record.date !== addDaysToDateKey(ctx.start, record.campaignDay - 1) || record.date > ctx.today || text(page, "Title") !== battalionAttemptTitle(record) || xp?.type !== "number" || xp.number !== 0 || type?.type !== "select" || type.select?.name !== "System" || readiness?.type !== "select" || readiness.select?.name !== "None" || !relationIs(page, "Related Campaign", ctx.phaseId) || !relationIs(page, "Related Service Record", ctx.serviceId) || (eventRelation?.type === "relation" && (eventRelation.relation.length || ("has_more" in eventRelation && eventRelation.has_more)))) throw new Error("Invalid or conflicting Battalion Cohesion evidence");
    return record;
  });
  replayBattalionCohesion(attempts);
  return attempts.sort((a, b) => PHASE_THREE_EVENT_IDS.findIndex(id => id === a.eventId) - PHASE_THREE_EVENT_IDS.findIndex(id => id === b.eventId) || a.attempt - b.attempt);
}

async function eventProof(ctx: Context, event: CampaignEvent, record: BattalionAttempt) {
  if (event.retrySlotsUsed !== record.retry.slotsAfter) return false;
  if (record.outcome === "failure") return event.persistedStatus === "Failed" && !event.completedAt && event.retryAvailableDay === record.retry.availableDay;
  if (event.persistedStatus !== "Defeated" || !event.completedAt || event.retryAvailableDay !== null) return false;
  const histories = await query(await historySource(), { property: "Related Event", relation: { contains: event.pageId } });
  if (histories.length > 1) throw new Error("Duplicate event completion histories require reconciliation");
  const history = histories[0];
  if (!history) return false;
  const xp = history.properties["XP Awarded"];
  const type = history.properties["Entry Type"];
  if (text(history, "Title") !== `${record.eventTitle} Completed` || xp?.type !== "number" || xp.number !== (record.eventType === "Major Event" ? 500 : 250) || type?.type !== "select" || type.select?.name !== record.eventType || !relationIs(history, "Related Event", event.pageId) || !relationIs(history, "Related Campaign", ctx.phaseId) || !relationIs(history, "Related Service Record", ctx.serviceId)) throw new Error("Event XP evidence does not match Cohesion outcome");
  return true;
}

async function verifyOutcomes(ctx: Context, attempts: BattalionAttempt[]) {
  const latest = new Map(attempts.map(attempt => [attempt.eventId, attempt]));
  const pending: BattalionAttempt[] = [];
  const completions = await query(await historySource(), { and: [
    { property: "Related Campaign", relation: { contains: ctx.phaseId } },
    { property: "Related Event", relation: { is_not_empty: true } },
  ] });
  for (const event of ctx.state.events) {
    const record = latest.get(event.id);
    const completionExists = completions.some(page => {
      const property = page.properties["Related Event"];
      return property?.type === "relation" && property.relation.some(relation => relation.id === event.pageId);
    });
    if (completionExists && record?.outcome !== "success") throw new Error("Event XP history is missing a matching successful Cohesion attempt");
    if (!record) {
      if (event.retrySlotsUsed || event.persistedStatus === "Failed" || event.persistedStatus === "Defeated" || event.completedAt) throw new Error("Event outcome is missing its Cohesion attempt evidence");
    } else if (!(await eventProof(ctx, event, record))) {
      // Repair only an interrupted application, never overwrite subsequent/manual state.
      if (event.retrySlotsUsed !== record.retry.slotsBefore || (record.outcome === "failure" && (event.persistedStatus === "Defeated" || event.completedAt || (event.retrySlotsUsed === record.retry.slotsAfter && record.retry.availableDay !== null)))) throw new Error("Event state conflicts with Cohesion history");
      pending.push(record);
    }
  }
  if (pending.length > 1) throw new Error("Multiple incomplete event outcomes require reconciliation");
  return pending;
}

async function applyAttempt(ctx: Context, record: BattalionAttempt) {
  if (record.outcome === "failure") {
    await markCampaignEventFailed(record.eventPageId, record.retry.availableDay, record.retry.slotsAfter);
  } else {
    await completeCampaignEvent({ eventPageId: record.eventPageId, eventId: record.eventId, eventTitle: record.eventTitle, eventType: record.eventType, eventDay: record.eventDay, campaignDay: record.campaignDay, xpReward: record.eventType === "Major Event" ? 500 : 250, description: eventCatalog.find(event => event.id === record.eventId)?.prompt ?? record.eventTitle, serviceRecordPageId: ctx.serviceId, campaignPageId: ctx.phaseId, readinessSnapshot: record.readiness, readinessRequirements: record.requirements });
  }
}

async function saveAttempt(ctx: Context, record: BattalionAttempt) {
  await persistBattalionAttempt({
    read: async () => {
      const attempts = await readAttempts(ctx);
      const matching = attempts.find(attempt => battalionAttemptTitle(attempt) === battalionAttemptTitle(record));
      if (matching && serializeBattalionAttempt(matching) !== serializeBattalionAttempt(record)) throw new Error("Conflicting event review attempt");
      return Boolean(matching);
    },
    create: async () => {
      const payload = serializeBattalionAttempt(record);
      const chunks = payload.match(/[\s\S]{1,1900}/g) ?? [];
      if (chunks.length > 100) throw new Error("Cohesion evidence exceeds record capacity");
      await getNotionClient().pages.create({ parent: { data_source_id: await historySource() }, properties: {
        Title: { title: [{ text: { content: battalionAttemptTitle(record) } }] },
        Description: { rich_text: chunks.map(content => ({ text: { content } })) },
        Date: { date: { start: record.date } },
        "Entry Type": { select: { name: "System" } }, "XP Awarded": { number: 0 }, "Readiness Category": { select: { name: "None" } },
        "Related Service Record": { relation: [{ id: ctx.serviceId }] }, "Related Campaign": { relation: [{ id: ctx.phaseId }] },
        // Related Event is reserved for the existing exactly-one XP completion record.
      } });
    },
    apply: () => applyAttempt(ctx, record),
    verify: async () => {
      const current = await getActiveCampaignEventState();
      if (current.phaseId !== ctx.phaseId) throw new Error("Active phase changed during event review");
      const event = current.events.find(event => event.pageId === record.eventPageId);
      return Boolean(event && await eventProof(ctx, event, record));
    },
  });
}

export async function getBattalionCohesionStatus() {
  const ctx = await context();
  if (!ctx) return { state: "held" as const, ledger: null };
  const attempts = await readAttempts(ctx);
  const pending = await verifyOutcomes(ctx, attempts);
  return { state: pending.length ? "recovery" as const : "current" as const, ledger: pending.length ? null : replayBattalionCohesion(attempts) };
}

/** Server-only evidence boundary shared with the rankings projection. Never writes. */
export async function getVerifiedBattalionEvidence() {
  const ctx = await context();
  if (!ctx) return null;
  const attempts = await readAttempts(ctx);
  if ((await verifyOutcomes(ctx, attempts)).length) throw new Error("Recover the saved event review before updating Battalion Rankings");
  return { ...ctx, attempts };
}

async function reconcileRankings() {
  const { reconcileBattalionRankings } = await import("@/lib/battalion-rankings-store");
  await reconcileBattalionRankings();
}

// Serialize local event reviews and recovery. Cross-instance duplicates are detected on readback.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}
const activeReviews = new Map<string, Promise<ReviewResult>>();
type ReviewResult = { status: number; body: Record<string, unknown> };

export function reconcileBattalionCohesion() {
  return exclusive(async () => {
    const ctx = await context();
    if (!ctx) return { state: "held" as const, ledger: null };
    const attempts = await readAttempts(ctx);
    for (const record of await verifyOutcomes(ctx, attempts)) await saveAttempt(ctx, record);
    await reconcileRankings();
    return getBattalionCohesionStatus();
  });
}

export function reviewBattalionEvent(eventId: string) {
  const active = activeReviews.get(eventId);
  if (active) return active;
  const result = exclusive(() => review(eventId)).finally(() => activeReviews.delete(eventId));
  activeReviews.set(eventId, result);
  return result;
}

async function review(eventId: string): Promise<ReviewResult> {
  const reject = (error: string, status = 409): ReviewResult => ({ status, body: { error } });
  const ctx = await context();
  if (!ctx) return reject("Battalion events require accepted command and active Phase III.");
  const attempts = await readAttempts(ctx);
  const pending = await verifyOutcomes(ctx, attempts);
  if (pending.length) {
    await saveAttempt(ctx, pending[0]);
    return reject("The previous event review was recovered. Refresh before reviewing again.");
  }
  const event = ctx.state.events.find(event => event.id === eventId);
  if (!event) return reject("Event is not part of active Phase III.");
  const previous = attempts.filter(attempt => attempt.eventId === eventId);
  if (previous.at(-1)?.outcome === "success") {
    await reconcileRankings();
    return { status: 200, body: { ok: true, eventId, alreadyCompleted: true } };
  }
  const campaignDay = ctx.state.campaignDay;
  if (!campaignDay || campaignDay > 56 || campaignDay < event.unlockDay) return reject("Event is outside its available Phase III window.");
  const index = PHASE_THREE_EVENT_IDS.findIndex(id => id === eventId);
  if (PHASE_THREE_EVENT_IDS.slice(0, index).some(id => attempts.filter(attempt => attempt.eventId === id).at(-1)?.outcome !== "success")) return reject("Complete earlier events before reviewing this event.");
  const state = getEventOutcomeState({ event, campaignDay });
  if (state === "failed-terminal") return reject("No retry days remain for this event.");
  if (state === "cooldown") return reject("Event review cooldown is still active.", 429);
  const readiness = await getAlexReadinessScores();
  const record = buildBattalionAttempt({ phaseId: ctx.phaseId, event, readiness, campaignDay, date: ctx.today, latestScheduledDay: Math.max(...ctx.state.events.map(event => event.unlockDay)), previous: attempts });
  await saveAttempt(ctx, record);
  // Recheck full scope and duplicates before returning a successful mutation.
  const verified = await getBattalionCohesionStatus();
  if (verified.state !== "current") throw new Error("Cohesion outcome could not verify");
  await reconcileRankings();
  const evaluation = evaluateEventReadiness(record.requirements, record.readiness);
  return record.outcome === "success" ? { status: 200, body: { ok: true, eventId, alreadyCompleted: false } } : {
    status: 422,
    body: { error: record.retry.availableDay === null ? "Event failed readiness review. No retry days remain in this phase." : `Event failed readiness review. Retry authorized on Campaign Day ${record.retry.availableDay}.`, readinessEvaluation: evaluation, unmetRequirements: evaluation.unmetRequirements, eventStatus: "Failed", retryAvailableDay: record.retry.availableDay, scheduleDelayDays: (record.retry.slotsAfter - record.retry.slotsBefore) * 5 },
  };
}
