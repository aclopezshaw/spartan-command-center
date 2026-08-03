import {
    getActiveCampaignEventState,
    getAlexServiceRecord,
    getCompletedCampaignMedals,
    getCampaignPhaseXpSummary,
    getPromotionStatus,
    getReadinessLedgerStatus,
} from "@/lib/notion";
import { getCampaignPhaseDisplayName } from "@/lib/campaign";
import { getOperationalDateKey } from "@/lib/date";
import { getNotionClient } from "@/lib/notion-client";
import {
    calculateReadinessTrends,
    type ReadinessTrend,
} from "@/lib/readiness-ledger";
import { getRankInsigniaPath } from "@/lib/rank-insignia";
import Image from "next/image";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import CampaignMedalCard from "../../components/CampaignMedalCard";

function getTitleProperty(properties: any, propertyName: string) {
    return properties[propertyName]?.title?.[0]?.plain_text ?? "";
}

function getTextProperty(properties: any, propertyName: string) {
    const property = properties[propertyName];

    if (!property) return "";

    if (property.type === "rich_text") {
        return property.rich_text?.[0]?.plain_text ?? "";
    }

    if (property.type === "select") {
        return property.select?.name ?? "";
    }

    if (property.type === "formula" && property.formula.type === "string") {
        return property.formula.string ?? "";
    }

    return "";
}

function getDateProperty(properties: any, propertyName: string) {
    return properties[propertyName]?.date?.start ?? "";
}

type ProgressMarker = {
    label: string;
    xp: number;
    value: number;
    lineClassName: string;
    textClassName: string;
};

function ProgressBar({
    value,
    barClassName = "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]",
    markers = [],
}: {
    value: number;
    barClassName?: string;
    markers?: ProgressMarker[];
}) {
    const boundedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={markers.length > 0 ? "relative pb-6" : undefined}>
            <div className="relative h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
                <div
                    className={`h-full ${barClassName}`}
                    style={{ width: `${boundedValue}%` }}
                />
                {markers.map((marker) => {
                    const boundedMarkerValue = Math.min(
                        100,
                        Math.max(0, marker.value)
                    );

                    return (
                        <span
                            key={marker.label}
                            aria-label={`${marker.label} threshold at ${marker.xp} XP`}
                            className={`absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 ${marker.lineClassName}`}
                            style={{ left: `${boundedMarkerValue}%` }}
                            title={`${marker.label}: ${marker.xp} XP`}
                        />
                    );
                })}
            </div>
            {markers.map((marker) => {
                const boundedMarkerValue = Math.min(
                    100,
                    Math.max(0, marker.value)
                );

                return (
                    <span
                        key={`${marker.label}-value`}
                        className={`absolute top-5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tracking-[0.12em] ${marker.textClassName}`}
                        style={{ left: `${boundedMarkerValue}%` }}
                    >
                        {marker.xp} xp
                    </span>
                );
            })}
        </div>
    );
}

function getMedalPaceTheme(medalPace: string) {
    const normalizedPace = medalPace.toLowerCase();

    if (normalizedPace.includes("gold")) {
        return {
            barClassName:
                "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]",
            textClassName: "text-amber-300",
        };
    }

    if (normalizedPace.includes("silver")) {
        return {
            barClassName:
                "bg-[#7d8792] shadow-[0_0_12px_rgba(125,135,146,0.6)]",
            textClassName: "text-[#aab4bd]",
        };
    }

    if (normalizedPace.includes("bronze")) {
        return {
            barClassName:
                "bg-[#9a7652] shadow-[0_0_12px_rgba(154,118,82,0.6)]",
            textClassName: "text-[#c5a078]",
        };
    }

    return {
        barClassName:
            "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]",
        textClassName: "text-cyan-300",
    };
}

function getPendingPaceMarkers({
    earnedXp,
    maxPhaseXp,
    bronzeThresholdXp,
    silverThresholdXp,
    goldThresholdXp,
}: {
    earnedXp: number;
    maxPhaseXp: number;
    bronzeThresholdXp: number;
    silverThresholdXp: number;
    goldThresholdXp: number;
}): ProgressMarker[] {
    if (maxPhaseXp <= 0) {
        return [];
    }

    const thresholds = [
        {
            label: "Bronze",
            xp: bronzeThresholdXp,
            lineClassName:
                "bg-[#c5a078] shadow-[0_0_6px_rgba(197,160,120,0.85)]",
            textClassName: "text-[#c5a078]",
        },
        {
            label: "Silver",
            xp: silverThresholdXp,
            lineClassName:
                "bg-[#aab4bd] shadow-[0_0_6px_rgba(170,180,189,0.9)]",
            textClassName: "text-[#aab4bd]",
        },
        {
            label: "Gold",
            xp: goldThresholdXp,
            lineClassName:
                "bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.95)]",
            textClassName: "text-amber-300",
        },
    ];

    return thresholds
        .filter(({ xp }) => xp > 0 && earnedXp <= xp)
        .map((threshold) => ({
            ...threshold,
            value: (threshold.xp / maxPhaseXp) * 100,
        }));
}

function formatTrendPoints(value: number) {
    return `${value >= 0 ? "+" : ""}${value}`;
}

function StatCard({
    label,
    value,
    trend,
}: {
    label: string;
    value: number | string;
    trend: ReadinessTrend;
}) {
    const trendPresentation = {
        up: {
            arrow: "↑",
            label: "Up",
            className: "text-cyan-400",
        },
        flat: {
            arrow: "→",
            label: "Flat",
            className: "text-slate-500",
        },
        down: {
            arrow: "↓",
            label: "Down",
            className: "text-amber-400/80",
        },
    }[trend.direction];
    const trendDescription = `${trendPresentation.label}: ${formatTrendPoints(
        trend.currentPoints
    )} points in the current ${trend.windowDays} days versus ${formatTrendPoints(
        trend.previousPoints
    )} in the prior ${trend.windowDays} days`;

    return (
        <div className="border border-cyan-700/50 bg-slate-950/80 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                {label}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-300">{value}</p>
            <p
                aria-label={trendDescription}
                className={`mt-2 text-[10px] font-bold uppercase tracking-[0.18em] ${trendPresentation.className}`}
                title={trendDescription}
            >
                <span aria-hidden="true" className="text-sm">
                    {trendPresentation.arrow}
                </span>{" "}
                {trendPresentation.label} · 7D
            </p>
        </div>
    );
}

type Achievement = {
    title: string;
    track: string;
    earned: string;
    description: string;
    image: string;
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
    return (
        <div className="border border-cyan-900/60 bg-slate-950/70 p-4 text-center">
            <div className="relative mx-auto aspect-square w-full max-w-[180px]">
                <Image
                    src={achievement.image}
                    alt={`${achievement.title} achievement patch`}
                    fill
                    className="object-contain"
                />
            </div>

            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-cyan-100">
                {achievement.title}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-cyan-400">
                {achievement.track}
            </p>

            <p className="mt-2 text-sm font-bold text-slate-200">
                {achievement.earned}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {achievement.description}
            </p>
        </div>
    );
}

function SpartanRenderPanel() {
    return (
        <div>
            <div className="flex flex-1 items-center justify-center">
                <div className="relative h-[360px] w-full overflow-hidden border border-cyan-600/40 bg-slate-900/80 shadow-[0_0_30px_rgba(8,145,178,0.2)]">
                    <Image
                        src="/images/alex-225-recruit.png"
                        alt="ALEX-225 recruit portrait"
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </div>
            </div>

            <div className="mt-4 flex justify-center gap-2">
                <button className="bg-cyan-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black">
                    Helmet Off
                </button>

                <button className="border border-cyan-700/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                    Helmet On
                </button>
            </div>

            <div className="mt-4 text-center text-sm uppercase tracking-[0.25em]">
                <span className="text-slate-500">Status: </span>
                <span className="text-cyan-400 font-bold">Active</span>
            </div>
        </div>
    );
}

function getCampaignMedalPace(
    projectedXp: number,
    bronzeThresholdXp: number,
    silverThresholdXp: number,
    goldThresholdXp: number
) {
    if (projectedXp >= goldThresholdXp && goldThresholdXp > 0) return "Gold Pace";
    if (projectedXp >= silverThresholdXp && silverThresholdXp > 0) return "Silver Pace";
    if (projectedXp >= bronzeThresholdXp && bronzeThresholdXp > 0) return "Bronze Pace";
    return "Unrated Pace";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
    const notion = getNotionClient();
    const record = await getAlexServiceRecord();
    const freshRecord = await notion.pages.retrieve({
  page_id: (record as any).id,
});
    const [
        activeCampaignEventState,
        promotion,
        readinessLedger,
        campaignMedals,
    ] = await Promise.all([
        getActiveCampaignEventState(),
        getPromotionStatus(),
        getReadinessLedgerStatus(),
        getCompletedCampaignMedals(),
    ]);
    const phaseXpSummary = await getCampaignPhaseXpSummary(
        activeCampaignEventState
    );
    const readiness = readinessLedger.authoritativeTotals;
    const readinessTrends = calculateReadinessTrends({
        entries: readinessLedger.entries,
        currentDateKey: getOperationalDateKey(),
    });

const properties = (freshRecord as any).properties;

    const spartan = {
        designation: properties["Designation"]?.title?.[0]?.plain_text ?? "ALEX-225",
        rank: promotion.currentRank?.name ?? "Rank Conflict",
        nextRank: promotion.targetRank?.name ?? null,
        xp: properties["Service Score"]?.formula?.number ?? 0,
        nextRankXp:
            promotion.targetRank?.minimumXp ??
            promotion.currentRank?.minimumXp ??
            0,
        readiness,

    };

    const xpProgress = promotion.progression?.progressPercent ?? 0;
    const campaignXp = phaseXpSummary?.earnedXp ?? spartan.xp;
    const phaseOwnedMaxXp =
        (activeCampaignEventState.maxHabitXp ?? 0) +
        (activeCampaignEventState.maxEventXp ?? 0);
    const maxPhaseXp =
        phaseXpSummary?.maxPhaseXp ??
        phaseOwnedMaxXp;
    const bronzeThresholdXp = phaseXpSummary
        ? phaseXpSummary.thresholds.bronze
        : activeCampaignEventState.bronzeThresholdPercent
        ? Math.round(
              maxPhaseXp *
                  (activeCampaignEventState.bronzeThresholdPercent / 100)
          )
        : 0;
    const silverThresholdXp = phaseXpSummary
        ? phaseXpSummary.thresholds.silver
        : activeCampaignEventState.silverThresholdPercent
        ? Math.round(
              maxPhaseXp *
                  (activeCampaignEventState.silverThresholdPercent / 100)
          )
        : 0;
    const goldThresholdXp = phaseXpSummary
        ? phaseXpSummary.thresholds.gold
        : activeCampaignEventState.goldThresholdPercent
        ? Math.round(
              maxPhaseXp *
                  (activeCampaignEventState.goldThresholdPercent / 100)
          )
        : 0;
    const campaignProgress =
        maxPhaseXp > 0 ? Math.round((campaignXp / maxPhaseXp) * 100) : 0;
    const projectedCampaignXp =
        phaseXpSummary?.projectedXp ??
        campaignXp;
    const campaignMedalPace =
        phaseXpSummary?.projectedMedalPace ??
        (phaseOwnedMaxXp > 0
            ? getCampaignMedalPace(
                  projectedCampaignXp,
                  bronzeThresholdXp,
                  silverThresholdXp,
                  goldThresholdXp
              )
            : "Unrated Pace");
    const campaignMedalPaceLabel =
        campaignMedalPace.replace(/^[^A-Za-z0-9]+/, "").trim() ||
        "Unrated Pace";
    const campaignMedalPaceDisplay = campaignMedalPaceLabel.replace(
        /\s+Pace$/i,
        ""
    );
    const medalPaceTheme = getMedalPaceTheme(campaignMedalPaceLabel);
    const pendingPaceMarkers = getPendingPaceMarkers({
        earnedXp: campaignXp,
        maxPhaseXp,
        bronzeThresholdXp,
        silverThresholdXp,
        goldThresholdXp,
    });
    const campaignName =
        activeCampaignEventState.campaignName ?? "Campaign Unassigned";
    const currentPhaseName = getCampaignPhaseDisplayName(
        activeCampaignEventState.phaseName
    );
    const nextPhaseName = getCampaignPhaseDisplayName(
        activeCampaignEventState.nextPhaseName
    );

    const achievementsDatabaseId = process.env.ACHIEVEMENTS_DATABASE_ID;

    let achievements: Achievement[] = [];

    if (achievementsDatabaseId) {
        const achievementsResponse = await notion.dataSources.query({
            data_source_id: achievementsDatabaseId,
            filter: {
                property: "Status",
                formula: {
                    string: {
                    equals: "Earned",
                    },
                },
            },
            sorts: [
                {
                    property: "Date Earned",
                    direction: "descending",
                },
            ],
        });

        achievements = achievementsResponse.results.map((page: any) => {
            const achievementProps = page.properties;

            return {
                title: getTitleProperty(achievementProps, "Achievement Name"),
                track: getTextProperty(achievementProps, "Track"),
                earned: getDateProperty(achievementProps, "Date Earned"),
                description: getTextProperty(achievementProps, "Description"),
                image: getTextProperty(achievementProps, "Patch Path"),
            };
        });
    }

    return (
        <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
            <div className="mx-auto max-w-6xl space-y-6">
                <NavBar />

                <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
                    <PageHeader eyebrow="UNSC Personnel File" title="Service Record" />

                    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            <div className="border border-cyan-700/50 bg-black/60 p-5">
                                <div className="flex items-start justify-between gap-6">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            Current Campaign
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-cyan-100">
                                            {campaignName}
                                        </p>

                                        <p className="mt-2 text-sm uppercase tracking-[0.18em] text-cyan-300">
                                            {currentPhaseName}
                                        </p>
                                    </div>

                                    <div className="max-w-[280px] text-right">
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            Next Phase
                                        </p>
                                        <p className="mt-2 text-base font-bold text-cyan-100">
                                            {nextPhaseName}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm text-slate-300">
                                    <span>
                                        Projected Medal Pace ·{" "}
                                        <span className={medalPaceTheme.textClassName}>
                                            {campaignMedalPaceDisplay}
                                        </span>
                                    </span>
                                    <span>
                                        {campaignXp} / {maxPhaseXp} XP · {campaignProgress}%
                                    </span>
                                </div>
                                <div className="pt-4">
                                    <ProgressBar
                                        value={campaignProgress}
                                        barClassName={medalPaceTheme.barClassName}
                                        markers={pendingPaceMarkers}
                                    />
                                </div>
                                <p className="mt-3 text-xs text-slate-500">
                                    Maximum phase XP includes all scheduled event rewards.
                                </p>
                                {phaseXpSummary ? (
                                    <p className="mt-1 text-xs text-slate-600">
                                        Daily {phaseXpSummary.dailyXp} · Weekly{" "}
                                        {phaseXpSummary.weeklyXp} · Events{" "}
                                        {phaseXpSummary.eventXp}
                                    </p>
                                ) : null}
                            </div>

                            <section className="grid gap-4 md:grid-cols-4">
                                <StatCard
                                    label="Physical"
                                    value={spartan.readiness.physical}
                                    trend={readinessTrends.physical}
                                />
                                <StatCard
                                    label="Recovery"
                                    value={spartan.readiness.recovery}
                                    trend={readinessTrends.recovery}
                                />
                                <StatCard
                                    label="Intelligence"
                                    value={spartan.readiness.intelligence}
                                    trend={readinessTrends.intelligence}
                                />
                                <StatCard
                                    label="Professional"
                                    value={spartan.readiness.professional}
                                    trend={readinessTrends.professional}
                                />
                            </section>

                            <div className="border border-cyan-700/50 bg-black/60 p-5">
                                <div className="grid items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            Current Rank
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-cyan-100">
                                            {spartan.rank}
                                        </p>
                                    </div>

                                    <div className="relative mx-auto h-28 w-32 sm:h-24">
                                        <div className="absolute inset-x-5 top-7 h-20 rounded-full bg-cyan-400/15 blur-2xl" />
                                        <Image
                                            src={getRankInsigniaPath(
                                                spartan.nextRank ?? spartan.rank
                                            )}
                                            alt={`${spartan.nextRank ?? spartan.rank} rank insignia`}
                                            width={128}
                                            height={128}
                                            className="absolute left-0 top-2 z-10 h-32 w-32 object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.32)]"
                                        />
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            NEXT RANK
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-amber-500">
                                            {spartan.nextRank ?? "Advanced Review"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between text-sm text-slate-300 sm:mt-8">
                                    <span>XP Progress</span>
                                    <span>
                                        {spartan.xp} / {spartan.nextRankXp} XP · {xpProgress}%
                                    </span>
                                </div>
                                <div className="pt-3">
                                    <ProgressBar value={xpProgress} />
                                </div>
                            </div>

                            <div className="border border-cyan-700/50 bg-black/60 p-5">
                                <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                    Awards Cabinet
                                </p>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {achievements.map((achievement) => (
                                        <AchievementCard
                                            key={achievement.title}
                                            achievement={achievement}
                                        />
                                    ))}
                                    
                                </div>
                            </div>
                        </div>

                        <aside className="self-start border border-cyan-700/50 bg-black/60 p-4">
                            <div className="border border-cyan-900/60 bg-slate-950/60 p-5">
                                <div className="mb-5 text-center">
                                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                        Designation
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-cyan-100">
                                        ALEX-225
                                    </p>
                                </div>

                                <SpartanRenderPanel />
                            </div>

                            <div className="mt-8">
                                <div className="mb-4">
                                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                        Campaign Medals
                                    </p>
                                </div>

                                {campaignMedals.length > 0 ? (
                                    <div className="space-y-4">
                                        {campaignMedals.map((medal) => (
                                            <CampaignMedalCard
                                                key={medal.id}
                                                medal={{
                                                    ...medal,
                                                    phaseName:
                                                        getCampaignPhaseDisplayName(
                                                            medal.phaseName
                                                        ),
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-cyan-900/60 bg-slate-950/70 px-5 py-10 text-center">
                                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
                                            None at this time.
                                        </p>
                                        <p className="mx-auto mt-3 max-w-[240px] text-[10px] uppercase leading-relaxed tracking-[0.16em] text-slate-600">
                                            Campaign medals will be entered upon phase completion.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </section>
            </div >
        </main >
    );
}
