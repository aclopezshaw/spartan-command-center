import Image from "next/image";
import HudCheckbox from "../../components/HudCheckbox";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import { getAlexServiceRecord, getTodaySitrep } from "@/lib/notion";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800/80">
      <div
        className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

function ObjectiveRow({
  label,
  xp,
  checked = false,
}: {
  label: string;
  xp: number;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-900/60 py-1 text-xs">
      <div className="flex items-center gap-3">
        <div
          className={`h-4 w-4 border ${
            checked
              ? "border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              : "border-cyan-500/70 bg-black/40"
          }`}
        />
        <span className={checked ? "text-cyan-100" : "text-slate-300"}>
          {label}
        </span>
      </div>
      <span className="text-cyan-300">+{xp} XP</span>
    </div>
  );
}

function HudPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-cyan-500/30 bg-black/15 p-4 backdrop-blur-[2px] shadow-[0_0_16px_rgba(8,145,178,0.18)]">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function getNumberProperty(properties: any, propertyName: string) {
  const property = properties[propertyName];

  if (!property) return 0;

  if (property.type === "number") return property.number ?? 0;
  if (property.type === "formula") return property.formula?.number ?? 0;
  if (property.type === "rollup") return property.rollup?.number ?? 0;

  return 0;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandHudPage() {
  const sitrep = (await getTodaySitrep()) as any;

  const sitrepProperties = sitrep.properties;

  const dailyXp = sitrepProperties["Daily XP"]?.formula?.number ?? 0;
  const maxDailyXp = 200;

  const serviceRecord = (await getAlexServiceRecord()) as any;
  const serviceRecordProperties = serviceRecord.properties;
  const designation =
    serviceRecordProperties["Designation"]?.title?.[0]?.plain_text ?? "NULL";
  const currentCampaign = "Spartan Candidate Program";
  const campaignDay = getNumberProperty(serviceRecordProperties, "Campaign Day");

  
  const projectedCampaignXp = getNumberProperty(
    serviceRecordProperties,
    "Projected Campaign XP"
    );

    const bronzeThresholdXp = getNumberProperty(
    serviceRecordProperties,
    "Bronze Threshold XP"
    );

    const silverThresholdXp = getNumberProperty(
    serviceRecordProperties,
    "Silver Threshold XP"
    );

    const goldThresholdXp = getNumberProperty(
    serviceRecordProperties,
    "Gold Threshold XP"
    );

    const medalPace =
  goldThresholdXp > 0 && projectedCampaignXp >= goldThresholdXp
    ? "🏅 Gold Pace"
    : silverThresholdXp > 0 && projectedCampaignXp >= silverThresholdXp
      ? "🥈 Silver Pace"
      : bronzeThresholdXp > 0 && projectedCampaignXp >= bronzeThresholdXp
        ? "🥉 Bronze Pace"
        : "⚠ Below Bronze";

  const dailyObjectives = [
    ["Study 30 min", 35, "Study"],
    ["96oz Water", 30, "Water"],
    ["Sleep 7+ hrs", 25, "Sleep"],
    ["Brush Teeth", 25, "Teeth"],
    ["Shower", 25, "Shower"],
    ["10k Steps", 20, "Steps"],
    ["Stretch", 20, "Stretch"],
    ["Meds", 10, "Meds"],
    ["Read 1 Chapter", 10, "Read"],
  ] as const;

  const weeklyObjectives = [
    ["Workout 3x", 200],
    ["T Shot", 50],
    ["Plan Week", 50],
  ] as const;

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Tactical Interface" title="Command HUD" />

          <div className="mt-6 overflow-hidden border border-cyan-600/60 bg-black shadow-[0_0_35px_rgba(8,145,178,0.25)]">
            <div className="relative min-h-[720px] overflow-hidden">
              <Image
                src="/images/hud-mess-hall.png"
                alt="UNSC mess hall HUD background"
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]" />

              <div className="absolute left-1/2 top-8 z-10 w-[40%] -translate-x-1/2">
                <div className="text-center">
                  <p className="mb-2 text-xs uppercase tracking-[0.35em] text-cyan-300">
                    Shield Integrity
                  </p>
                  <ProgressBar value={100} />
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-100">
                    100% · Systems Online
                  </p>
                </div>
              </div>

                <div className="absolute left-8 top-6 z-10">
                <p className="text-lg font-bold tracking-[0.2em] text-cyan-100">
                    {designation}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-400">
                    Status: Active
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-300">
                    {currentCampaign}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-300">
                    DAY {campaignDay}/42
                </p>
                
                </div>

                <div className="absolute right-8 top-6 z-10 text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                        Medal Pace
                    </p>
                    <p className="mt-1 text-xl font-bold text-yellow-300">
                        {medalPace}
                    </p>
                </div>

              <div className="absolute left-8 top-32 z-10 w-[230px]">
                <HudPanel title="Mission Objectives">
                  <div className="space-y-1">
                    {dailyObjectives.map(([label, xp, propertyName]) => (
                        <HudCheckbox
                            key={propertyName}
                            label={label}
                            xp={xp}
                            propertyName={propertyName}
                            checked={sitrepProperties[propertyName]?.checkbox ?? false}
                        />
                    ))}
                  </div>

                  <div className="mt-4 border border-cyan-900/60 bg-black/50 p-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Daily XP Pool
                    </p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">
                      {dailyXp} / {maxDailyXp}
                    </p>
                  </div>
                </HudPanel>
              </div>

              <div className="absolute right-8 top-32 z-10 w-[220px]">
                <HudPanel title="Weekly Operations">
                  <div className="space-y-1">
                    {weeklyObjectives.map(([label, xp]) => (
                      <ObjectiveRow key={label} label={label} xp={xp} />
                    ))}
                  </div>

                  <div className="mt-4 border border-cyan-900/60 bg-black/50 p-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Weekly XP Pool
                    </p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">
                      0 / 300
                    </p>
                  </div>
                </HudPanel>
              </div>

              <div className="pointer-events-none absolute inset-4 border border-cyan-400/20" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(8,145,178,0.35)]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}