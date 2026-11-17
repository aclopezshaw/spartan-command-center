import "server-only";
import type { PageObjectResponse, QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints";
import { getNotionClient, getRequiredNotionId } from "@/lib/notion-client";
import { collectNotionPages } from "@/lib/notion-pagination";
import { resolveNotionDataSourceId } from "@/lib/notion-data-source";
import { getVerifiedBattalionEvidence } from "@/lib/battalion-cohesion-store";
import { BATTALION_RANKINGS_PREFIX, battalionRankingTitle, buildBattalionRanking, buildBattalionBoard, finalBattalionPlacement, parseBattalionRanking, validateBattalionRankings, type BattalionRankingResolution } from "@/lib/battalion-rankings";
import { PLACEMENT_HISTORY_PREFIX, PLACEMENT_DESCRIPTION_MARKER, parsePlacementDescription, placementTitle, placementSummary, type CompetitionPlacement } from "@/lib/competition-trophies";

type Evidence = NonNullable<Awaited<ReturnType<typeof getVerifiedBattalionEvidence>>>;
async function source() { return resolveNotionDataSourceId(getNotionClient(), getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID")); }
async function query(filter: QueryDataSourceParameters["filter"]) {
  const id = await source();
  return (await collectNotionPages(cursor => getNotionClient().dataSources.query({ data_source_id: id, filter, start_cursor: cursor }))).filter((page): page is PageObjectResponse => "properties" in page);
}
function text(page: PageObjectResponse, name: string) {
  const prop = page.properties[name];
  return prop?.type === "title" ? prop.title.map(item => item.plain_text).join("") : prop?.type === "rich_text" ? prop.rich_text.map(item => item.plain_text).join("") : "";
}
function owns(page: PageObjectResponse, name: string, id: string) {
  const prop = page.properties[name];
  return prop?.type === "relation" && !("has_more" in prop && prop.has_more) && prop.relation.length === 1 && prop.relation[0].id === id;
}
function verifyMetadata(page: PageObjectResponse, ctx: Evidence) {
  const xp = page.properties["XP Awarded"], type = page.properties["Entry Type"], readiness = page.properties["Readiness Category"], event = page.properties["Related Event"];
  if (xp?.type !== "number" || xp.number !== 0 || type?.type !== "select" || type.select?.name !== "System" || readiness?.type !== "select" || readiness.select?.name !== "None" || !owns(page, "Related Campaign", ctx.phaseId) || !owns(page, "Related Service Record", ctx.serviceId) || (event?.type === "relation" && (event.relation.length || ("has_more" in event && event.has_more)))) throw new Error("Invalid Battalion Rankings ownership or reward metadata");
}

async function readResolutions(ctx: Evidence) {
  const pages = await query({ property: "Title", title: { starts_with: `${BATTALION_RANKINGS_PREFIX} ${ctx.phaseId} ·` } });
  const records = pages.map(page => {
    verifyMetadata(page, ctx);
    const record = parseBattalionRanking(text(page, "Description"));
    if (!record || record.phaseId !== ctx.phaseId || text(page, "Title") !== battalionRankingTitle(record)) throw new Error("Malformed Battalion Rankings snapshot");
    return record;
  });
  const ordered = validateBattalionRankings(records);
  const successes = ctx.attempts.filter(attempt => attempt.outcome === "success");
  if (ordered.some((record, index) => JSON.stringify(record.sourceAttempt) !== JSON.stringify(successes[index]))) throw new Error("Rankings no longer match verified exercise evidence");
  return ordered;
}

async function createRecord(ctx: Evidence, title: string, description: string, date: string) {
  const chunks = description.match(/[\s\S]{1,1900}/g) ?? [];
  if (chunks.length > 100) throw new Error("Rankings record exceeds supported capacity");
  await getNotionClient().pages.create({ parent: { data_source_id: await source() }, properties: {
    Title: { title: [{ text: { content: title } }] }, Description: { rich_text: chunks.map(content => ({ text: { content } })) }, Date: { date: { start: date } },
    "Entry Type": { select: { name: "System" } }, "XP Awarded": { number: 0 }, "Readiness Category": { select: { name: "None" } },
    "Related Campaign": { relation: [{ id: ctx.phaseId }] }, "Related Service Record": { relation: [{ id: ctx.serviceId }] },
  } });
}

async function ensureSaved(read: () => Promise<boolean>, create: () => Promise<unknown>) {
  if (await read()) return;
  try { await create(); } catch (error) { if (!(await read())) throw error; }
  if (!(await read())) throw new Error("Rankings write did not verify");
}

function expectedPlacement(ctx: Evidence, records: BattalionRankingResolution[]) {
  // Day 56 is the approved phase-completion boundary; early exercise completion is provisional.
  return ctx.today >= ctx.end && records.length === 8 ? finalBattalionPlacement({ phaseId: ctx.phaseId, campaignNumber: 2, recordDate: ctx.end, resolutions: records }) : null;
}

async function readPlacement(ctx: Evidence, records: BattalionRankingResolution[]) {
  const pages = await query({ property: "Title", title: { starts_with: `${PLACEMENT_HISTORY_PREFIX} Phase III Battalion · Campaign 2 ·` } });
  if (pages.length > 1) throw new Error("Duplicate final Battalion placement requires reconciliation");
  if (!pages[0]) return null;
  const page = pages[0];
  verifyMetadata(page, ctx);
  const placement = parsePlacementDescription(text(page, "Description"));
  const expected = expectedPlacement(ctx, records);
  if (!placement || !expected || JSON.stringify(placement) !== JSON.stringify(expected) || text(page, "Title") !== placementTitle(expected) || text(page, "Description") !== placementSummary(expected) + PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(expected)) throw new Error("Final Battalion placement disagrees with verified results or phase boundary");
  return placement;
}

function view(ctx: Evidence | null, records: BattalionRankingResolution[] = [], placement: CompetitionPlacement | null = null) {
  const count = ctx?.attempts.filter(attempt => attempt.outcome === "success").length ?? 0;
  const stale = count !== records.length;
  const finalizable = Boolean(ctx && expectedPlacement(ctx, records));
  return {
    state: !ctx ? "held" as const : stale ? "recovery" as const : "current" as const,
    campaignName: ctx?.state.campaignName ?? "Spartan Candidate Program", phaseName: ctx?.state.phaseName ?? "Phase III - Leadership Cadre",
    resolvedEventCount: stale ? null : ctx ? records.length : null,
    finalizable: !stale && finalizable, finalized: Boolean(placement),
    standings: ctx && !stale && records.length ? buildBattalionBoard(records) : [],
    eventResults: ctx && !stale ? records.map(record => ({ eventId: record.eventId, title: record.sourceAttempt.eventTitle, eventDay: record.sourceAttempt.eventDay, date: record.sourceAttempt.date, eventType: record.sourceAttempt.eventType, scores: record.scores })) : [],
    placement: placement ? { rank: placement.rank, points: placement.points, maximumPoints: placement.maximumPoints, eventWins: placement.eventWins, recordDate: placement.recordDate } : null,
  };
}

/** Read-only and sanitized: no readiness snapshots, seeds or private page IDs. */
export async function getBattalionRankingsStatus() {
  const ctx = await getVerifiedBattalionEvidence();
  if (!ctx) return view(null);
  const records = await readResolutions(ctx);
  return view(ctx, records, await readPlacement(ctx, records));
}

async function reconcile() {
  const ctx = await getVerifiedBattalionEvidence();
  if (!ctx) return view(null);
  let records = await readResolutions(ctx);
  const successes = ctx.attempts.filter(attempt => attempt.outcome === "success");
  for (const attempt of successes.slice(records.length)) {
    const expected = buildBattalionRanking(attempt, records);
    await ensureSaved(async () => {
      const saved = (await readResolutions(ctx)).find(record => record.eventPageId === attempt.eventPageId);
      if (saved && JSON.stringify(saved) !== JSON.stringify(expected)) throw new Error("Conflicting competitive resolution");
      return Boolean(saved);
    }, () => createRecord(ctx, battalionRankingTitle(expected), JSON.stringify(expected), attempt.date));
    records = await readResolutions(ctx);
  }
  const expected = expectedPlacement(ctx, records);
  if (expected) await ensureSaved(async () => Boolean(await readPlacement(ctx, records)), () => createRecord(ctx, placementTitle(expected), placementSummary(expected) + PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(expected), expected.recordDate));
  const verified = await getBattalionRankingsStatus();
  if (verified.state !== "current") throw new Error("Rankings source changed during reconciliation");
  return verified;
}

let active: Promise<Awaited<ReturnType<typeof reconcile>>> | null = null;
export function reconcileBattalionRankings() {
  if (!active) active = reconcile().finally(() => { active = null; });
  return active;
}
