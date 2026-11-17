import Link from "next/link";
import Image from "next/image";
import NavBar from "@/app/components/NavBar";
import PageHeader from "@/app/components/PageHeader";
import BattalionCohesionControls from "@/app/components/BattalionCohesionControls";
import { getBattalionCohesionStatus } from "@/lib/battalion-cohesion-store";
import { ATHENA_COMMAND } from "@/lib/command-assignment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BattalionCohesionPage() {
  let status;
  try { status = await getBattalionCohesionStatus(); }
  catch { status = { state: "conflict", ledger: null }; }
  const ledger = status.ledger;
  return <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6"><NavBar />
      <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
        <PageHeader eyebrow="Athena Command · Battalion Coordination" title="Battalion Cohesion" />
        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">One shared score for how effectively Alpha, Bravo, Charlie and Delta work together as Athena Training Battalion.</p>
        <nav aria-label="Battalion command pages" className="mt-5 flex flex-wrap gap-3">
          <Link href="/command/dashboard" className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">Leadership Dashboard</Link>
          <Link href="/command" className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">Command roster</Link>
          <Link href="/command/trust" className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">Company Trust</Link>
          <Link href="/command/leaderboard" className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">Battalion Rankings</Link>
        </nav>
        {status.state === "held" ? <div className="mt-6 grid min-h-[420px] place-items-center border border-blue-900/60 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.16),rgba(0,0,0,0.92)_65%)] p-6 text-center sm:p-10">
          <div className="max-w-xl">
            <Image src={ATHENA_COMMAND.patchPath} alt="Athena Command patch — awaiting activation" width={150} height={150} className="mx-auto h-32 w-32 object-contain opacity-30 grayscale" />
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.35em] text-blue-400">Battalion Operations · Standby</p>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">Awaiting Command Assignment and Phase III</h2>
            <p className="mt-3 text-xs leading-6 text-slate-400 sm:text-sm">Cohesion begins at 50/100 after you accept command and Phase III goes live. Intermission creates no score or penalties.</p>
          </div>
        </div> : !ledger ? <div role="status" className="mt-6 border border-amber-700 p-5 text-sm leading-6 text-amber-200">
          {status.state === "recovery" ? "A saved event review needs recovery. Cohesion stays unavailable until its event outcome verifies." : "Cohesion records could not be verified. Resolve conflicting or unavailable evidence before trusting the score."}
          <BattalionCohesionControls />
        </div> : <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="border border-cyan-800/60 bg-black/50 p-5"><h2 className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Battalion Cohesion</h2><p className="mt-4 text-4xl font-black">{ledger.score}<span className="text-lg text-slate-500"> / 100</span></p><progress aria-label="Battalion Cohesion" value={ledger.score} max={100} className="mt-4 h-2 w-full accent-cyan-400" /><p className="mt-3 text-xs text-slate-500">Starting baseline: 50</p></article>
            <article className="border border-cyan-800/60 bg-black/50 p-5"><h2 className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Exercises passed</h2><p className="mt-4 text-4xl font-black">{ledger.successes}<span className="text-lg text-slate-500"> / 8</span></p><p className="mt-3 text-xs leading-5 text-slate-500">Each exercise awards success points once.</p></article>
            <article className="border border-cyan-800/60 bg-black/50 p-5"><h2 className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Failed attempts</h2><p className="mt-4 text-4xl font-black">{ledger.failures}</p><p className="mt-3 text-xs leading-5 text-slate-500">Every actual failed review deducts points.</p></article>
          </div>
          <section className="mt-6 border border-cyan-800/60 bg-black/50 p-5"><h2 className="border-b border-cyan-900/60 pb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Event history</h2>
            {!ledger.entries.length ? <p className="mt-4 text-sm text-slate-400">No exercises reviewed yet. Cohesion starts from 50.</p> : <ol className="mt-4 space-y-4">{ledger.entries.slice().reverse().map(entry => <li key={`${entry.eventPageId}:${entry.attempt}`} className="border-t border-slate-800 pt-3 text-xs leading-6">
              <p className="font-black uppercase tracking-[0.08em] text-slate-200">{entry.eventTitle} · Attempt {entry.attempt}</p>
              <p className="text-slate-400">{entry.date} · Day {entry.campaignDay} · {entry.outcome === "success" ? "Passed" : "Failed"}</p>
              <p className={entry.delta < 0 ? "text-amber-300" : "text-cyan-300"}>{entry.delta >= 0 ? "+" : ""}{entry.delta} Cohesion → {entry.balance}/100{entry.delta !== entry.requestedDelta ? ` (bounded from ${entry.requestedDelta > 0 ? "+" : ""}${entry.requestedDelta})` : ""}</p>
              {entry.outcome === "failure" ? <p className="text-slate-500">{entry.retry.availableDay ? `Retry authorized on Day ${entry.retry.availableDay}. A pass earns the normal ${entry.eventType === "Major Event" ? "+10" : "+5"}; earlier deductions remain.` : "No retry days remain for this exercise. Cohesion does not erase completed events or earned XP."}</p> : null}
            </li>)}</ol>}
          </section>
        </>}
        <section aria-labelledby="cohesion-rules-title" className="mt-6 border border-cyan-800/60 bg-black/50 p-4 sm:p-5">
          <h2 id="cohesion-rules-title" className="border-b border-cyan-900/60 pb-3 text-xs uppercase tracking-[0.3em] text-cyan-400">Exercise scoring</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="border border-slate-800 bg-slate-950/60 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-300">Minor Exercise</p><p className="mt-3 text-xl font-black"><span className="text-cyan-300">+5</span><span className="mx-2 text-slate-600">/</span><span className="text-amber-300">−5</span></p><p className="mt-2 text-[10px] leading-5 text-slate-500">Pass / each failed attempt</p></div>
            <div className="border border-slate-800 bg-slate-950/60 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-300">Major Exercise</p><p className="mt-3 text-xl font-black"><span className="text-cyan-300">+10</span><span className="mx-2 text-slate-600">/</span><span className="text-amber-300">−10</span></p><p className="mt-2 text-[10px] leading-5 text-slate-500">Pass / each failed attempt</p></div>
            <div className="border border-slate-800 bg-slate-950/60 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-300">Score Limits</p><p className="mt-3 text-xl font-black text-slate-200">0–100</p><p className="mt-2 text-[10px] leading-5 text-slate-500">Starting baseline: 50</p></div>
          </div>
          <p className="mt-4 text-[11px] leading-6 text-slate-500">Habits affect Company Trust. Cohesion tracks exercise outcomes separately from Trust, Fireteam relationships, XP and leaderboard points. A successful retry earns its normal points without an extra refund.</p>
        </section>
      </section>
    </div>
  </main>;
}
