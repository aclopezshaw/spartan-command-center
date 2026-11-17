import Image from "next/image";
import { trophyLevel, type CompetitionPlacement } from "@/lib/competition-trophies";

export default function CompetitionTrophyCard({ record }: { record: CompetitionPlacement }) {
  const level = trophyLevel(record);
  if (!level) return null;
  const placement = record.rank === 1 ? "1st Place" : record.rank === 2 ? "2nd Place" : "3rd Place";
  const phaseName = record.phaseNumber === 2
    ? "Phase II - Fireteam Operations"
    : "Phase III - Leadership Cadre";
  const levelClassName = {
    gold: "text-[#d8bd68]",
    silver: "text-[#aab4bd]",
    bronze: "text-[#c5a078]",
  }[level];
  return <article className="border border-cyan-900/60 bg-slate-950/70 p-4">
    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-cyan-100">{record.phaseNumber === 2 ? "Fireteam Championship" : "Battalion Championship"}</h3>
    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-400">{phaseName}</p>
    <div className="mt-5 grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
      <Image src={`/images/trophies/placement-trophy-${level}.png`} alt={`${placement} ${record.competition} trophy`} width={108} height={120} className="h-[120px] w-[108px] object-contain" />
      <div className="space-y-3 border-l border-cyan-900/70 pl-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">{record.unitName}</p>
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Trophy Level</p>
          <p className={`mt-1 text-xs font-bold uppercase tracking-[0.2em] ${levelClassName}`}>{placement}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Event Wins</p>
          <p className="mt-1 text-xs font-bold text-slate-300">{`${record.eventWins}/${record.sourceEventIds.length}`}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Record Date</p>
          <p className="mt-1 text-xs font-bold text-slate-300">{record.recordDate}</p>
        </div>
      </div>
    </div>
  </article>;
}
