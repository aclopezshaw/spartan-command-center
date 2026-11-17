import "server-only";
import { createHash } from "node:crypto";
import type { PageObjectResponse, QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints";
import { getNotionClient, getRequiredNotionId } from "@/lib/notion-client";
import { collectNotionPages } from "@/lib/notion-pagination";
import { resolveNotionDataSourceId } from "@/lib/notion-data-source";
import { getAlexServiceRecordPageId, getCommandAssignmentStatus } from "@/lib/notion";
import { addDaysToDateKey, getOperationalDateKey } from "@/lib/date";
import { COMMAND_TRUST_COMPANIES, evaluateCommandTrust, type TrustDay, type TrustInput } from "@/lib/command-trust";
import { ensureCommandTrustSnapshot } from "@/lib/command-trust-snapshot";
import { buildCommandTrustInsights } from "@/lib/command-trust-insights";

const PREFIX = "Command Trust · v1 ·";
type Ledger = ReturnType<typeof evaluateCommandTrust>;
type Envelope = { evidence: TrustInput; ledger: Ledger };

async function query(dataSourceId: string, filter: QueryDataSourceParameters["filter"]) {
  return (await collectNotionPages(cursor => getNotionClient().dataSources.query({ data_source_id: dataSourceId, filter, start_cursor: cursor }))).filter((page): page is PageObjectResponse => "properties" in page);
}
function text(page: PageObjectResponse, name: string) {
  const prop = page.properties[name];
  return prop?.type === "rich_text" ? prop.rich_text.map(t => t.plain_text).join("") : "";
}
function date(page: PageObjectResponse, name: string) {
  const prop = page.properties[name];
  return prop?.type === "date" ? prop.date?.start?.slice(0, 10) : undefined;
}
function habits(page: PageObjectResponse, names: readonly string[]) {
  return Object.fromEntries(names.flatMap(name => {
    const prop = page.properties[name];
    return prop?.type === "checkbox" ? [[name, prop.checkbox]] : [];
  }));
}

async function context() {
  const assignment = await getCommandAssignmentStatus();
  if (assignment.state !== "completed" || !assignment.persisted.commandTrustUnlockedAt) return null;
  const phaseId = assignment.eligibility.evidence.targetPhaseId;
  if (!phaseId) return null;
  const phase = await getNotionClient().pages.retrieve({ page_id: phaseId });
  if (!("properties" in phase)) throw new Error("Trust phase unavailable");
  const status = phase.properties["Phase Status"];
  const number = phase.properties["Phase Number"];
  const length = phase.properties["Phase Length"];
  const start = date(phase, "Phase Start Date");
  const today = getOperationalDateKey();
  if (status?.type !== "select" || status.select?.name !== "Active" || number?.type !== "number" || number.number !== 3 || !start || start > today) return null;
  if (length?.type !== "number" || !Number.isInteger(length.number) || !length.number || length.number > 366) throw new Error("Invalid Trust phase length");
  const assignedAt = assignment.persisted.assignedAt?.slice(0, 10);
  const unlockedAt = assignment.persisted.commandTrustUnlockedAt.slice(0, 10);
  if (!assignedAt || assignedAt > start || unlockedAt > start) throw new Error("Command acceptance must precede Phase III start");
  const serviceId = await getAlexServiceRecordPageId();
  if (!serviceId) throw new Error("Trust Service Record unavailable");
  const end = addDaysToDateKey(start, length.number - 1);
  return { phaseId, start, end, today, serviceId };
}

async function evidence(ctx: NonNullable<Awaited<ReturnType<typeof context>>>) {
  const through = ctx.today < ctx.end ? ctx.today : ctx.end;
  const filter = (property: string, relation: string): QueryDataSourceParameters["filter"] => ({ and: [
    { property, date: { on_or_after: ctx.start } },
    { property, date: { on_or_before: through } },
    { property: relation, relation: { contains: ctx.serviceId } },
  ] });
  const [daily, weekly] = await Promise.all([
    query(getRequiredNotionId("DAILY_SITREP_DATA_SOURCE_ID"), filter("Mission Date", "Spartan")),
    query(getRequiredNotionId("WEEKLY_OPERATIONS_DATABASE_ID"), filter("Week Start", "🪖 Service Record")),
  ]);
  const days = daily.map(page => {
    const review = page.properties["Command Trust Day"];
    const value = review?.type === "select" ? review.select?.name : null;
    if (value && !["Pending", "Confirmed", "Excused"].includes(value)) throw new Error("Invalid Trust day review");
    return { id: page.id, date: date(page, "Mission Date")!, review: (value ?? "Pending") as TrustDay["review"], habits: habits(page, COMMAND_TRUST_COMPANIES.flatMap(c => [...c.daily])) };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const weeks = weekly.map(page => ({ id: page.id, date: date(page, "Week Start")!, habits: habits(page, COMMAND_TRUST_COMPANIES.map(c => c.weekly)) })).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { phaseId: ctx.phaseId, start: ctx.start, end: ctx.end, today: ctx.today, days, weeks };
}

async function historySource() {
  return resolveNotionDataSourceId(getNotionClient(), getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID"));
}
function serialize(envelope: Envelope) { return JSON.stringify(envelope); }
function identity(envelope: Envelope) { return `${PREFIX} ${envelope.ledger.phaseId} · ${createHash("sha256").update(serialize(envelope)).digest("hex")}`; }
async function matching(ctx: NonNullable<Awaited<ReturnType<typeof context>>>, envelope: Envelope) {
  const pages = await query(await historySource(), { and: [
    { property: "Title", title: { equals: identity(envelope) } },
    { property: "Related Service Record", relation: { contains: ctx.serviceId } },
    { property: "Related Campaign", relation: { contains: ctx.phaseId } },
    { property: "Entry Type", select: { equals: "System" } },
  ] });
  if (pages.length > 1) throw new Error("Duplicate Command Trust snapshot requires reconciliation");
  if (pages[0]) {
    const xp = pages[0].properties["XP Awarded"];
    if (text(pages[0], "Description") !== serialize(envelope) || xp?.type !== "number" || xp.number !== 0) throw new Error("Invalid Command Trust snapshot requires reconciliation");
  }
  return pages[0] ?? null;
}

/** GET never writes. A mismatched evidence snapshot is explicitly stale. */
export async function getCommandTrustStatus() {
  const ctx = await context();
  if (!ctx) return { state: "held" as const, ledger: null, insights: null, days: [] };
  const input = await evidence(ctx);
  const ledger = evaluateCommandTrust(input);
  const page = await matching(ctx, { evidence: input, ledger });
  return { state: page ? "current" as const : "stale" as const, ledger: page ? ledger : null, insights: page ? buildCommandTrustInsights(input, ledger) : null, days: input.days.map(d => ({ date: d.date, review: d.review, canReview: d.date < ctx.today })), phaseStart: ctx.start };
}

async function reconcile() {
  const ctx = await context();
  if (!ctx) return { state: "held" as const, ledger: null, insights: null, days: [] };
  const input = await evidence(ctx);
  const envelope = { evidence: input, ledger: evaluateCommandTrust(input) };
  await ensureCommandTrustSnapshot({ read: async () => Boolean(await matching(ctx, envelope)), create: async () => {
    const payload = serialize(envelope);
    const chunks = payload.match(/[\s\S]{1,1900}/g) ?? [];
    if (chunks.length > 100) throw new Error("Trust evidence exceeds snapshot capacity");
    await getNotionClient().pages.create({ parent: { data_source_id: await historySource() }, properties: {
      Title: { title: [{ text: { content: identity(envelope) } }] },
      Description: { rich_text: chunks.map(content => ({ text: { content } })) },
      Date: { date: { start: getOperationalDateKey() } },
      "Entry Type": { select: { name: "System" } },
      "XP Awarded": { number: 0 },
      "Readiness Category": { select: { name: "None" } },
      "Related Service Record": { relation: [{ id: ctx.serviceId }] },
      "Related Campaign": { relation: [{ id: ctx.phaseId }] },
    } });
  } });
  // Fresh evidence read prevents a concurrent source edit from appearing current.
  const status = await getCommandTrustStatus();
  if (status.state !== "current") throw new Error("Trust evidence changed during reconciliation; refresh and retry");
  return status;
}

let active: Promise<Awaited<ReturnType<typeof reconcile>>> | null = null;
export function reconcileCommandTrust() {
  if (!active) active = reconcile().finally(() => { active = null; });
  return active;
}

export async function reviewCommandTrustDay(day: string, review: TrustDay["review"]) {
  const ctx = await context();
  if (!ctx || day < ctx.start || day > ctx.end || day >= ctx.today || !/^\d{4}-\d{2}-\d{2}$/.test(day) || addDaysToDateKey(day, 0) !== day || !["Confirmed", "Excused", "Pending"].includes(review)) throw new Error("Only a completed Phase III day can be reviewed");
  const pages = await query(getRequiredNotionId("DAILY_SITREP_DATA_SOURCE_ID"), { and: [
    { property: "Mission Date", date: { equals: day } },
    { property: "Spartan", relation: { contains: ctx.serviceId } },
  ] });
  if (pages.length !== 1) throw new Error("Trust day requires exactly one owned Daily SITREP");
  await getNotionClient().pages.update({ page_id: pages[0].id, properties: { "Command Trust Day": { select: { name: review } } } });
  const saved = await getNotionClient().pages.retrieve({ page_id: pages[0].id });
  const prop = "properties" in saved ? saved.properties["Command Trust Day"] : null;
  if (prop?.type !== "select" || prop.select?.name !== review) throw new Error("Trust day review did not verify");
  return reconcileCommandTrust();
}
