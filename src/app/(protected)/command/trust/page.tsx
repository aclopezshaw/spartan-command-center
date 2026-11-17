import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import PageHeader from "@/app/components/PageHeader";
import CommandTrustControls from "@/app/components/CommandTrustControls";
import { getCommandTrustStatus } from "@/lib/command-trust-store";
import { COMMAND_TRUST_COMPANIES } from "@/lib/command-trust";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandTrustPage() {
  let trust;
  try { trust = await getCommandTrustStatus(); }
  catch { trust = { state: "conflict", ledger: null, insights: null, days: [] }; }
  return <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6"><NavBar />
      <section className="border border-cyan-600/60 bg-slate-950/90 p-4 sm:p-6">
        <PageHeader eyebrow="Athena Command · Company Confidence" title="Command Trust" />
        <p className="mt-5 text-sm leading-6 text-slate-400">Each company&apos;s personnel collectively assess their confidence in you as Battalion Commander.</p>
        {trust.state === "held" ? <div className="mt-6 border border-blue-900 p-6 text-center">
          <h2 className="text-xl font-bold">Awaiting Command Assignment and Phase III</h2>
          <p className="mt-3 text-sm text-slate-400">Trust starts at 50 per company on Phase III Day 1 after you accept command. Intermission accrues no gains or penalties.</p>
          <Link href="/assembly-hall" className="mt-4 inline-block text-xs text-cyan-300">Assembly Hall</Link>
        </div> : <>
          {trust.state !== "current" ? <p role="status" className="mt-5 border border-amber-700 p-4 text-sm text-amber-200">{trust.state === "conflict" ? "Trust evidence could not be verified. Resolve conflicting or unavailable records, then refresh." : "Habit records have changed or the ledger needs initialization. Refresh Trust to verify current balances."}</p> : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{COMMAND_TRUST_COMPANIES.map(company => {
            const state = trust.ledger?.companies.find(c => c.id === company.id);
            const insight = trust.insights?.find(item => item.companyId === company.id);
            return <article id={company.id} key={company.id} className="scroll-mt-6 border border-blue-900 bg-black/60 p-4">
              <h2 className="font-bold uppercase text-blue-300">{company.name}</h2>
              <p className="mt-1 text-xs text-slate-400">{company.category}</p>
              <p className="mt-5 text-3xl font-bold">{state ? `${state.trust} / 100` : "Unverified"}</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">{company.daily.join(" · ")}<br />Weekly: {company.weekly}</p>
              {insight ? <div className="mt-4 space-y-4 text-xs leading-5">
                <div className="border-t border-slate-800 pt-3">
                  <p className="font-bold text-cyan-200">{insight.trend.direction === "up" ? "↑ Rising" : insight.trend.direction === "down" ? "↓ Falling" : "→ Unchanged"} · {insight.trend.netChange > 0 ? "+" : ""}{insight.trend.netChange} Trust</p>
                  <p className="text-slate-500">Attributed changes · {insight.trend.from} to {insight.trend.through}</p>
                </div>
                <div className="border-l-2 border-amber-700 pl-3">
                  <p className="font-bold text-slate-200">{insight.risk === "at_risk" ? "Neglect approaching" : insight.risk === "neglect" ? "Neglect active" : insight.risk === "weekly_cap" ? "Weekly loss limit reached" : insight.risk === "phase_ended" ? "Phase window ended" : insight.risk === "watch" ? "One confirmed zero day" : "No verified neglect streak"}</p>
                  <p className="mt-1 text-slate-400">{insight.riskExplanation}</p>
                  <p className="mt-2 text-slate-500">Finished-day streak: {insight.closedDayStreak} · Weekly loss slots used: {insight.weeklyLoss}/3</p>
                  {insight.unreviewedDays > 0 ? <p className="mt-2 text-amber-200">{insight.unreviewedDays} recent finished day(s) need review or complete evidence. No neglect is inferred from them.</p> : null}
                </div>
                <div>
                  <p className="font-bold text-cyan-300">Next opportunity</p>
                  <p className="mt-1 text-slate-400">{insight.dailyGuidance}</p>
                  <p className="mt-2 text-slate-400">{insight.weeklyGuidance}</p>
                </div>
              </div> : null}
            </article>;
          })}</div>
          {trust.insights ? <p className="mt-4 text-xs leading-5 text-slate-500">Trends sum applied ledger changes in the displayed window and exclude the initial 50 points. Weekly gains are attributed to their Sunday Week Start, rather than an inferred homework completion date. Missing evidence is not proof of missed work. Trust tiers and their thresholds await approval.</p> : null}
          <CommandTrustControls days={trust.days} />
          {trust.ledger ? <section className="mt-6 border border-slate-800 p-4">
            <h2 className="text-sm font-bold text-cyan-300">Recent Trust changes</h2>
            <p className="mt-2 text-xs text-slate-500">Trust points are separate from XP. Each row shows the applied change after bounds.</p>
            <ul className="mt-4 space-y-3">{[...trust.ledger.entries].sort((a, b) => b.date.localeCompare(a.date) || a.companyId.localeCompare(b.companyId)).slice(0, 24).map(entry => <li key={entry.operationId} className="border-t border-slate-800 pt-2 text-xs leading-5">
              {entry.rule === "weekly" ? "Week of " : ""}{entry.date} · {COMMAND_TRUST_COMPANIES.find(c => c.id === entry.companyId)?.name} · {entry.delta >= 0 ? "+" : ""}{entry.delta} Trust → {entry.balance}<br /><span className="text-slate-400">{entry.explanation}</span><br /><span className="text-slate-500">Rule: {entry.rule} · Evidence: {entry.sourceProperties.join(", ") || "Phase III command assignment"}</span>
            </li>)}</ul>
          </section> : null}
        </>}
      </section>
    </div>
  </main>;
}
