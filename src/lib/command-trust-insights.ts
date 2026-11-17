import { addDaysToDateKey } from "./date.ts";
import {
  COMMAND_TRUST_COMPANIES,
  trustWeekStart,
  type evaluateCommandTrust,
  type TrustInput,
} from "./command-trust.ts";

type Ledger = ReturnType<typeof evaluateCommandTrust>;

/** Read-only guidance, derived only after the source-matched ledger verifies. */
export function buildCommandTrustInsights(input: TrustInput, ledger: Ledger) {
  const days = new Map(input.days.map(day => [day.date, day]));
  const weekStart = trustWeekStart(input.today);
  const recentStart = addDaysToDateKey(ledger.through, -6);
  const windowStart = recentStart > input.start ? recentStart : input.start;
  const lastClosed = input.today <= input.end
    ? addDaysToDateKey(input.today, -1)
    : input.end;

  return COMMAND_TRUST_COMPANIES.map(company => {
    const state = ledger.companies.find(item => item.id === company.id);
    if (!state || ledger.phaseId !== input.phaseId) {
      throw new Error("Trust insights require the matching company ledger");
    }
    const entries = ledger.entries.filter(entry => entry.companyId === company.id);
    const recent = entries.filter(entry => entry.rule !== "initial" && entry.date >= windowStart && entry.date <= ledger.through);
    const netChange = recent.reduce((sum, entry) => sum + entry.delta, 0);
    const weeklyLoss = entries.filter(entry => entry.rule === "neglect" && trustWeekStart(entry.date) === weekStart).length;
    let closedDayStreak = 0;
    for (let date = lastClosed; date >= input.start; date = addDaysToDateKey(date, -1)) {
      const day = days.get(date);
      if (!day || day.review !== "Confirmed" || !company.daily.every(habit => day.habits[habit] === false)) break;
      closedDayStreak++;
    }
    let unreviewedDays = 0;
    for (let date = windowStart; date <= lastClosed; date = addDaysToDateKey(date, 1)) {
      const day = days.get(date);
      if (!day || day.review !== "Excused" && (day.review === "Pending" || !company.daily.every(habit => typeof day.habits[habit] === "boolean"))) unreviewedDays++;
    }
    const today = days.get(input.today);
    const todayAvailable = Boolean(today && company.daily.every(habit => typeof today.habits[habit] === "boolean"));
    const completed = todayAvailable ? company.daily.filter(habit => today!.habits[habit]).length : 0;
    const todayProtected = today?.review === "Excused";
    const interruptedToday = todayAvailable && completed > 0 || todayProtected;
    const streak = interruptedToday ? 0 : closedDayStreak;
    const phaseEnded = input.today > input.end;
    const risk = phaseEnded ? "phase_ended" : weeklyLoss >= 3 ? "weekly_cap" : streak >= 3 ? "neglect" : streak === 2 ? "at_risk" : streak === 1 ? "watch" : "clear";
    const riskExplanation = {
      phase_ended: "The phase window has ended. New habit days cannot change this phase's Trust.",
      weekly_cap: "This week's three-point neglect limit is reached. Normal habit gains can still rebuild Trust.",
      neglect: "A confirmed zero-completion streak is active. Completing any associated daily habit breaks it. Today cannot incur a deduction while unfinished.",
      at_risk: "Two finished days were confirmed with zero associated habits. Another confirmed zero day would start neglect, subject to the weekly cap.",
      watch: "One finished day was confirmed with zero associated habits. That isolated day has no deduction.",
      clear: interruptedToday ? "Today's recorded completion or excusal breaks the neglect streak." : "No consecutive confirmed zero-completion streak is established. Missing or pending days are not missed-day evidence.",
    }[risk];
    const minimum = Math.ceil(company.daily.length / 2);
    const remaining = company.daily.filter(habit => today?.habits[habit] !== true);
    let dailyGuidance: string;
    if (phaseEnded) dailyGuidance = "Review or correct past evidence as needed; the phase window is closed to new days.";
    else if (todayProtected) dailyGuidance = "Today is excused: no daily Trust gain or neglect penalty applies.";
    else if (!todayAvailable) dailyGuidance = "Today's associated habit evidence is unavailable. Record it before estimating daily Trust gains.";
    else if (state.trust === 100) dailyGuidance = "Trust is at its 100-point cap. Continue the daily standard; additional gains cannot exceed 100.";
    else if (completed === company.daily.length) dailyGuidance = "All associated daily habits are complete. Today's +2 total is already included, subject to the 100-point cap.";
    else if (completed >= minimum) dailyGuidance = `Today's +1 is included. Complete ${remaining.join(", ")} to reach +2 total, subject to the 100-point cap.`;
    else dailyGuidance = `Complete ${minimum - completed} more associated daily habit${minimum - completed === 1 ? "" : "s"} for +1 Trust; all ${company.daily.length} earn +2 total. Any one completion breaks neglect.`;
    const week = input.weeks.find(item => item.date === weekStart);
    const weeklyGuidance = phaseEnded ? "No new training weeks can earn Trust for this phase."
      : weekStart < input.start ? "Weekly Trust begins with the first Sunday-start week on or after Phase III Day 1."
      : !week || typeof week.habits[company.weekly] !== "boolean" ? "This week's objective evidence is unavailable; no completion is assumed."
      : week.habits[company.weekly] ? `${company.weekly} is complete: this week's +2 Trust is included, subject to the cap.`
      : `Complete ${company.weekly} for +2 Trust once this week, subject to the cap.`;
    return {
      companyId: company.id,
      trend: { direction: netChange > 0 ? "up" : netChange < 0 ? "down" : "flat", netChange, from: windowStart, through: ledger.through },
      risk, riskExplanation, closedDayStreak, unreviewedDays, weeklyLoss,
      dailyGuidance, weeklyGuidance,
      remainingDailyHabits: remaining,
    };
  });
}
