import type { UnratedCampaignMedalRecord } from "@/lib/campaign-medals";

export default function UnratedCampaignMedalCard({ medal }: { medal: UnratedCampaignMedalRecord }) {
  return <article className="border border-dashed border-slate-700 bg-slate-950/50 p-4">
    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">{medal.campaignName}</p>
    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{medal.phaseName}</p>
    <div className="mt-5 grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
      <div aria-hidden="true" className="grid h-[120px] w-[108px] place-items-center border border-dashed border-slate-800 bg-black/30">
        <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-slate-700 text-2xl text-slate-600">—</div>
      </div>
      <div className="space-y-3 border-l border-slate-800 pl-4">
        <div><p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Medal Level</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Unrated</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">XP Earned</p><p className="mt-1 text-xs font-bold text-slate-400">{medal.xpEarned.toLocaleString("en-US")} XP</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{medal.finalized ? "Record Date" : "Phase End"}</p><p className="mt-1 text-xs font-bold text-slate-500">{medal.recordDate}</p></div>
      </div>
    </div>
    <p className="mt-4 text-[10px] leading-5 text-slate-500">{medal.finalized ? "No campaign medal earned." : "Below the medal threshold · Awaiting finalization. In-phase corrections can still update this result."}</p>
  </article>;
}
