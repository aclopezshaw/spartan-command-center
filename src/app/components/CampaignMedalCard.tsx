import Image from "next/image";

export type CampaignMedalLevel = "Bronze" | "Silver" | "Gold";

export type CampaignMedalRecord = {
    id: string;
    campaignName: string;
    phaseName: string;
    medalLevel: CampaignMedalLevel;
    xpEarned: number;
    recordDate: string;
};

const medalThemes: Record<
    CampaignMedalLevel,
    {
        assetPath: string;
        levelClassName: string;
    }
> = {
    Bronze: {
        assetPath: "/images/medals/campaign-medal-bronze.png",
        levelClassName: "text-[#c5a078]",
    },
    Silver: {
        assetPath: "/images/medals/campaign-medal-silver.png",
        levelClassName: "text-[#aab4bd]",
    },
    Gold: {
        assetPath: "/images/medals/campaign-medal-gold.png",
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
                    <Image
                        src={theme.assetPath}
                        alt={`${medal.medalLevel} campaign medal`}
                        fill
                        sizes="108px"
                        className="object-contain drop-shadow-[0_0_12px_rgba(148,163,184,0.18)]"
                    />
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
