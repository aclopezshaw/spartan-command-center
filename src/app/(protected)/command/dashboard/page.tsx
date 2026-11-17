import Image from "next/image";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import PageHeader from "@/app/components/PageHeader";
import { ATHENA_COMMAND } from "@/lib/command-assignment";
import { ATHENA_COMMAND_ROSTER } from "@/lib/command-school";
import { getLeadershipDashboard } from "@/lib/leadership-dashboard-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const button = "inline-block border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";
const panel = "border border-cyan-800/60 bg-black/50 p-4 sm:p-5";
const labels: Record<string, string> = { current: "Verified", held: "Standby", stale: "Refresh needed", recovery: "Recovery needed", unavailable: "Unavailable" };
const evaluationLabels: Record<string, string> = { active: "Ready for review", missed: "Awaiting review", upcoming: "Upcoming", cooldown: "Retry cooldown", "retry-ready": "Retry ready", "failed-terminal": "No retry days remain", "phase-ended": "Phase window ended" };

export default async function LeadershipDashboardPage() {
  const dashboard = await getLeadershipDashboard();
  const held = dashboard.state === "held";
  return (
    <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6"><NavBar />
        <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
          <PageHeader eyebrow="Athena Command · Battalion Operations" title="Leadership Dashboard" />
          <nav aria-label="Battalion command pages" className="mt-5 flex flex-wrap gap-3">
            {[{ href: "/command", label: "Command roster" }, { href: "/command/trust", label: "Company Trust" }, { href: "/command/cohesion", label: "Battalion Cohesion" }, { href: "/command/leaderboard", label: "Battalion Rankings" }].map(link => <Link key={link.href} href={link.href} className={button}>{link.label}</Link>)}
          </nav>

          <section className="mt-6 grid gap-6 border border-blue-800/60 bg-[radial-gradient(ellipse_at_left,rgba(30,64,175,0.18),rgba(0,0,0,0.65)_70%)] p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
            <Image src={ATHENA_COMMAND.patchPath} alt="Athena Command patch" width={170} height={170} priority className={`mx-auto h-36 w-36 object-contain ${held ? "opacity-50" : "drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]"}`} />
            <div><p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">{dashboard.state === "held" ? "Command Operations · Standby" : dashboard.state === "current" ? "Command Operations · Verified" : "Command Operations · Verification Needed"}</p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">{ATHENA_COMMAND.battalion.name}</h2>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-blue-200">{ATHENA_COMMAND.motto}</p>
              <p className="mt-4 text-xs leading-6 text-slate-400">{held ? "Awaiting Command Assignment and Phase III. Trust, Cohesion and standings begin only after command acceptance and launch. Current training readiness remains a separate reference." : dashboard.state === "current" ? "Four companies. One shared Battalion Cohesion score. Verified Trust, exercise outcomes and competitive standing in one command picture." : "Some command records are unavailable, changed or awaiting recovery. Verified sources remain visible; unverified values are withheld."}</p>
              <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-slate-500">{dashboard.today} · {dashboard.day ? dashboard.day > 56 ? "Phase III window complete" : `Phase III Day ${dashboard.day} / 56` : "Phase III has not started"}</p>
            </div>
          </section>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className={panel}><p className="text-[9px] uppercase tracking-[0.25em] text-cyan-400">Battalion Cohesion</p><p className="mt-4 text-3xl font-black">{dashboard.cohesion.score ?? "—"}<span className="text-sm text-slate-500"> / 100</span></p><p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">{labels[dashboard.cohesion.state]}</p><Link href="/command/cohesion" className="mt-4 inline-block text-[10px] text-blue-300">View shared score →</Link></article>
            <article className={panel}><p className="text-[9px] uppercase tracking-[0.25em] text-cyan-400">Exercises Passed</p><p className="mt-4 text-3xl font-black">{dashboard.cohesion.successes ?? "—"}<span className="text-sm text-slate-500"> / 8</span></p><p className="mt-2 text-[10px] text-slate-500">Failed attempts: {dashboard.cohesion.failures ?? "Unverified"}</p><Link href="/command/cohesion" className="mt-4 inline-block text-[10px] text-blue-300">View exercise record →</Link></article>
            <article className={panel}><p className="text-[9px] uppercase tracking-[0.25em] text-cyan-400">Battalion Standing</p><p className="mt-4 text-3xl font-black">{dashboard.rankings.rank ? `#${dashboard.rankings.rank}` : "—"}<span className="text-sm text-slate-500"> / 5</span></p><p className="mt-2 text-[10px] text-slate-500">{dashboard.rankings.points === null ? labels[dashboard.rankings.state] : `${dashboard.rankings.points}/32 pts · ${dashboard.rankings.wins} event wins`}</p><Link href="/command/leaderboard" className="mt-4 inline-block text-[10px] text-blue-300">View Battalion Rankings →</Link></article>
            <article className={panel}><p className="text-[9px] uppercase tracking-[0.25em] text-cyan-400">Company Morale</p><p className="mt-4 text-3xl font-black text-slate-600">—</p><p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">Reports unavailable</p><p className="mt-4 text-[10px] leading-5 text-slate-500">No morale assessment is inferred from Trust, habits or exercise results.</p></article>
          </div>

          <section className="mt-6"><div className="border-b border-cyan-900/60 pb-3"><p className="text-[9px] uppercase tracking-[0.3em] text-cyan-500">Company Status</p><h2 className="mt-2 text-lg font-black uppercase tracking-[0.08em]">Personnel Confidence & Training Reference</h2><p className="mt-2 text-xs leading-6 text-slate-500">Training references mirror your own Service Record readiness category. They do not measure the readiness of each company&apos;s personnel.</p></div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{dashboard.companies.map(company => {
              const commander = ATHENA_COMMAND_ROSTER.find(member => member.companyId === company.id);
              return <article key={company.id} className="border border-blue-900/70 bg-black/60 p-4"><p className="text-[9px] uppercase tracking-[0.25em] text-blue-400">{company.category}</p><h3 className="mt-2 text-lg font-black uppercase text-white">{company.name}</h3><p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-500">Command roster · {commander?.designation}</p>
                <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-slate-500">Company Trust</p><p className="mt-1 text-3xl font-black">{company.trust ?? "—"}<span className="text-sm text-slate-500"> / 100</span></p><p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-blue-300">{labels[company.state]}</p>
                {company.trend ? <p className="mt-3 text-xs text-cyan-300">{company.trend.direction === "up" ? "↑" : company.trend.direction === "down" ? "↓" : "→"} {company.trend.netChange > 0 ? "+" : ""}{company.trend.netChange} Trust · 7-day changes</p> : null}
                <div className="mt-4 border-t border-slate-800 pt-3"><p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Your {company.category} Readiness</p><p className="mt-2 text-xl font-bold text-slate-300">{company.readiness ?? "Unavailable"}</p></div>
                {company.unreviewedDays ? <p className="mt-3 text-[10px] leading-5 text-amber-200">{company.unreviewedDays} recent day(s) need complete or reviewed evidence.</p> : null}
                {company.dailyGuidance ? <p className="mt-3 text-[10px] leading-5 text-slate-400">{company.dailyGuidance}</p> : null}
                {company.weeklyGuidance ? <p className="mt-3 text-[10px] leading-5 text-slate-500">{company.weeklyGuidance}</p> : null}
                <Link href={company.href} className={`${button} mt-5 text-[9px]`}>Review company Trust</Link>
              </article>;
            })}</div>
          </section>

          <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className={panel}><h2 className="border-b border-cyan-900/60 pb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Command Attention</h2>
              {dashboard.concerns.length ? <ul className="mt-4 space-y-4">{dashboard.concerns.map(concern => <li key={concern.id} className="border-l-2 border-amber-700 bg-amber-950/10 p-3"><p className="text-[8px] uppercase tracking-[0.2em] text-amber-400">{concern.scope === "company" ? "Company concern" : "Battalion concern"}</p><h3 className="mt-2 text-xs font-bold text-slate-200">{concern.title}</h3><p className="mt-2 text-[11px] leading-6 text-slate-400">{concern.detail}</p><Link href={concern.href} className="mt-3 inline-block text-[10px] text-cyan-300">{concern.action} →</Link></li>)}</ul> : <p className="mt-4 text-xs leading-6 text-slate-500">{dashboard.concernsVerified ? "No concerns flagged by the available Trust and event records. Morale reports remain unavailable." : held ? "Operational concerns will be evaluated after command acceptance and Phase III launch." : "No complete verified concern assessment is available yet."}</p>}
            </section>
            <section className={panel}><h2 className="border-b border-cyan-900/60 pb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Upcoming Evaluations</h2>
              {dashboard.evaluations.length ? <ol className="mt-4 space-y-4">{dashboard.evaluations.map(event => <li key={event.id} className="border border-slate-800 bg-slate-950/50 p-3"><p className="text-[8px] uppercase tracking-[0.2em] text-blue-300">Day {event.day} · {evaluationLabels[event.status] ?? event.status}</p><h3 className="mt-2 text-xs font-black uppercase tracking-[0.08em]">{event.title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{event.requirement}</p></li>)}</ol> : <p className="mt-4 text-xs leading-6 text-slate-500">{held ? "The live evaluation schedule appears after Phase III starts." : dashboard.cohesion.successes === 8 ? "All eight exercises have been passed. Final placement remains subject to the phase-end boundary." : "Evaluation status is unavailable until event evidence verifies."}</p>}
              <Link href="/command-hud" className={`${button} mt-5`}>Open Command HUD</Link>
            </section>
          </div>

          <section className={`${panel} mt-6`}><div className="flex flex-wrap justify-between gap-3 border-b border-cyan-900/60 pb-3"><h2 className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Recent Command Changes</h2><p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Verified Trust & Cohesion · Newest Dates First</p></div>
            {dashboard.changes.length ? <ul className="mt-4 grid gap-4 md:grid-cols-2">{dashboard.changes.map(change => <li key={change.id} className="border border-slate-800 bg-slate-950/50 p-3"><p className="text-[8px] uppercase tracking-[0.2em] text-blue-300">{change.weekly ? "Week of " : ""}{change.date} · {change.scope}</p><p className={`mt-2 text-sm font-bold ${change.delta < 0 ? "text-amber-300" : "text-cyan-300"}`}>{change.delta > 0 ? "+" : ""}{change.delta} → {change.balance}/100</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{change.explanation}</p><Link href={change.href} className="mt-3 inline-block text-[10px] text-cyan-300">View evidence →</Link></li>)}</ul> : <p className="mt-4 text-xs leading-6 text-slate-500">{held ? "No Phase III command changes accrue during intermission." : "No verified Trust or Cohesion changes are available to display."}</p>}
          </section>
        </section>
      </div>
    </main>
  );
}
