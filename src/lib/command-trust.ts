import { addDaysToDateKey, differenceInDateKeys } from "./date.ts";

export const COMMAND_TRUST_VERSION = 1;
export const COMMAND_TRUST_COMPANIES = [
  { id: "alpha-company", name: "Alpha Company", category: "Physical", daily: ["Water", "Steps", "Stretch"], weekly: "Workouts" },
  { id: "bravo-company", name: "Bravo Company", category: "Intelligence", daily: ["Study", "Read"], weekly: "SMU Classwork" },
  { id: "charlie-company", name: "Charlie Company", category: "Recovery", daily: ["Sleep", "Meds"], weekly: "Shot" },
  { id: "delta-company", name: "Delta Company", category: "Professional", daily: ["Teeth", "Shower"], weekly: "Planning" },
] as const;

export type TrustDay = { id: string; date: string; review: "Pending" | "Confirmed" | "Excused"; habits: Record<string, boolean> };
export type TrustWeek = { id: string; date: string; habits: Record<string, boolean> };
export type TrustInput = { phaseId: string; start: string; end: string; today: string; days: TrustDay[]; weeks: TrustWeek[] };
export type TrustEntry = {
  operationId: string; companyId: string; date: string;
  rule: "initial" | "daily" | "weekly" | "neglect";
  sourceId: string; sourceProperties: readonly string[];
  requestedDelta: number; delta: number; balance: number; explanation: string;
};

function assertDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || addDaysToDateKey(date, 0) !== date) throw new Error("Invalid Trust date");
}

export function trustWeekStart(date: string) {
  assertDate(date);
  return addDaysToDateKey(date, -new Date(`${date}T12:00:00Z`).getUTCDay());
}

/** Replays evidence chronologically, including bounded gains and capped losses. */
export function evaluateCommandTrust(input: TrustInput) {
  for (const date of [input.start, input.end, input.today]) assertDate(date);
  const length = differenceInDateKeys(input.start, input.end) + 1;
  if (length < 1 || length > 366 || input.today < input.start) throw new Error("Trust phase is not evaluable");
  const through = input.today < input.end ? input.today : input.end;
  const days = new Map<string, TrustDay>();
  const weeks = new Map<string, TrustWeek>();
  for (const day of input.days) {
    assertDate(day.date);
    if (days.has(day.date)) throw new Error("Duplicate Trust daily evidence");
    if (!["Pending", "Confirmed", "Excused"].includes(day.review)) throw new Error("Invalid Trust review");
    days.set(day.date, day);
  }
  for (const week of input.weeks) {
    if (trustWeekStart(week.date) !== week.date || weeks.has(week.date)) throw new Error("Invalid or duplicate Trust weekly evidence");
    weeks.set(week.date, week);
  }
  const entries: TrustEntry[] = [];
  const companies = COMMAND_TRUST_COMPANIES.map(company => {
    let balance = 0;
    let neglectStreak = 0;
    let lastWeek = "";
    let weeklyLoss = 0;
    const creditedWeeks = new Set<string>();
    function apply(rule: TrustEntry["rule"], date: string, requestedDelta: number, sourceId: string, sourceProperties: readonly string[], explanation: string) {
      const next = Math.max(0, Math.min(100, balance + requestedDelta));
      entries.push({ operationId: `command-trust:v1:${input.phaseId}:${company.id}:${rule}:${date}`, companyId: company.id, date, rule, sourceId, sourceProperties, requestedDelta, delta: next - balance, balance: next, explanation });
      balance = next;
    }
    apply("initial", input.start, 50, input.phaseId, [], "Initial company confidence on Phase III Day 1");
    for (let date = input.start; date <= through; date = addDaysToDateKey(date, 1)) {
      const weekStart = trustWeekStart(date);
      if (weekStart !== lastWeek) { weeklyLoss = 0; lastWeek = weekStart; }
      const day = days.get(date);
      const completeEvidence = day && company.daily.every(habit => typeof day.habits[habit] === "boolean");
      const completed = completeEvidence ? company.daily.filter(habit => day.habits[habit]).length : 0;
      if (completeEvidence && day.review !== "Excused") {
        const gain = completed === company.daily.length ? 2 : completed >= Math.ceil(company.daily.length / 2) ? 1 : 0;
        if (gain) apply("daily", date, gain, day.id, company.daily, `${completed}/${company.daily.length} associated daily habits completed`);
      }
      // Current days can earn gains, but never extend a missed-day streak.
      if (date < input.today && completeEvidence && day.review === "Confirmed" && completed === 0) {
        neglectStreak += 1;
        if (neglectStreak >= 3 && weeklyLoss < 3) {
          apply("neglect", date, -1, day.id, company.daily, `${neglectStreak} consecutive confirmed zero-completion days; weekly neglect cap 3`);
          weeklyLoss += 1;
        }
      } else neglectStreak = 0;
      const week = weeks.get(weekStart);
      // Credit a weekly objective once, at the end of the evaluated portion of its week.
      // A partial first week is excluded: pre-phase weekly work cannot earn Trust.
      if (week && weekStart >= input.start && !creditedWeeks.has(weekStart) && (date === through || trustWeekStart(addDaysToDateKey(date, 1)) !== weekStart)) {
        creditedWeeks.add(weekStart);
        if (week.habits[company.weekly] === true) apply("weekly", weekStart, 2, week.id, [company.weekly], "Associated weekly objective completed; +2 Trust independently of XP");
      }
    }
    return { id: company.id, name: company.name, category: company.category, trust: balance, neglectStreak, weeklyNeglectLoss: weeklyLoss };
  });
  return { version: COMMAND_TRUST_VERSION, phaseId: input.phaseId, through, companies, entries };
}
