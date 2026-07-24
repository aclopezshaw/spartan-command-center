export type CampaignMedalLevel = "Bronze" | "Silver" | "Gold";

export type CampaignMedalRecord = {
    id: string;
    campaignName: string;
    phaseName: string;
    phaseMark: string;
    medalLevel: CampaignMedalLevel;
    xpEarned: number;
    recordDate: string;
};

const medalThemes: Record<
    CampaignMedalLevel,
    {
        ribbonLeftClassName: string;
        ribbonRightClassName: string;
        medalClassName: string;
        levelClassName: string;
    }
> = {
    Bronze: {
        ribbonLeftClassName:
            "from-[#6f5a47] via-[#493d32] to-[#211d19]",
        ribbonRightClassName:
            "from-[#80664f] via-[#554437] to-[#211d19]",
        medalClassName:
            "border-[#755539] bg-[radial-gradient(circle_at_35%_30%,#c29a72_0%,#8b6445_42%,#493321_75%,#1d1712_100%)] shadow-[0_0_16px_rgba(154,118,82,0.18)]",
        levelClassName: "text-[#c5a078]",
    },
    Silver: {
        ribbonLeftClassName:
            "from-slate-500 via-slate-700 to-slate-900",
        ribbonRightClassName:
            "from-slate-400 via-slate-600 to-slate-900",
        medalClassName:
            "border-[#776744] bg-[radial-gradient(circle_at_35%_30%,#c3c8cb_0%,#747d83_42%,#30383e_75%,#111820_100%)] shadow-[0_0_16px_rgba(148,163,184,0.18)]",
        levelClassName: "text-[#aab4bd]",
    },
    Gold: {
        ribbonLeftClassName:
            "from-[#8d7337] via-[#5d4a25] to-[#241e13]",
        ribbonRightClassName:
            "from-[#a1843e] via-[#6d5729] to-[#241e13]",
        medalClassName:
            "border-[#95752d] bg-[radial-gradient(circle_at_35%_30%,#efd77f_0%,#b18a36_42%,#664817_75%,#251b0b_100%)] shadow-[0_0_18px_rgba(217,177,74,0.22)]",
        levelClassName: "text-[#d8bd68]",
    },
};

export function sortCampaignMedalsNewestFirst(
    medals: CampaignMedalRecord[]
) {
    return [...medals].sort(
        (left, right) =>
            Date.parse(right.recordDate) - Date.parse(left.recordDate)
    );
}

export default function CampaignMedalCard({
    medal,
}: {
    medal: CampaignMedalRecord;
}) {
    const theme = medalThemes[medal.medalLevel];

    return (
        <article className="border border-cyan-900/60 bg-slate-950/70 p-4">
            <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-100">
                    {medal.campaignName}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                    {medal.phaseName}
                </p>
            </div>

            <div className="mt-5 grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
                <div className="relative h-[120px] w-[108px]">
                    <div
                        className={`absolute left-[26px] top-0 h-[60px] w-6 -skew-x-6 border-x border-slate-500/40 bg-gradient-to-b ${theme.ribbonLeftClassName}`}
                    />
                    <div
                        className={`absolute right-[26px] top-0 h-[60px] w-6 skew-x-6 border-x border-slate-500/40 bg-gradient-to-b ${theme.ribbonRightClassName}`}
                    />
                    <div
                        className={`absolute bottom-0 left-1/2 flex h-[72px] w-[72px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] ${theme.medalClassName}`}
                    >
                        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 bg-black/25">
                            <span className="text-2xl font-black text-slate-100">
                                {medal.phaseMark}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 border-l border-cyan-900/70 pl-4">
                    <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                            Medal Level
                        </p>
                        <p
                            className={`mt-1 text-xs font-bold uppercase tracking-[0.2em] ${theme.levelClassName}`}
                        >
                            {medal.medalLevel}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                            XP Earned
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-300">
                            {medal.xpEarned.toLocaleString("en-US")} XP
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                            Record Date
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-300">
                            {medal.recordDate}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
