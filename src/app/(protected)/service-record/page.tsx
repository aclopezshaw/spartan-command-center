import { Client } from "@notionhq/client";
import { getAlexServiceRecord } from "../../../lib/notion";
import Image from "next/image";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

function getNumberProperty(properties: any, propertyName: string) {
    const property = properties[propertyName];

    if (!property) return 0;

    if (property.type === "number") return property.number ?? 0;

    if (property.type === "formula" && property.formula.type === "number") {
        return property.formula.number ?? 0;
    }

    if (property.type === "rollup" && property.rollup.type === "number") {
        return property.rollup.number ?? 0;
    }

    return 0;
}

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

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
            <div
                className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="border border-cyan-700/50 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                {label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
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

function LoadoutPanel({
    loadout,
}: {
    loadout: {
        armor: string;
        patch: string;
        weapon: string;
        banner: string;
    };
}) {
    const items = [
        ["Armor", loadout.armor],
        ["Patch", loadout.patch],
        ["Weapon", loadout.weapon],
        ["Banner", loadout.banner],
    ];

    return (
        <div className="border border-cyan-700/50 bg-black/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                Equipped Loadout
            </p>

            <div className="mt-5 space-y-3">
                {items.map(([label, value]) => (
                    <div
                        key={label}
                        className="flex justify-between border-b border-cyan-900/60 pb-2 text-sm"
                    >
                        <span className="uppercase tracking-[0.2em] text-slate-500">
                            {label}
                        </span>
                        <span className="text-cyan-100">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getNextRankXp(xp: number) {
    const thresholds = [
        8000, 16000, 24000, 32000, 40000, 48000,
        56500, 65000, 73500, 82000, 90500, 99000,
        108000, 117000, 126000, 135000, 144000, 153000,
        162500, 172000, 181500, 191000, 200500, 210000,
        220000, 230000, 240000, 250000, 260000, 270000,
    ];

    return thresholds.find((threshold) => xp < threshold) ?? 270000;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
    const record = await getAlexServiceRecord();
    const freshRecord = await notion.pages.retrieve({
  page_id: (record as any).id,
});

const properties = (freshRecord as any).properties;

    const props = (record as any).properties;
    console.log("SPARTAN:", props["Designation"]);
    console.log("SERVICE SCORE:", props["Service Score"]);
    console.log("TOTAL XP:", props["Total XP Earned"]);

    //const properties = (record as any).properties;
console.log(
  Object.keys(properties).filter((key) => key.includes("Readiness"))
);
    console.log("Recovery raw:", JSON.stringify(properties["Recovery Readiness"], null, 2));
console.log("Professional raw:", JSON.stringify(properties["Professional Readiness"], null, 2));

    const spartan = {
        designation: properties["Designation"]?.title?.[0]?.plain_text ?? "ALEX-225",
        rank: properties["Calculated Rank"]?.formula?.string ?? "BANANA",
        xp: properties["Service Score"]?.formula?.number ?? 0,
        nextRankXp: getNextRankXp(properties["Service Score"]?.formula?.number ?? 0),
        readiness: {
            physical: getNumberProperty(properties, "Physical Readiness"),
            recovery: getNumberProperty(properties, "Recovery Readiness"),
            intelligence: getNumberProperty(properties, "Intelligence Readiness"),
            professional: getNumberProperty(properties, "Professional Readiness"),
        },

        loadout: {
            armor: "Recruit Armor",
            patch: "Spartan Patch",
            weapon: "Locked",
            banner: "None",
        },
    };

    const xpProgress = Math.round((spartan.xp / spartan.nextRankXp) * 100);
    const xpToNextRank = spartan.nextRankXp - spartan.xp;

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
                physicalPoints: getNumberProperty(achievementProps, "Physical Point"),
                recoveryPoints: getNumberProperty(achievementProps, "Recovery Point"),
                intelligencePoints: getNumberProperty(achievementProps, "Intelligence Point"),
                professionalPoints: getNumberProperty(achievementProps, "Professional Point")
            };
        });
    }

    const readinessTotals = achievements.reduce(
    (totals, achievement: any) => ({
        physical: totals.physical + (achievement.physicalPoints ?? 0),
        recovery: totals.recovery + (achievement.recoveryPoints ?? 0),
        intelligence: totals.intelligence + (achievement.intelligencePoints ?? 0),
        professional: totals.professional + (achievement.professionalPoints ?? 0),
    }),
    {
        physical: 0,
        recovery: 0,
        intelligence: 0,
        professional: 0,
    }
);
spartan.readiness = readinessTotals;

console.log("Computed totals:", readinessTotals);

    return (
        <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
            <div className="mx-auto max-w-7xl space-y-6">
                <NavBar />

                <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
                    <PageHeader eyebrow="UNSC Personnel File" title="Service Record" />

                    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            <div className="border border-cyan-700/50 bg-black/60 p-5">
                                <div className="flex items-end justify-between gap-6">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            Current Rank
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-cyan-100">
                                            Recruit
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                                            NEXT RANK
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-amber-500">
                                            Bronze I
                                        </p>
                                    </div>
                                </div>
                            
                            <div className="mt-6 flex justify-between text-sm text-slate-300">
                                <span>XP Progress</span>
                                <span>
                                    {spartan.xp} / {spartan.nextRankXp} XP · {xpProgress}%
                                </span>
                                </div>
                                <div className="pt-4">
                                    <ProgressBar value={xpProgress} />
                                </div>
                            </div>
                            <div>
                                <section className="grid gap-4 md:grid-cols-4">
                                    <StatCard label="Physical" value={spartan.readiness.physical} />
                                    <StatCard label="Recovery" value={spartan.readiness.recovery} />
                                    <StatCard label="Intelligence" value={spartan.readiness.intelligence} />
                                    <StatCard label="Professional" value={spartan.readiness.professional} />
                                </section>
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

                        <div className="space-y-6">
                            <div className="border border-cyan-700/50 bg-black/60 p-5">
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

                            <LoadoutPanel loadout={spartan.loadout} />
                        </div>
                    </div>
                </section>
            </div >
        </main >
    );
}