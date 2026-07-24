import Image from "next/image";
import HudCheckbox from "../../components/HudCheckbox";
import HudPanel from "../../components/HudPanel"
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import { EventSystem } from "../../components/EventSystem";
import {
  differenceInDateKeys,
  getOperationalDateKey,
  getOperationalHour,
  getOperationalWeekRange,
} from "@/lib/date";
import { getCampaignPhaseDisplayName } from "@/lib/campaign";
import { getActiveCampaignEventState, getAlexServiceRecord, getOrCreateWeeklyOperations, getTodaySitrep, getWorkoutCountForWeek, updateWeeklyOperationCheckbox } from "@/lib/notion";

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

function getNumberProperty(properties: any, propertyName: string) {
  const property = properties[propertyName];

  if (!property) return 0;
  if (property.type === "number") return property.number ?? 0;
  if (property.type === "formula") {
    if (property.formula.type === "number") {
      return property.formula.number ?? 0;
    }
    return 0;
  }
  if (property.type === "rollup") {
    if (property.rollup.type === "number") {
      return property.rollup.number ?? 0;
    }
    if (property.rollup.type === "array") {
      const first = property.rollup.array?.[0];
      if (first?.type === "formula" && first.formula.type === "number") {
        return first.formula.number ?? 0;
      }
      if (first?.type === "number") {
        return first.number ?? 0;
      }
    }
  }
  return 0;
}

function getTextProperty(properties: any, propertyName: string) {
  const property = properties[propertyName];

  if (!property) return "";
  if (property.type === "rich_text") {
    return property.rich_text?.[0]?.plain_text ?? "";
  }
  if (property.type === "title") {
    return property.title?.[0]?.plain_text ?? "";
  }
  if (property.type === "select") {
    return property.select?.name ?? "";
  }
  if (property.type === "formula") {
    if (property.formula.type === "string") {
      return property.formula.string ?? "";
    }
    if (property.formula.type === "number") {
      return String(property.formula.number ?? "");
    }
    if (property.formula.type === "boolean") {
      return property.formula.boolean ? "Yes" : "No";
    }
    if (property.formula.type === "date") {
      return property.formula.date?.start ?? "";
    }
  }
  return "";
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

  const activeCampaignEventState = await getActiveCampaignEventState();
  const campaignStart = "2026-06-21";
  const today = getOperationalDateKey();
  const campaignDay =
    activeCampaignEventState.campaignDay ??
    differenceInDateKeys(campaignStart, today) + 1;
  const campaignName =
    activeCampaignEventState.campaignName ?? "Campaign Unassigned";
  const phaseName = getCampaignPhaseDisplayName(
    activeCampaignEventState.phaseName
  );
  const campaignDayProgress = activeCampaignEventState.phaseLength
    ? `${campaignDay} / ${activeCampaignEventState.phaseLength}`
    : String(campaignDay);
  const { startDateKey: weekStart } = getOperationalWeekRange(new Date(), 0);
  const weeklyOps = (await getOrCreateWeeklyOperations(weekStart)) as any;
  const weeklyProps = weeklyOps.properties;
  const weeklyPageId = weeklyOps.id;
  const weeklyXp = weeklyProps["Weekly XP"]?.formula?.number ?? 0;

  const workoutTarget = 3;
  const workoutsThisWeek = await getWorkoutCountForWeek(
    weekStart
  );
  const workoutObjectiveComplete = workoutsThisWeek >= workoutTarget;
  const workoutLabel = `Workouts ${Math.min(workoutsThisWeek, workoutTarget)}/${workoutTarget}`;
  const workoutsComplete = weeklyProps["Workouts"]?.checkbox ?? false;
  if (workoutObjectiveComplete && !workoutsComplete) {
    await updateWeeklyOperationCheckbox(
      weeklyPageId,
      "Workouts",
      true
    )
  }
  
  const shotComplete =
    weeklyProps["Shot"]?.checkbox ?? false;
  const planningComplete =
    weeklyProps["Planning"]?.checkbox ?? false;

    const currentHour = getOperationalHour();
    const hudBackground =
      currentHour >= 5 && currentHour < 8
        ? "/images/hud-obstacle-course-5.png"
        : currentHour >= 8 && currentHour < 11
          ? "/images/hud-tactical-class.png"
          : currentHour >= 11 && currentHour < 13
            ? "/images/hud-mess-hall.png"
            : currentHour >= 13 && currentHour < 16
              ? "/images/hud-briefing.png"
              : currentHour >= 16 && currentHour < 20
                ? "/images/hud-field-exercise.png"
                : currentHour >= 20 && currentHour < 22
                  ? "/images/hud-night-prep.png"
                  : "/images/hud-bedtime.png";

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
    [workoutLabel, 200, workoutObjectiveComplete],
    ["T Shot", 50, shotComplete],
    ["Plan Week", 50, planningComplete],
  ] as const;

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Tactical Interface" title="Command HUD" />

          <div className="mt-6 overflow-hidden border border-cyan-600/60 bg-black shadow-[0_0_35px_rgba(8,145,178,0.25)]">
            <div className="relative min-h-[720px] overflow-hidden">
              <Image
                src={hudBackground}
                alt="UNSC Command HUD rotating background"
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]" />

              <div className="absolute left-8 top-6 z-10 flex flex-col items-start gap-6">
                <div className="text-left">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-100">
                    {campaignName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {phaseName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                    Campaign Day {campaignDayProgress}
                  </p>
                </div>

                <div className="w-[230px]">
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
              </div>

              <div className="absolute right-8 top-6 z-10 text-right">
                <p className="text-xl font-bold tracking-[0.2em] text-cyan-100">
                  {designation}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-400">
                  Status: Active
                </p>
              </div>

              <EventSystem>
                <HudPanel title="Weekly Operations">
                  <div className="space-y-1">
                    <HudCheckbox
                      label={workoutLabel}
                      xp={200}
                      propertyName="Workouts"
                      checked={workoutObjectiveComplete}
                      apiPath="/api/weekly-operations"
                      pageId={weeklyPageId}
                    />
                    <HudCheckbox
                      label="T-Shot"
                      xp={50}
                      propertyName="Shot"
                      checked={shotComplete}
                      apiPath="/api/weekly-operations"
                      pageId={weeklyPageId}
                    />
                    <HudCheckbox
                      label="Plan Week"
                      xp={50}
                      propertyName="Planning"
                      checked={planningComplete}
                      apiPath="/api/weekly-operations"
                      pageId={weeklyPageId}
                    />
                  </div>

                  <div className="mt-4 border border-cyan-900/60 bg-black/50 p-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Weekly XP Pool
                    </p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">
                      {weeklyXp} / 300
                    </p>
                  </div>
                </HudPanel>
              </EventSystem>

              <div className="pointer-events-none absolute inset-4 border border-cyan-400/20" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(8,145,178,0.35)]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
