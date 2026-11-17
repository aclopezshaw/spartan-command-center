import Image from "next/image";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import PageHeader from "@/app/components/PageHeader";
import BattalionRankingsControls from "@/app/components/BattalionRankingsControls";
import { getBattalionRankingsStatus } from "@/lib/battalion-rankings-store";
import { BATTALIONS, type BattalionStandingId } from "@/lib/battalion-rankings";
import { ATHENA_COMMAND } from "@/lib/command-assignment";
import { BATTALION_INSIGNIA } from "@/lib/battalion-insignia";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function IdentityBadge({ id }: { id: BattalionStandingId }) {
  if (id === "athena") return <Image src={ATHENA_COMMAND.patchPath} alt="Athena Command identity" width={76} height={76} className="h-[76px] w-[76px] object-contain" />;
  return <Image src={BATTALION_INSIGNIA[id].path} alt={`${BATTALIONS.find(item => item.id === id)?.name} patch`} width={76} height={76} className="h-[76px] w-[76px] object-contain" />;
}

export default async function BattalionLeaderboardPage() {
  let status: Awaited<ReturnType<typeof getBattalionRankingsStatus>> | null = null;
  try { status = await getBattalionRankingsStatus(); } catch { /* Show an explicit evidence hold below. */ }
  const held = status?.state === "held";
  const current = status?.state === "current";
  const board = status?.standings ?? [];
  const battalions = board.length ? board.map(standing => BATTALIONS.find(item => item.id === standing.battalionId)!) : [...BATTALIONS].sort((a, b) => Number(b.id === "athena") - Number(a.id === "athena"));
  return <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6"><NavBar />
      <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
        <PageHeader eyebrow="SCP Personnel Command · Competitive Operations" title="Battalion Rankings" />
        <nav aria-label="Battalion command pages" className="mt-5 flex flex-wrap gap-3">{[{ href: "/command", label: "Command roster" }, { href: "/command/trust", label: "Company Trust" }, { href: "/command/cohesion", label: "Battalion Cohesion" }].map(link => <Link key={link.href} href={link.href} className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10">{link.label}</Link>)}</nav>
        <div className="mt-6 grid gap-4 border border-cyan-900/60 bg-black/55 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">{status?.campaignName ?? "Spartan Candidate Program"} · {status?.phaseName ?? "Phase III - Leadership Cadre"}</p><h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-white sm:text-2xl">Battalion Performance Board</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">Five battalions compete across eight exercises. Verified event results determine points, victories and final placement.</p></div>
          <div className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800 text-center"><div className="bg-slate-950 px-5 py-3"><p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Events Verified</p><p className="mt-1 text-lg font-black">{current ? `${status?.resolvedEventCount} / 8` : "—"}</p></div><div className="bg-slate-950 px-5 py-3"><p className="text-[8px] uppercase tracking-[0.2em] text-slate-500">Board Status</p><p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">{held ? "Standby" : !current ? "Verification Hold" : status?.finalized ? "Final" : status?.finalizable ? "Ready to Finalize" : board.length ? "Active" : "Awaiting Event 01"}</p></div></div>
        </div>
        {held ? <div className="mt-4 border border-blue-900/60 bg-blue-950/15 p-5"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">Awaiting Command Assignment and Phase III</p><p className="mt-2 text-xs leading-6 text-slate-400">The cohort is registered. Rankings begin after you accept command, Phase III goes live and the first exercise is verified. No standings or trophies have been awarded.</p></div> : !current ? <div role="status" className="mt-4 border border-amber-700 p-5 text-xs leading-6 text-amber-200">{status?.state === "recovery" ? "Saved event results need to be added to the board. Standings remain unavailable until verification completes." : "Rankings evidence is unavailable or conflicting. Recover saved event reviews in Battalion Cohesion before refreshing standings."}</div> : null}
        {status?.finalized && status.placement ? <div className="mt-4 border border-amber-400/60 bg-amber-950/20 p-5"><p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-300">Phase III Competitive Record</p><p className="mt-2 text-lg font-black uppercase">Athena · {status.placement.rank === 1 ? "1st" : status.placement.rank === 2 ? "2nd" : status.placement.rank === 3 ? "3rd" : `${status.placement.rank}th`} Overall</p><Link href="/service-record" className="mt-2 inline-block text-xs text-cyan-300">View permanent placement{status.placement.rank <= 3 ? " and trophy" : ""} in Service Record</Link></div> : null}
        <div className="mt-5 overflow-hidden border border-slate-800">
          <div className="hidden grid-cols-[60px_92px_1fr_95px_80px_85px] items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500 lg:grid"><span>Rank</span><span>Identity</span><span>Battalion</span><span className="text-center">Movement</span><span className="text-center">Wins</span><span className="text-right">Points</span></div>
          {battalions.map(battalion => {
            const standing = board.find(item => item.battalionId === battalion.id);
            const player = battalion.id === "athena";
            return <article key={battalion.id} className={`relative grid gap-3 border-b border-slate-800 px-5 py-4 last:border-b-0 lg:grid-cols-[60px_92px_1fr_95px_80px_85px] lg:items-center ${player ? "bg-gradient-to-r from-blue-950/50 to-slate-950/70" : "bg-slate-950/70"}`}>
              <div className={`absolute inset-y-0 left-0 w-1 ${player ? "bg-blue-400" : ""}`} style={player ? undefined : { backgroundColor: BATTALION_INSIGNIA[battalion.id].accent }} />
              <p className={`text-3xl font-black ${player ? "text-blue-300" : "text-slate-400"}`}><span className="mr-3 text-[8px] font-normal uppercase tracking-widest text-slate-500 lg:hidden">Rank</span>{standing ? String(standing.rank).padStart(2, "0") : "—"}</p>
              <IdentityBadge id={battalion.id} />
              <div><h3 className="text-base font-black uppercase tracking-[0.08em] text-white">{battalion.name}</h3>{player ? <span className="mt-2 inline-block border border-blue-600/60 bg-blue-950/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-blue-300">Your Battalion</span> : null}<p className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{battalion.specialty} · {battalion.affinity}</p><p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-slate-600">Origin: Fireteam {battalion.origin}</p></div>
              <div className="flex justify-between border-t border-slate-900 pt-2 text-xs lg:block lg:border-0 lg:pt-0 lg:text-center"><span className="text-[8px] uppercase tracking-widest text-slate-500 lg:hidden">Movement</span><span aria-label={standing ? standing.movement > 0 ? `Up ${standing.movement}` : standing.movement < 0 ? `Down ${-standing.movement}` : "Unchanged" : "Not ranked"} className={standing && standing.movement > 0 ? "text-emerald-400" : standing && standing.movement < 0 ? "text-amber-300" : "text-slate-500"}>{standing?.movement ? `${standing.movement > 0 ? "▲" : "▼"} ${Math.abs(standing.movement)}` : "—"}</span></div>
              <p className="flex justify-between text-lg font-black lg:block lg:text-center"><span className="text-[8px] font-normal uppercase tracking-widest text-slate-500 lg:hidden">Event Wins</span>{standing?.eventWins ?? "—"}</p>
              <div className="flex items-baseline justify-between lg:block lg:text-right"><span className="text-[8px] uppercase tracking-widest text-slate-500 lg:hidden">Points</span><p className={`text-3xl font-black ${player ? "text-blue-300" : "text-slate-300"}`}>{standing?.points ?? "—"}</p></div>
            </article>;
          })}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section><p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">After Action Record</p><h2 className="mt-2 text-lg font-black uppercase tracking-[0.08em]">Competitive Event Results</h2>
            {!status?.eventResults.length ? <div className="mt-3 grid min-h-48 place-items-center border border-dashed border-slate-800 bg-black/40 p-6 text-center"><p className="text-xs uppercase tracking-widest text-slate-500">No verified competitive results</p></div> : <div className="mt-3 space-y-3">{status.eventResults.slice().reverse().map(result => <article key={result.eventId} className="border border-slate-800 bg-black/55 p-4"><p className="text-[9px] uppercase tracking-[0.2em] text-cyan-500">Day {result.eventDay} · {result.eventType} · {result.date}</p><h3 className="mt-2 border-b border-slate-800 pb-3 text-sm font-black uppercase tracking-[0.08em]">{result.title}</h3><ol className="mt-3 space-y-2 text-xs">{result.scores.map(score => <li key={score.battalionId} className="flex justify-between gap-4"><span className={score.battalionId === "athena" ? "font-bold text-blue-300" : "text-slate-400"}>{score.placement}. {BATTALIONS.find(item => item.id === score.battalionId)?.name}</span><span className="shrink-0 text-slate-200">{score.points} pts</span></li>)}</ol></article>)}</div>}
          </section>
          <aside className="border border-slate-800 bg-black/45 p-5"><p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-500">Personnel Command Brief</p><h2 className="mt-2 text-base font-black uppercase tracking-[0.08em]">Competitive Order</h2><div className="mt-4 space-y-4 text-xs leading-6 text-slate-400"><p>Cumulative points determine rank. Tied totals are resolved by event victories, then the most recent Major placement.</p><p>Eight exercises allow 32 competition points. Failed attempts affect Cohesion; each passed exercise contributes one competitive result.</p><p>Final placement is recorded at the Day 56 completion boundary after all eight results verify. Top three earn gold, silver or bronze trophies. Earlier standings remain provisional.</p></div>
            {!held ? <div className="mt-5 border-t border-slate-800 pt-5"><BattalionRankingsControls finalize={Boolean(current && status?.finalizable && !status.finalized)} />{current && status?.finalizable && !status.finalized ? <p className="mt-3 text-[10px] leading-5 text-slate-500">Records placement and trophy eligibility without advancing the phase.</p> : null}</div> : null}
          </aside>
        </div>
      </section>
    </div>
  </main>;
}
