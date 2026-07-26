import "server-only";

import {
  addDaysToDateKey,
  differenceInDateKeys,
  getOperationalDateKey,
  getOperationalDayBounds,
} from "@/lib/date";
import {
  getNotionClient,
  getRequiredNotionId,
} from "@/lib/notion-client";
import { CampaignEvent, ReadinessScores } from "@/data/events";
import { eventCatalog } from "@/data/events";
import {
  evaluateRollover,
  getRolloverHistoryTitle,
  selectRolloverTransition,
  type RolloverEvaluation,
  type RolloverEvent,
  type RolloverPhase,
} from "@/lib/campaign-rollover";
import {
  calculatePhaseXp,
  expandHabitXpCeilings,
  type CampaignMedal,
  type CampaignMedalPace,
  type PhaseXpSummary,
} from "@/lib/phase-xp";
import {
  evaluateIndividualCompletion,
  toPersistedIndividualCompletionStatus,
  type IndividualCompletionEvaluation,
  type PersistedIndividualCompletionStatus,
} from "@/lib/individual-completion";
import {
  evaluateFireteamAssignment,
  FIRETEAM_ASSIGNMENT_HISTORY_TITLE,
  FIRETEAM_ASSIGNMENT_MAX_STEP,
  FIRETEAM_ASSIGNMENT_OPERATION_ID,
  FIRETEAM_ASSIGNMENT_VERSION,
  FIRETEAM_EPSILON,
  getCanonicalRosterSnapshot,
  isCanonicalFireteamAssignment,
  type FireteamAssignmentEvaluation,
  type FireteamAssignmentPersistenceStatus,
  type PersistedFireteamAssignment,
} from "@/lib/fireteam-assignment";
import {
  getUnitCohesionHabit,
  getUnitCohesionLedgerTitle,
  getUnitCohesionOperationId,
  getUnitCohesionRelationshipState,
  isUnitCohesionSourceEligible,
  summarizeUnitCohesionLedger,
  UNIT_COHESION_LEDGER_TITLE_PREFIX,
  UNIT_COHESION_VERSION,
  type UnitCohesionLedgerEntry,
  type UnitCohesionMemberId,
  type UnitCohesionSourceType,
} from "@/lib/unit-cohesion";
import {
  addStandingsMovement,
  calculateCumulativeStandings,
  FIRETEAM_STANDINGS_TITLE_PREFIX,
  FIRETEAM_STANDINGS_VERSION,
  getFireteamStandingsTitle,
  isPhaseTwoCompetitiveEvent,
  resolveFireteamEventScores,
  type FireteamStandingsResolution,
  type StandingsReadinessKey,
} from "@/lib/fireteam-standings";
import {
  buildAchievementServiceHistoryProperties,
  buildCampaignServiceHistoryProperties,
} from "@/lib/service-history";

type ServiceHistoryEntry = {
  eventTitle: string;
  eventType: string;
  campaignDay: number;
  xpReward: number;
  description?: string;
  eventPageId?: string | null;
  serviceRecordPageId?: string | null;
  campaignPageId?: string | null;
  completedAt?: string;
};

type CampaignEventPage = {
  id: string;
  title: string;
  isCompleted: boolean;
  phaseId: string | null;
};

export type CampaignEventState = {
  phaseId: string | null;
  campaignName: string | null;
  phaseName: string | null;
  nextPhaseName: string | null;
  phaseStartDate: string | null;
  campaignDay: number | null;
  phaseLength: number | null;
  maxDailyXp: number | null;
  maxWeeklyXp: number | null;
  maxHabitXp: number | null;
  maxEventXp: number | null;
  bronzeThresholdPercent: number | null;
  silverThresholdPercent: number | null;
  goldThresholdPercent: number | null;
  events: CampaignEvent[];
};

type NumberProperty = { number?: number | null };
type NotionProperties = Record<string, NumberProperty | undefined>;
type EventQueryResult = {
  id: string;
  properties: {
    "Event Name"?: { title?: Array<{ plain_text?: string }> };
    "Event ID"?: { rich_text?: Array<{ plain_text?: string }> };
    Campaign?: { relation?: Array<{ id: string }> };
    "Encounter Type"?: { select?: { name?: string } | null };
    "Event Day"?: { number?: number | null };
    "Physical Req"?: { number?: number | null };
    "Recovery Req"?: { number?: number | null };
    "Intelligence Req"?: { number?: number | null };
    "Professional Req"?: { number?: number | null };
    "Bonus Req"?: { number?: number | null };
    Status?: { select?: { name?: string } | null };
    "Date Completed"?: { date?: { start?: string | null } | null };
  };
};

type CampaignPhasePage = {
  id: string;
  parent?: {
    type?: string;
    data_source_id?: string;
  };
  properties: {
    "Phase Status"?: { select?: { name?: string } | null };
    "Campaign Name"?: { title?: Array<{ plain_text?: string }> };
    "Campaign Phase"?: { rich_text?: Array<{ plain_text?: string }> };
    "Campaign Number"?: { number?: number | null };
    "Phase Number"?: { number?: number | null };
    "Campaign Day"?: { formula?: { number?: number | null } };
    "Phase Length"?: { number?: number | null };
    "Phase Start Date"?: { date?: { start?: string | null } | null };
    Status?: { select?: { name?: string } | null };
    "Max Campaign XP"?: { formula?: { number?: number | null } };
    "Max Daily XP"?: { rollup?: { number?: number | null } };
    "Max Weekly XP"?: { rollup?: { number?: number | null } };
    "Max Event XP"?: { number?: number | null };
    "Bronze Readiness %"?: { number?: number | null };
    "Silver Readiness %"?: { number?: number | null };
    "Gold Readiness %"?: { number?: number | null };
    "Final Daily XP"?: { number?: number | null };
    "Final Weekly XP"?: { number?: number | null };
    "Final Event XP"?: { number?: number | null };
    "Final Phase XP"?: { number?: number | null };
    "Final Max Phase XP"?: { number?: number | null };
    "Final Medal Pace"?: { select?: { name?: string } | null };
    "Medal Earned"?: { select?: { name?: string } | null };
    "Phase Finalized At"?: { date?: { start?: string | null } | null };
    "XP Snapshot Version"?: { number?: number | null };
  };
};

type AlexServiceRecordPage = {
  id: string;
  properties: {
    "Progression Stage"?: { select?: { name?: string } | null };
    "Fireteam Eligibility Status"?: {
      select?: { name?: string } | null;
    };
    "Individual Completed At"?: {
      date?: { start?: string | null } | null;
    };
    "Eligibility Source Campaign"?: { relation?: Array<{ id: string }> };
    "Eligibility Evaluated At"?: {
      date?: { start?: string | null } | null;
    };
    "Eligibility Version"?: { number?: number | null };
    "Eligibility Explanation"?: {
      rich_text?: Array<{ plain_text?: string }>;
    };
    "Fireteam Assignment Status"?: {
      select?: { name?: string } | null;
    };
    "Fireteam Assignment Step"?: { number?: number | null };
    "Fireteam ID"?: { rich_text?: Array<{ plain_text?: string }> };
    "Fireteam Name"?: { rich_text?: Array<{ plain_text?: string }> };
    "Fireteam Motto"?: { rich_text?: Array<{ plain_text?: string }> };
    "Fireteam Assigned At"?: {
      date?: { start?: string | null } | null;
    };
    "Fireteam Assignment Version"?: { number?: number | null };
    "Fireteam Assignment Operation ID"?: {
      rich_text?: Array<{ plain_text?: string }>;
    };
    "Fireteam Roster Snapshot"?: {
      rich_text?: Array<{ plain_text?: string }>;
    };
    "Fireteam Assignment Updated At"?: {
      date?: { start?: string | null } | null;
    };
  };
};

export type CampaignPhaseXpState = PhaseXpSummary & {
  eventCount: number;
  eventHistoryCount: number;
  missingEventHistoryTitles: string[];
  duplicateEventHistoryTitles: string[];
};

export type FrozenPhaseXpSnapshot = {
  dailyXp: number;
  weeklyXp: number;
  eventXp: number;
  earnedXp: number;
  maxPhaseXp: number;
  medalPace: CampaignMedalPace;
  medalEarned: CampaignMedal;
  finalizedAt: string;
  version: number;
};

export type CampaignRolloverStatus = RolloverEvaluation & {
  operationalDate: string;
  historyTitle: string | null;
  phaseXp: CampaignPhaseXpState | null;
  frozenXpSnapshot: FrozenPhaseXpSnapshot | null;
};

export type IndividualCompletionStatus = IndividualCompletionEvaluation & {
  operationalDate: string;
  sourcePhase: RolloverPhase;
  phaseResult: FrozenPhaseXpSnapshot | null;
  persisted: {
    status: PersistedIndividualCompletionStatus;
    progressionStage: string | null;
    completedAt: string | null;
    evaluatedAt: string | null;
    version: number | null;
  };
};

export type FireteamAssignmentStatus = FireteamAssignmentEvaluation & {
  operationalDate: string;
  eligibility: IndividualCompletionStatus;
  fireteam: typeof FIRETEAM_EPSILON;
};

export type UnitCohesionStatus = {
  enabled: boolean;
  eligibleFrom: string | null;
  relationships: ReturnType<
    typeof getUnitCohesionRelationshipState
  >[];
  duplicateOperationIds: string[];
};

export class CampaignRolloverNotEligibleError extends Error {
  status: CampaignRolloverStatus;

  constructor(status: CampaignRolloverStatus) {
    super(status.reasons.join(" ") || "Campaign rollover is not eligible.");
    this.name = "CampaignRolloverNotEligibleError";
    this.status = status;
  }
}

export type ServiceHistoryRecord = {
  id: string;
  title: string;
  date: string | null;
  entryType: string;
  campaignDay: number | null;
  xpAwarded: number;
  readinessCategory: string;
  readinessPoints: number;
  description: string;
};

function getNumberProperty(properties: NotionProperties, name: string) {
  return properties[name]?.number ?? 0;
}

async function getServiceHistoryDataSourceId() {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID");
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = (database as unknown as { data_sources?: Array<{ id: string }> })
    .data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error("Service History data source not found");
  }

  return dataSourceId;
}

function getTextProperty(properties: Record<string, any>, name: string) {
  return (
    properties[name]?.title?.[0]?.plain_text ??
    properties[name]?.rich_text?.[0]?.plain_text ??
    properties[name]?.formula?.string ??
    ""
  );
}

export async function getServiceHistoryRecords(): Promise<ServiceHistoryRecord[]> {
  const dataSourceId = await getServiceHistoryDataSourceId();
  const results = await queryAllDataSourcePages({
    dataSourceId,
    filter: {
      and: [
        {
          property: "Title",
          title: {
            does_not_contain: UNIT_COHESION_LEDGER_TITLE_PREFIX,
          },
        },
        {
          property: "Title",
          title: {
            does_not_contain: FIRETEAM_STANDINGS_TITLE_PREFIX,
          },
        },
      ],
    },
  });
  return results
    .map((page: any) => {
      const properties = page.properties ?? {};
      return {
        id: page.id,
        title: getTextProperty(properties, "Title"),
        date: properties.Date?.date?.start ?? null,
        entryType:
          properties["Entry Type"]?.select?.name ?? "Record",
        campaignDay: properties["Campaign Day"]?.number ?? null,
        xpAwarded: properties["XP Awarded"]?.number ?? 0,
        readinessCategory:
          properties["Readiness Category"]?.select?.name ?? "None",
        readinessPoints: [
          "Physical",
          "Recovery",
          "Intelligence",
          "Professional",
        ].includes(
          properties["Readiness Category"]?.select?.name ?? ""
        )
          ? 1
          : 0,
        description: getTextProperty(properties, "Description"),
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function getEventId(properties: EventQueryResult["properties"]) {
  return properties["Event ID"]?.rich_text?.[0]?.plain_text ?? "";
}

function getEventPresentation(eventId: string, title: string) {
  return eventCatalog.find(
    (event) => event.id === eventId || event.title === title
  );
}

function toCampaignEvent(event: EventQueryResult): CampaignEvent {
  const properties = event.properties;
  const title = properties["Event Name"]?.title?.[0]?.plain_text ?? "Unnamed Event";
  const id = getEventId(properties) || event.id;
  const presentation = getEventPresentation(id, title);
  const minimums = {
    physical: properties["Physical Req"]?.number ?? 0,
    recovery: properties["Recovery Req"]?.number ?? 0,
    intelligence: properties["Intelligence Req"]?.number ?? 0,
    professional: properties["Professional Req"]?.number ?? 0,
  };
  const nonZeroMinimums = Object.fromEntries(
    Object.entries(minimums).filter(([, value]) => value > 0)
  );
  const bonusRequirement = properties["Bonus Req"]?.number ?? 0;
  const persistedStatus = properties.Status?.select?.name;

  return {
    id,
    pageId: event.id,
    phaseId: properties.Campaign?.relation?.[0]?.id ?? null,
    title,
    type:
      properties["Encounter Type"]?.select?.name === "Major Event"
        ? "Major Event"
        : "Minor Event",
    unlockDay: properties["Event Day"]?.number ?? 0,
    location: presentation?.location ?? "Command Operations",
    prompt: presentation?.prompt ?? "Operational event ready for review.",
    buttonText: presentation?.buttonText ?? "Review Event",
    backgroundImage: presentation?.backgroundImage,
    xpReward: presentation?.xpReward,
    readinessRequirements:
      Object.keys(nonZeroMinimums).length > 0 || bonusRequirement > 0
        ? {
            minimums: nonZeroMinimums,
            ...(bonusRequirement > 0
              ? {
                  atLeastOne: {
                    keys: ["physical", "recovery", "intelligence", "professional"],
                    minimum: bonusRequirement,
                  },
                }
              : {}),
          }
        : undefined,
    persistedStatus:
      persistedStatus === "Locked" ||
      persistedStatus === "Active" ||
      persistedStatus === "Failed" ||
      persistedStatus === "Defeated"
        ? persistedStatus
        : "Unknown",
    completedAt: properties["Date Completed"]?.date?.start ?? null,
  };
}

/** Resolves the active Campaign Operations phase and its related Events. */
export async function getActiveCampaignEventState(): Promise<CampaignEventState> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("EVENTS_DATABASE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  });
  const events = response.results as unknown as EventQueryResult[];
  const phaseIds = [
    ...new Set(
      events.flatMap((event) =>
        event.properties.Campaign?.relation?.map((relation) => relation.id) ?? []
      )
    ),
  ];
  const phases = await Promise.all(
    phaseIds.map((page_id) => notion.pages.retrieve({ page_id }))
  );
  const activePhase = (phases as unknown as CampaignPhasePage[]).find(
    (phase) => phase.properties["Phase Status"]?.select?.name === "Active"
  );

  if (!activePhase) {
    return {
      phaseId: null,
      campaignName: null,
      phaseName: null,
      nextPhaseName: null,
      phaseStartDate: null,
      campaignDay: null,
      phaseLength: null,
      maxDailyXp: null,
      maxWeeklyXp: null,
      maxHabitXp: null,
      maxEventXp: null,
      bronzeThresholdPercent: null,
      silverThresholdPercent: null,
      goldThresholdPercent: null,
      events: [],
    };
  }

  const campaignName =
    activePhase.properties["Campaign Name"]?.title?.[0]?.plain_text ?? null;
  const phaseName =
    activePhase.properties["Campaign Phase"]?.rich_text?.[0]?.plain_text ?? null;
  const phaseNumber =
    activePhase.properties["Phase Number"]?.number ?? null;
  const campaignNumber =
    activePhase.properties["Campaign Number"]?.number ?? null;
  const campaignPhaseDataSourceId =
    activePhase.parent?.type === "data_source_id"
      ? activePhase.parent.data_source_id
      : null;
  let nextPhaseName: string | null = null;

  if (
    campaignPhaseDataSourceId &&
    phaseNumber !== null &&
    campaignNumber !== null
  ) {
    const nextPhaseResponse = await notion.dataSources.query({
      data_source_id: campaignPhaseDataSourceId,
      filter: {
        and: [
          {
            property: "Campaign Number",
            number: { equals: campaignNumber },
          },
          {
            property: "Phase Number",
            number: { greater_than: phaseNumber },
          },
        ],
      },
      sorts: [{ property: "Phase Number", direction: "ascending" }],
      page_size: 1,
    });
    const nextPhase =
      nextPhaseResponse.results[0] as unknown as CampaignPhasePage | undefined;
    nextPhaseName =
      nextPhase?.properties["Campaign Phase"]?.rich_text?.[0]?.plain_text ??
      null;
  }

  return {
    phaseId: activePhase.id,
    campaignName,
    phaseName,
    nextPhaseName,
    phaseStartDate:
      activePhase.properties["Phase Start Date"]?.date?.start?.slice(0, 10) ??
      null,
    campaignDay:
      activePhase.properties["Campaign Day"]?.formula?.number ?? null,
    phaseLength: activePhase.properties["Phase Length"]?.number ?? null,
    maxDailyXp:
      activePhase.properties["Max Daily XP"]?.rollup?.number ?? null,
    maxWeeklyXp:
      activePhase.properties["Max Weekly XP"]?.rollup?.number ?? null,
    maxHabitXp:
      activePhase.properties["Max Campaign XP"]?.formula?.number ?? null,
    maxEventXp:
      activePhase.properties["Max Event XP"]?.number ?? null,
    bronzeThresholdPercent:
      activePhase.properties["Bronze Readiness %"]?.number ?? null,
    silverThresholdPercent:
      activePhase.properties["Silver Readiness %"]?.number ?? null,
    goldThresholdPercent:
      activePhase.properties["Gold Readiness %"]?.number ?? null,
    events: events
      .map(toCampaignEvent)
      .filter((event) => event.phaseId === activePhase.id)
      .sort((a, b) => a.unlockDay - b.unlockDay),
  };
}

async function queryAllDataSourcePages({
  dataSourceId,
  filter,
}: {
  dataSourceId: string;
  filter: Record<string, unknown>;
}) {
  const notion = getNotionClient();
  const results: unknown[] = [];
  let startCursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: filter as never,
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });
    results.push(...response.results);
    startCursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (startCursor);

  return results;
}

async function getPhaseEventRecords(phaseId: string) {
  const results = await queryAllDataSourcePages({
    dataSourceId: getRequiredNotionId("EVENTS_DATABASE_ID"),
    filter: {
      property: "Campaign",
      relation: { contains: phaseId },
    },
  });

  return results as EventQueryResult[];
}

async function getPhaseEventXp(events: EventQueryResult[]) {
  if (events.length === 0) {
    return {
      eventXp: 0,
      eventHistoryCount: 0,
      missingEventHistoryTitles: [],
      duplicateEventHistoryTitles: [],
    };
  }

  const eventIds = new Set(events.map((event) => event.id));
  const historyResults = await queryAllDataSourcePages({
    dataSourceId: await getServiceHistoryDataSourceId(),
    filter: {
      or: events.map((event) => ({
        property: "Related Event",
        relation: { contains: event.id },
      })),
    },
  });
  const histories = historyResults as Array<{
    properties?: {
      "XP Awarded"?: { number?: number | null };
      "Related Event"?: { relation?: Array<{ id: string }> };
    };
  }>;
  const historiesByEvent = new Map<string, number>();
  let eventXp = 0;

  for (const history of histories) {
    eventXp += history.properties?.["XP Awarded"]?.number ?? 0;

    for (const relation of history.properties?.["Related Event"]?.relation ??
      []) {
      if (eventIds.has(relation.id)) {
        historiesByEvent.set(
          relation.id,
          (historiesByEvent.get(relation.id) ?? 0) + 1
        );
      }
    }
  }

  const getTitle = (event: EventQueryResult) =>
    event.properties["Event Name"]?.title?.[0]?.plain_text ?? "Unnamed Event";

  return {
    eventXp,
    eventHistoryCount: histories.length,
    missingEventHistoryTitles: events
      .filter((event) => !historiesByEvent.has(event.id))
      .map(getTitle),
    duplicateEventHistoryTitles: events
      .filter((event) => (historiesByEvent.get(event.id) ?? 0) > 1)
      .map(getTitle),
  };
}

async function getCampaignPhaseXpState({
  phaseStartDate,
  phaseLength,
  maxDailyXp,
  maxWeeklyXp,
  maxHabitXp,
  maxEventXp,
  bronzeThresholdPercent,
  silverThresholdPercent,
  goldThresholdPercent,
  events,
  operationalDate,
}: {
  phaseStartDate: string;
  phaseLength: number;
  maxDailyXp: number | null;
  maxWeeklyXp: number | null;
  maxHabitXp: number | null;
  maxEventXp: number | null;
  bronzeThresholdPercent: number | null;
  silverThresholdPercent: number | null;
  goldThresholdPercent: number | null;
  events: EventQueryResult[];
  operationalDate: string;
}): Promise<CampaignPhaseXpState> {
  const phaseEndDate = addDaysToDateKey(phaseStartDate, phaseLength - 1);
  const effectiveEndDate =
    operationalDate < phaseEndDate ? operationalDate : phaseEndDate;
  const elapsedDays =
    operationalDate < phaseStartDate
      ? 0
      : Math.min(
          phaseLength,
          differenceInDateKeys(phaseStartDate, operationalDate) + 1
        );
  const [dailyResults, weeklyResults, eventState] = await Promise.all([
    elapsedDays > 0
      ? queryAllDataSourcePages({
          dataSourceId: getRequiredNotionId("DAILY_SITREP_DATA_SOURCE_ID"),
          filter: {
            and: [
              {
                property: "Mission Date",
                date: { on_or_after: phaseStartDate },
              },
              {
                property: "Mission Date",
                date: { on_or_before: effectiveEndDate },
              },
            ],
          },
        })
      : Promise.resolve([]),
    elapsedDays > 0
      ? queryAllDataSourcePages({
          dataSourceId: getRequiredNotionId(
            "WEEKLY_OPERATIONS_DATABASE_ID"
          ),
          filter: {
            and: [
              {
                property: "Week Start",
                date: { on_or_after: phaseStartDate },
              },
              {
                property: "Week Start",
                date: { on_or_before: effectiveEndDate },
              },
            ],
          },
        })
      : Promise.resolve([]),
    getPhaseEventXp(events),
  ]);
  const sumFormulaNumber = (results: unknown[], propertyName: string) =>
    results.reduce<number>((total, page) => {
      const properties = (
        page as {
          properties?: Record<
            string,
            { formula?: { number?: number | null } } | undefined
          >;
        }
      ).properties;
      return total + (properties?.[propertyName]?.formula?.number ?? 0);
    }, 0);
  const habitXpCeilings = expandHabitXpCeilings({
    dailyXpPerDay: maxDailyXp,
    weeklyXpPerWeek: maxWeeklyXp,
    maxHabitXp,
    phaseLength,
  });

  return {
    ...calculatePhaseXp({
      dailyXp: sumFormulaNumber(dailyResults, "Daily XP"),
      weeklyXp: sumFormulaNumber(weeklyResults, "Weekly XP"),
      eventXp: eventState.eventXp,
      maxDailyXp: habitXpCeilings.maxDailyXp,
      maxWeeklyXp: habitXpCeilings.maxWeeklyXp,
      maxEventXp: maxEventXp ?? 0,
      bronzePercent: bronzeThresholdPercent ?? 0,
      silverPercent: silverThresholdPercent ?? 0,
      goldPercent: goldThresholdPercent ?? 0,
      elapsedDays,
      phaseLength,
    }),
    eventCount: events.length,
    eventHistoryCount: eventState.eventHistoryCount,
    missingEventHistoryTitles: eventState.missingEventHistoryTitles,
    duplicateEventHistoryTitles: eventState.duplicateEventHistoryTitles,
  };
}

export async function getCampaignPhaseXpSummary(
  eventState: CampaignEventState,
  operationalDate = getOperationalDateKey()
) {
  if (
    !eventState.phaseId ||
    !eventState.phaseStartDate ||
    !eventState.phaseLength
  ) {
    return null;
  }

  const events = await getPhaseEventRecords(eventState.phaseId);

  return getCampaignPhaseXpState({
    phaseStartDate: eventState.phaseStartDate,
    phaseLength: eventState.phaseLength,
    maxDailyXp: eventState.maxDailyXp,
    maxWeeklyXp: eventState.maxWeeklyXp,
    maxHabitXp: eventState.maxHabitXp,
    maxEventXp: eventState.maxEventXp,
    bronzeThresholdPercent: eventState.bronzeThresholdPercent,
    silverThresholdPercent: eventState.silverThresholdPercent,
    goldThresholdPercent: eventState.goldThresholdPercent,
    events,
    operationalDate,
  });
}

function toRolloverPhase(page: CampaignPhasePage): RolloverPhase {
  return {
    id: page.id,
    campaignName:
      page.properties["Campaign Name"]?.title?.[0]?.plain_text ??
      "Unnamed Campaign",
    campaignNumber: page.properties["Campaign Number"]?.number ?? 0,
    phaseName:
      page.properties["Campaign Phase"]?.rich_text?.[0]?.plain_text ??
      "Unnamed Phase",
    phaseNumber: page.properties["Phase Number"]?.number ?? 0,
    phaseLength: page.properties["Phase Length"]?.number ?? 0,
    startDate:
      page.properties["Phase Start Date"]?.date?.start?.slice(0, 10) ?? null,
    phaseStatus: page.properties["Phase Status"]?.select?.name ?? null,
    status: page.properties.Status?.select?.name ?? null,
  };
}

async function getCampaignRolloverRecords(): Promise<{
  phases: RolloverPhase[];
  events: EventQueryResult[];
}> {
  const notion = getNotionClient();
  const eventDataSourceId = getRequiredNotionId("EVENTS_DATABASE_ID");
  const eventResponse = await notion.dataSources.query({
    data_source_id: eventDataSourceId,
    page_size: 100,
  });
  const events = eventResponse.results as unknown as EventQueryResult[];
  const phaseIds = [
    ...new Set(
      events.flatMap((event) =>
        event.properties.Campaign?.relation?.map(({ id }) => id) ?? []
      )
    ),
  ];

  if (phaseIds.length === 0) {
    return { phases: [], events };
  }

  const relatedPhases = (await Promise.all(
    phaseIds.map((page_id) => notion.pages.retrieve({ page_id }))
  )) as unknown as CampaignPhasePage[];
  const campaignDataSourceId = relatedPhases.find(
    (phase) =>
      phase.parent?.type === "data_source_id" &&
      Boolean(phase.parent.data_source_id)
  )?.parent?.data_source_id;

  if (!campaignDataSourceId) {
    throw new Error("Campaign Operations data source not found");
  }

  const campaignResponse = await notion.dataSources.query({
    data_source_id: campaignDataSourceId,
    page_size: 100,
  });

  return {
    phases: (campaignResponse.results as unknown as CampaignPhasePage[]).map(
      toRolloverPhase
    ),
    events,
  };
}

function getFrozenPhaseXpSnapshot(
  phase: CampaignPhasePage
): FrozenPhaseXpSnapshot | null {
  const finalizedAt =
    phase.properties["Phase Finalized At"]?.date?.start ?? null;

  if (!finalizedAt) {
    return null;
  }

  const dailyXp = phase.properties["Final Daily XP"]?.number;
  const weeklyXp = phase.properties["Final Weekly XP"]?.number;
  const eventXp = phase.properties["Final Event XP"]?.number;
  const earnedXp = phase.properties["Final Phase XP"]?.number;
  const maxPhaseXp = phase.properties["Final Max Phase XP"]?.number;
  const medalPace = phase.properties["Final Medal Pace"]?.select?.name;
  const medalEarned = phase.properties["Medal Earned"]?.select?.name;
  const version = phase.properties["XP Snapshot Version"]?.number;
  const validPaces: CampaignMedalPace[] = [
    "Gold Pace",
    "Silver Pace",
    "Bronze Pace",
    "Unrated Pace",
  ];
  const validMedals: CampaignMedal[] = [
    "Gold",
    "Silver",
    "Bronze",
    "None",
  ];

  if (
    dailyXp === null ||
    dailyXp === undefined ||
    weeklyXp === null ||
    weeklyXp === undefined ||
    eventXp === null ||
    eventXp === undefined ||
    earnedXp === null ||
    earnedXp === undefined ||
    maxPhaseXp === null ||
    maxPhaseXp === undefined ||
    !validPaces.includes(medalPace as CampaignMedalPace) ||
    !validMedals.includes(medalEarned as CampaignMedal) ||
    version !== 1
  ) {
    throw new Error(
      `Campaign phase ${phase.id} has an incomplete frozen XP snapshot`
    );
  }

  return {
    dailyXp,
    weeklyXp,
    eventXp,
    earnedXp,
    maxPhaseXp,
    medalPace: medalPace as CampaignMedalPace,
    medalEarned: medalEarned as CampaignMedal,
    finalizedAt,
    version,
  };
}

async function getRolloverPhaseXpState(
  phaseId: string,
  operationalDate: string
) {
  const phase = (await getNotionClient().pages.retrieve({
    page_id: phaseId,
  })) as unknown as CampaignPhasePage;
  const events = await getPhaseEventRecords(phaseId);
  const phaseStartDate =
    phase.properties["Phase Start Date"]?.date?.start?.slice(0, 10) ?? null;
  const phaseLength = phase.properties["Phase Length"]?.number ?? null;

  if (!phaseStartDate || !phaseLength) {
    throw new Error("Campaign phase is missing its start date or length");
  }

  const maxWeeklyXp =
    phase.properties["Max Weekly XP"]?.rollup?.number ?? null;

  return {
    phase,
    frozenSnapshot: getFrozenPhaseXpSnapshot(phase),
    phaseXp: await getCampaignPhaseXpState({
      phaseStartDate,
      phaseLength,
      maxDailyXp: phase.properties["Max Daily XP"]?.rollup?.number ?? null,
      maxWeeklyXp,
      maxHabitXp:
        phase.properties["Max Campaign XP"]?.formula?.number ?? null,
      maxEventXp: phase.properties["Max Event XP"]?.number ?? null,
      bronzeThresholdPercent:
        phase.properties["Bronze Readiness %"]?.number ?? null,
      silverThresholdPercent:
        phase.properties["Silver Readiness %"]?.number ?? null,
      goldThresholdPercent:
        phase.properties["Gold Readiness %"]?.number ?? null,
      events,
      operationalDate,
    }),
  };
}

async function ensureFrozenPhaseXpSnapshot(
  phaseId: string,
  operationalDate: string
) {
  const state = await getRolloverPhaseXpState(phaseId, operationalDate);

  if (state.frozenSnapshot) {
    return state.frozenSnapshot;
  }

  if (
    state.phaseXp.elapsedDays <
    (state.phase.properties["Phase Length"]?.number ?? 1)
  ) {
    throw new Error(
      "Campaign phase XP cannot be frozen before the completion boundary"
    );
  }

  if (state.phaseXp.missingEventHistoryTitles.length > 0) {
    throw new Error(
      `Campaign event XP history is missing for: ${state.phaseXp.missingEventHistoryTitles.join(
        ", "
      )}`
    );
  }

  if (state.phaseXp.duplicateEventHistoryTitles.length > 0) {
    throw new Error(
      `Duplicate campaign event XP history exists for: ${state.phaseXp.duplicateEventHistoryTitles.join(
        ", "
      )}`
    );
  }

  const medalPace =
    state.phaseXp.earnedMedal === "None"
      ? "Unrated Pace"
      : (`${state.phaseXp.earnedMedal} Pace` as CampaignMedalPace);
  const snapshot: FrozenPhaseXpSnapshot = {
    dailyXp: state.phaseXp.dailyXp,
    weeklyXp: state.phaseXp.weeklyXp,
    eventXp: state.phaseXp.eventXp,
    earnedXp: state.phaseXp.earnedXp,
    maxPhaseXp: state.phaseXp.maxPhaseXp,
    medalPace,
    medalEarned: state.phaseXp.earnedMedal,
    finalizedAt: operationalDate,
    version: 1,
  };

  await getNotionClient().pages.update({
    page_id: phaseId,
    properties: {
      "Final Daily XP": { number: snapshot.dailyXp },
      "Final Weekly XP": { number: snapshot.weeklyXp },
      "Final Event XP": { number: snapshot.eventXp },
      "Final Phase XP": { number: snapshot.earnedXp },
      "Final Max Phase XP": { number: snapshot.maxPhaseXp },
      "Final Medal Pace": { select: { name: snapshot.medalPace } },
      "Medal Earned": { select: { name: snapshot.medalEarned } },
      "Phase Finalized At": { date: { start: snapshot.finalizedAt } },
      "XP Snapshot Version": { number: snapshot.version },
    },
  });

  const verified = await getRolloverPhaseXpState(phaseId, operationalDate);

  if (!verified.frozenSnapshot) {
    throw new Error("Campaign phase XP snapshot did not verify");
  }

  return verified.frozenSnapshot;
}

async function hasCampaignRolloverHistory(
  phase: RolloverPhase,
  historyTitle = getRolloverHistoryTitle(phase)
) {
  const notion = getNotionClient();
  const dataSourceId = await getServiceHistoryDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: "Title",
          title: { equals: historyTitle },
        },
        {
          property: "Entry Type",
          select: { equals: "Campaign" },
        },
        {
          property: "Related Campaign",
          relation: { contains: phase.id },
        },
      ],
    },
    page_size: 1,
  });

  return response.results.length > 0;
}

export async function getCampaignRolloverStatus(
  operationalDate = getOperationalDateKey()
): Promise<CampaignRolloverStatus> {
  const { phases, events } = await getCampaignRolloverRecords();
  const transition = selectRolloverTransition(phases, operationalDate);
  const sourceEvents = transition
    ? events.filter(
        (event) =>
          event.properties.Campaign?.relation?.[0]?.id === transition.source.id
      )
    : [];
  const rolloverEvents: RolloverEvent[] = await Promise.all(
    sourceEvents.map(async (event) => ({
      id: event.id,
      phaseId: event.properties.Campaign?.relation?.[0]?.id ?? null,
      title:
        event.properties["Event Name"]?.title?.[0]?.plain_text ??
        "Unnamed Event",
      status: event.properties.Status?.select?.name ?? null,
      completedAt: event.properties["Date Completed"]?.date?.start ?? null,
      hasCompletionHistory: await hasServiceHistoryForEvent(event.id),
    }))
  );
  const historyTitle = transition
    ? getRolloverHistoryTitle(transition.source)
    : null;
  const historyExists = transition
    ? await hasCampaignRolloverHistory(transition.source, historyTitle!)
    : false;
  const evaluation = evaluateRollover({
    phases,
    events: rolloverEvents,
    operationalDate,
    historyExists,
  });
  const xpState = transition
    ? await getRolloverPhaseXpState(transition.source.id, operationalDate)
    : null;
  const snapshotReasons: string[] = [];

  if (evaluation.eligible && xpState && !xpState.frozenSnapshot) {
    const phaseLength =
      xpState.phase.properties["Phase Length"]?.number ?? 0;

    if (xpState.phaseXp.elapsedDays < phaseLength) {
      snapshotReasons.push(
        "The outgoing phase has not reached its XP completion boundary."
      );
    }

    if (xpState.phaseXp.missingEventHistoryTitles.length > 0) {
      snapshotReasons.push(
        `Event XP history is missing for: ${xpState.phaseXp.missingEventHistoryTitles.join(
          ", "
        )}.`
      );
    }

    if (xpState.phaseXp.duplicateEventHistoryTitles.length > 0) {
      snapshotReasons.push(
        `Duplicate event XP history exists for: ${xpState.phaseXp.duplicateEventHistoryTitles.join(
          ", "
        )}.`
      );
    }
  }

  if (snapshotReasons.length > 0) {
    return {
      ...evaluation,
      state: "blocked",
      eligible: false,
      reasons: [...evaluation.reasons, ...snapshotReasons],
      operationalDate,
      historyTitle,
      phaseXp: xpState?.phaseXp ?? null,
      frozenXpSnapshot: xpState?.frozenSnapshot ?? null,
    };
  }

  const state =
    evaluation.state === "complete" && !xpState?.frozenSnapshot
      ? "recovery"
      : evaluation.state === "ready" && xpState?.frozenSnapshot
        ? "recovery"
        : evaluation.state;

  return {
    ...evaluation,
    state,
    operationalDate,
    historyTitle,
    phaseXp: xpState?.phaseXp ?? null,
    frozenXpSnapshot: xpState?.frozenSnapshot ?? null,
  };
}

async function createCampaignRolloverHistory(
  source: RolloverPhase,
  target: RolloverPhase,
  operationalDate: string,
  snapshot: FrozenPhaseXpSnapshot
) {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID");
  const serviceRecordPageId = await getAlexServiceRecordPageId();
  const historyTitle = getRolloverHistoryTitle(source);

  if (await hasCampaignRolloverHistory(source, historyTitle)) {
    return false;
  }

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Title: { title: [{ text: { content: historyTitle } }] },
      Date: { date: { start: operationalDate } },
      "Campaign Day": { number: source.phaseLength || null },
      "Entry Type": { select: { name: "Campaign" } },
      "XP Awarded": { number: 0 },
      "Readiness Category": { select: { name: "None" } },
      Description: {
        rich_text: [
          {
            text: {
              content: `${source.campaignName} ${source.phaseName} completed with ${snapshot.earnedXp} XP and a ${snapshot.medalEarned} campaign medal. ${target.phaseName} activated.`,
            },
          },
        ],
      },
      "Related Campaign": { relation: [{ id: source.id }] },
      ...(serviceRecordPageId
        ? {
            "Related Service Record": {
              relation: [{ id: serviceRecordPageId }],
            },
          }
        : {}),
    },
  });

  return true;
}

let activeCampaignRollover: Promise<CampaignRolloverStatus> | null = null;

async function executeCampaignRolloverInternal(
  operationalDate: string
): Promise<CampaignRolloverStatus> {
  const initial = await getCampaignRolloverStatus(operationalDate);

  if (!initial.eligible || !initial.transition) {
    throw new CampaignRolloverNotEligibleError(initial);
  }

  const { source, target } = initial.transition;
  const snapshot = await ensureFrozenPhaseXpSnapshot(
    source.id,
    operationalDate
  );
  await createCampaignRolloverHistory(
    source,
    target,
    operationalDate,
    snapshot
  );

  if (source.phaseStatus !== "Complete" || source.status !== "Complete") {
    await getNotionClient().pages.update({
      page_id: source.id,
      properties: {
        "Phase Status": { select: { name: "Complete" } },
        Status: { select: { name: "Complete" } },
      },
    });
  }

  if (target.phaseStatus !== "Active" || target.status !== "Active") {
    await getNotionClient().pages.update({
      page_id: target.id,
      properties: {
        "Phase Status": { select: { name: "Active" } },
        Status: { select: { name: "Active" } },
      },
    });
  }

  const verified = await getCampaignRolloverStatus(operationalDate);

  if (verified.state !== "complete") {
    throw new Error(
      "Campaign rollover writes completed but final verification failed"
    );
  }

  const eligibility = await persistIndividualCompletionEligibility(
    operationalDate
  );

  if (
    eligibility.state !== "eligible" &&
    eligibility.state !== "assigned"
  ) {
    throw new Error(
      "Campaign rollover completed but Individual completion eligibility did not verify"
    );
  }

  return verified;
}

export function executeCampaignRollover(
  operationalDate = getOperationalDateKey()
) {
  if (!activeCampaignRollover) {
    activeCampaignRollover = executeCampaignRolloverInternal(
      operationalDate
    ).finally(() => {
      activeCampaignRollover = null;
    });
  }

  return activeCampaignRollover;
}

export async function findCampaignEvent(
  eventId: string,
  eventPageId?: string
): Promise<CampaignEventPage | null> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("EVENTS_DATABASE_ID");
  let event: EventQueryResult | undefined;

  if (eventPageId) {
    event = (await notion.pages.retrieve({
      page_id: eventPageId,
    })) as unknown as EventQueryResult;
  } else {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Event ID",
        rich_text: { equals: eventId },
      },
      page_size: 2,
    });
    const catalogEvent = eventCatalog.find(
      (candidate) => candidate.id === eventId
    );
    const fallbackResponse =
      response.results.length === 0 && catalogEvent
        ? await notion.dataSources.query({
            data_source_id: dataSourceId,
            filter: {
              property: "Event Name",
              title: { equals: catalogEvent.title },
            },
            page_size: 2,
          })
        : response;

    if (fallbackResponse.results.length > 1) {
      throw new Error(
        `Multiple Campaign Event records match ${eventId}`
      );
    }

    event = fallbackResponse.results[0] as unknown as
      | EventQueryResult
      | undefined;
  }

  if (!event) return null;

  const persistedEventId = getEventId(event.properties);
  const catalogEvent = eventCatalog.find(
    (candidate) => candidate.id === eventId
  );
  const persistedTitle =
    event.properties["Event Name"]?.title?.[0]?.plain_text ?? "";

  if (
    (persistedEventId && persistedEventId !== eventId) ||
    (!persistedEventId &&
      catalogEvent &&
      persistedTitle !== catalogEvent.title)
  ) {
    return null;
  }

  return {
    id: event.id,
    title: persistedTitle || eventId,
    // Some legacy event rows were completed manually without an Event History
    // relation (and a few are missing the Event ID). Treat the durable
    // completion date as authoritative alongside the explicit status so those
    // rows cannot reappear as active events.
    isCompleted:
      event.properties.Status?.select?.name === "Defeated" ||
      Boolean(event.properties["Date Completed"]?.date?.start),
    phaseId: event.properties.Campaign?.relation?.[0]?.id ?? null,
  };
}

async function hasServiceHistoryForEvent(eventPageId: string) {
  return (await getServiceHistoryForEventRecords(eventPageId)).length > 0;
}

async function getServiceHistoryForEventRecords(eventPageId: string) {
  const dataSourceId = await getServiceHistoryDataSourceId();
  return queryAllDataSourcePages({
    dataSourceId,
    filter: {
      property: "Related Event",
      relation: { contains: eventPageId },
    },
  });
}

export async function isCampaignEventCompleted(eventPage: CampaignEventPage) {
  return eventPage.isCompleted || hasServiceHistoryForEvent(eventPage.id);
}

export async function markCampaignEventFailed(eventPageId: string) {
  await getNotionClient().pages.update({
    page_id: eventPageId,
    properties: {
      Status: { select: { name: "Failed" } },
    },
  });
}

export async function getCompletedCampaignEventIds(events: CampaignEvent[]) {
  const completed = await Promise.all(
    events.map(async (event) => ({
      eventId: event.id,
      completed:
        event.persistedStatus === "Defeated" ||
        Boolean(event.completedAt) ||
        (await hasServiceHistoryForEvent(event.pageId)),
    }))
  );

  return completed
    .filter((event) => event.completed)
    .map((event) => event.eventId);
}

export async function getAlexReadinessScores(): Promise<ReadinessScores> {
  const serviceRecord = await getAlexServiceRecord();
  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const properties = (serviceRecord as unknown as { properties?: NotionProperties })
    .properties ?? {};
  const storedScores = {
    physical: getNumberProperty(properties, "Physical Readiness"),
    recovery: getNumberProperty(properties, "Recovery Readiness"),
    intelligence: getNumberProperty(properties, "Intelligence Readiness"),
    professional: getNumberProperty(properties, "Professional Readiness"),
  };

  const achievementsDataSourceId = process.env.ACHIEVEMENTS_DATA_SOURCE_ID;
  if (!achievementsDataSourceId) return storedScores;

  const notion = getNotionClient();
  const earnedAchievements = await notion.dataSources.query({
    data_source_id: achievementsDataSourceId,
    filter: {
      property: "Status",
      formula: { string: { equals: "Earned" } },
    },
    page_size: 100,
  });

  const achievementScores = earnedAchievements.results.reduce(
    (scores, page: any) => {
      const achievementProperties = page.properties ?? {};
      scores.physical += getNumberProperty(achievementProperties, "Physical Point");
      scores.recovery += getNumberProperty(achievementProperties, "Recovery Point");
      scores.intelligence += getNumberProperty(
        achievementProperties,
        "Intelligence Point"
      );
      scores.professional += getNumberProperty(
        achievementProperties,
        "Professional Point"
      );
      return scores;
    },
    { physical: 0, recovery: 0, intelligence: 0, professional: 0 }
  );

  return achievementScores;
}

export async function completeCampaignEvent({
  eventPageId,
  eventId,
  eventTitle,
  eventType,
  eventDay,
  campaignDay,
  xpReward,
  description,
  serviceRecordPageId,
  campaignPageId,
  readinessSnapshot,
  readinessRequirements,
}: ServiceHistoryEntry & {
  eventPageId: string;
  eventId: string;
  eventDay: number;
  readinessSnapshot: ReadinessScores;
  readinessRequirements?: CampaignEvent["readinessRequirements"];
}) {
  return runCampaignEventCompletion(eventPageId, async () => {
    const existingHistory =
      await getServiceHistoryForEventRecords(eventPageId);

    if (existingHistory.length > 1) {
      throw new Error(
        `Multiple Service History records exist for Campaign Event ${eventPageId}`
      );
    }

    const eventBefore = await getNotionClient().pages.retrieve({
      page_id: eventPageId,
    });
    const beforeProperties = (eventBefore as unknown as EventQueryResult)
      .properties;
    const eventWasCompleted =
      beforeProperties.Status?.select?.name === "Defeated" &&
      Boolean(beforeProperties["Date Completed"]?.date?.start);
    const standingsResolution =
      isPhaseTwoCompetitiveEvent(eventId)
        ? await ensureFireteamStandingsResolution({
            eventId,
            eventPageId,
            eventType,
            eventDay,
            readinessSnapshot,
            readinessRequirements,
            campaignPageId,
            serviceRecordPageId,
          })
        : null;

    if (existingHistory.length === 0) {
      await createServiceHistoryEntry({
        eventTitle,
        eventType,
        campaignDay,
        xpReward,
        description,
        eventPageId,
        serviceRecordPageId,
        campaignPageId,
      });
    }

    const verifiedHistory =
      await getServiceHistoryForEventRecords(eventPageId);

    if (verifiedHistory.length !== 1) {
      throw new Error(
        `Campaign Event history did not reconcile to exactly one record: ${eventPageId}`
      );
    }

    if (!eventWasCompleted) {
      await getNotionClient().pages.update({
        page_id: eventPageId,
        properties: {
          Status: { select: { name: "Defeated" } },
          "Date Completed": {
            date: { start: getOperationalDateKey() },
          },
        },
      });
    }

    const verifiedEvent = (await getNotionClient().pages.retrieve({
      page_id: eventPageId,
    })) as unknown as EventQueryResult;

    if (
      verifiedEvent.properties.Status?.select?.name !== "Defeated" ||
      !verifiedEvent.properties["Date Completed"]?.date?.start
    ) {
      throw new Error(
        `Campaign Event completion did not verify: ${eventPageId}`
      );
    }

    return {
      alreadyCompleted:
        existingHistory.length === 1 && eventWasCompleted,
      standingsResolution,
    };
  });
}

const activeCampaignEventCompletions = new Map<
  string,
  Promise<{
    alreadyCompleted: boolean;
    standingsResolution: FireteamStandingsResolution | null;
  }>
>();

function runCampaignEventCompletion(
  eventPageId: string,
  operation: () => Promise<{
    alreadyCompleted: boolean;
    standingsResolution: FireteamStandingsResolution | null;
  }>
) {
  const existing = activeCampaignEventCompletions.get(eventPageId);

  if (existing) {
    return existing;
  }

  const completion = operation().finally(() => {
    activeCampaignEventCompletions.delete(eventPageId);
  });
  activeCampaignEventCompletions.set(eventPageId, completion);

  return completion;
}

function parseFireteamStandingsResolution(
  page: UnitCohesionLedgerPage
) {
  if (
    !getUnitCohesionPageText(page, "Title").startsWith(
      FIRETEAM_STANDINGS_TITLE_PREFIX
    )
  ) {
    return null;
  }

  try {
    const resolution = JSON.parse(
      getUnitCohesionPageText(page, "Description")
    ) as Partial<FireteamStandingsResolution>;

    if (
      resolution.version !== FIRETEAM_STANDINGS_VERSION ||
      typeof resolution.eventId !== "string" ||
      typeof resolution.eventPageId !== "string" ||
      typeof resolution.campaignPageId !== "string" ||
      (resolution.eventType !== "Minor Event" &&
        resolution.eventType !== "Major Event") ||
      typeof resolution.eventDay !== "number" ||
      typeof resolution.seed !== "string" ||
      !Array.isArray(resolution.scores) ||
      !Array.isArray(resolution.cumulativeStandings) ||
      typeof resolution.resolvedAt !== "string"
    ) {
      return null;
    }

    return resolution as FireteamStandingsResolution;
  } catch {
    return null;
  }
}

function getStandingsScoringInput({
  eventType,
  readinessRequirements,
}: {
  eventType: "Minor Event" | "Major Event";
  readinessRequirements?: CampaignEvent["readinessRequirements"];
}) {
  if (eventType === "Major Event") {
    return {
      primaryReadiness: "mixed" as const,
      requirement:
        readinessRequirements?.atLeastOne?.minimum ?? 4,
    };
  }

  const minimums = Object.entries(
    readinessRequirements?.minimums ?? {}
  ).filter(
    (entry): entry is [StandingsReadinessKey, number] =>
      typeof entry[1] === "number" && entry[1] > 0
  );

  if (minimums.length !== 1) {
    throw new Error(
      "Phase II minor standings event must have exactly one readiness requirement"
    );
  }

  return {
    primaryReadiness: minimums[0][0],
    requirement: minimums[0][1],
  };
}

async function ensureFireteamStandingsResolution({
  eventId,
  eventPageId,
  eventType,
  eventDay,
  readinessSnapshot,
  readinessRequirements,
  campaignPageId,
  serviceRecordPageId,
}: {
  eventId: string;
  eventPageId: string;
  eventType: string;
  eventDay: number;
  readinessSnapshot: ReadinessScores;
  readinessRequirements?: CampaignEvent["readinessRequirements"];
  campaignPageId?: string | null;
  serviceRecordPageId?: string | null;
}) {
  if (
    (eventType !== "Minor Event" && eventType !== "Major Event") ||
    !campaignPageId ||
    !serviceRecordPageId
  ) {
    throw new Error(
      "Competitive Campaign Event is missing standings persistence identity"
    );
  }

  const title = getFireteamStandingsTitle(eventPageId);
  const dataSourceId = await getServiceHistoryDataSourceId();
  const existing = (await queryAllDataSourcePages({
    dataSourceId,
    filter: {
      and: [
        { property: "Title", title: { equals: title } },
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Campaign",
          relation: { contains: campaignPageId },
        },
      ],
    },
  })) as UnitCohesionLedgerPage[];

  if (existing.length > 1) {
    throw new Error(
      `Duplicate Fireteam Standings resolution requires reconciliation: ${eventPageId}`
    );
  }

  if (existing[0]) {
    const persisted = parseFireteamStandingsResolution(existing[0]);

    if (
      !persisted ||
      persisted.eventId !== eventId ||
      persisted.eventPageId !== eventPageId ||
      persisted.campaignPageId !== campaignPageId
    ) {
      throw new Error(
        `Invalid Fireteam Standings resolution requires reconciliation: ${eventPageId}`
      );
    }

    return persisted;
  }

  const priorPages = (await queryAllDataSourcePages({
    dataSourceId,
    filter: {
      and: [
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Campaign",
          relation: { contains: campaignPageId },
        },
      ],
    },
  })) as UnitCohesionLedgerPage[];
  const priorResolutions = priorPages
    .map(parseFireteamStandingsResolution)
    .filter(
      (resolution): resolution is FireteamStandingsResolution =>
        resolution !== null
    );
  const scoring = getStandingsScoringInput({
    eventType,
    readinessRequirements,
  });
  const seed = `${campaignPageId}:${eventPageId}:v${FIRETEAM_STANDINGS_VERSION}`;
  const resolvedAt = new Date().toISOString();
  const scores = resolveFireteamEventScores({
    eventType,
    readiness: readinessSnapshot,
    primaryReadiness: scoring.primaryReadiness,
    requirement: scoring.requirement,
    seed,
  });
  const baseResolution = {
    version: FIRETEAM_STANDINGS_VERSION,
    eventId,
    eventPageId,
    campaignPageId,
    eventType,
    eventDay,
    primaryReadiness: scoring.primaryReadiness,
    readinessSnapshot,
    seed,
    scores,
    resolvedAt,
  } satisfies Omit<
    FireteamStandingsResolution,
    "cumulativeStandings"
  >;
  const resolution: FireteamStandingsResolution = {
    ...baseResolution,
    cumulativeStandings: calculateCumulativeStandings([
      ...priorResolutions,
      { ...baseResolution, cumulativeStandings: [] },
    ]),
  };
  const serialized = JSON.stringify(resolution);
  const descriptionChunks =
    serialized.match(/[\s\S]{1,1900}/g) ?? [];

  await getNotionClient().pages.create({
    parent: {
      database_id: getRequiredNotionId(
        "SERVICE_HISTORY_DATABASE_ID"
      ),
    },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Date: { date: { start: resolvedAt } },
      "Campaign Day": { number: eventDay },
      "Entry Type": { select: { name: "System" } },
      "XP Awarded": { number: 0 },
      "Readiness Category": { select: { name: "Mixed" } },
      Description: {
        rich_text: descriptionChunks.map((content) => ({
          text: { content },
        })),
      },
      "Related Campaign": {
        relation: [{ id: campaignPageId }],
      },
      "Related Service Record": {
        relation: [{ id: serviceRecordPageId }],
      },
    },
  });

  const verified = (await queryAllDataSourcePages({
    dataSourceId,
    filter: {
      and: [
        { property: "Title", title: { equals: title } },
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Campaign",
          relation: { contains: campaignPageId },
        },
      ],
    },
  })) as UnitCohesionLedgerPage[];

  if (verified.length !== 1) {
    throw new Error(
      `Fireteam Standings resolution did not reconcile exactly once: ${eventPageId}`
    );
  }

  const persisted = parseFireteamStandingsResolution(verified[0]);

  if (
    !persisted ||
    persisted.seed !== resolution.seed ||
    JSON.stringify(persisted.scores) !== JSON.stringify(resolution.scores)
  ) {
    throw new Error(
      `Fireteam Standings resolution did not verify: ${eventPageId}`
    );
  }

  return persisted;
}

export async function getFireteamStandingsStatus() {
  const eventState = await getActiveCampaignEventState();

  if (!eventState.phaseId) {
    return {
      campaignName: eventState.campaignName,
      phaseName: eventState.phaseName,
      resolvedEventCount: 0,
      standings: addStandingsMovement(calculateCumulativeStandings([])),
      eventResults: [],
      duplicateEventPageIds: [],
    };
  }

  const pages = (await queryAllDataSourcePages({
    dataSourceId: await getServiceHistoryDataSourceId(),
    filter: {
      and: [
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Campaign",
          relation: { contains: eventState.phaseId },
        },
      ],
    },
  })) as UnitCohesionLedgerPage[];
  const resolutions = pages
    .map(parseFireteamStandingsResolution)
    .filter(
      (resolution): resolution is FireteamStandingsResolution =>
        resolution !== null
    )
    .sort((a, b) => a.eventDay - b.eventDay);
  const seenEventPageIds = new Set<string>();
  const duplicateEventPageIds = new Set<string>();
  const uniqueResolutions: FireteamStandingsResolution[] = [];

  for (const resolution of resolutions) {
    if (seenEventPageIds.has(resolution.eventPageId)) {
      duplicateEventPageIds.add(resolution.eventPageId);
      continue;
    }
    seenEventPageIds.add(resolution.eventPageId);
    uniqueResolutions.push(resolution);
  }
  const standings = calculateCumulativeStandings(uniqueResolutions);
  const previousStandings =
    uniqueResolutions.length > 1
      ? uniqueResolutions[uniqueResolutions.length - 2].cumulativeStandings
      : calculateCumulativeStandings([]);

  return {
    campaignName: eventState.campaignName,
    phaseName: eventState.phaseName,
    resolvedEventCount: uniqueResolutions.length,
    standings: addStandingsMovement(standings, previousStandings),
    eventResults: uniqueResolutions.map(
      ({
        eventId,
        eventDay,
        eventType,
        scores,
        cumulativeStandings,
        resolvedAt,
      }) => ({
        eventId,
        eventDay,
        eventType,
        scores,
        cumulativeStandings,
        resolvedAt,
      })
    ),
    duplicateEventPageIds: [...duplicateEventPageIds],
  };
}

async function findAlexServiceRecord() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "SERVICE_RECORD_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Designation",
      title: {
        equals: "ALEX-225",
      },
    },
    page_size: 1,
  });

  return response.results[0] ?? null;
}

export async function getAlexServiceRecordPageId() {
  const page = await findAlexServiceRecord();
  return page?.id ?? null;
}

export async function getAlexServiceRecord() {
  const notion = getNotionClient();
  const page = await findAlexServiceRecord();

  if (!page) {
    return null;
  }

  return notion.pages.retrieve({
    page_id: page.id,
  });
}

function getPersistedIndividualCompletionStatus(
  value: string | null
): PersistedIndividualCompletionStatus {
  const validStatuses: Array<
    Exclude<PersistedIndividualCompletionStatus, null>
  > = ["Locked", "Ready to Finalize", "Eligible", "Assigned"];

  return validStatuses.includes(
    value as Exclude<PersistedIndividualCompletionStatus, null>
  )
    ? (value as Exclude<PersistedIndividualCompletionStatus, null>)
    : null;
}

function getIndividualCompletionExplanation(
  status: IndividualCompletionStatus
) {
  const evidence = status.evidence;
  const summary = [
    `State: ${toPersistedIndividualCompletionStatus(status.state)}.`,
    `Boundary: ${evidence.boundaryDate ?? "unset"} (${
      evidence.boundaryReached ? "reached" : "not reached"
    }).`,
    `Events: ${evidence.eventCount} total, ${evidence.incompleteEventTitles.length} incomplete.`,
    `Event histories: ${
      evidence.eventHistoriesComplete ? "complete" : "not complete"
    }.`,
    `XP snapshot: ${
      evidence.snapshotFinalized
        ? `finalized ${evidence.snapshotFinalizedAt}`
        : "not finalized"
    }.`,
    ...status.reasons,
  ];

  return summary.join(" ").slice(0, 1900);
}

export async function getIndividualCompletionEligibility(
  operationalDate = getOperationalDateKey()
): Promise<IndividualCompletionStatus> {
  const { phases, events } = await getCampaignRolloverRecords();
  const sourcePhase = phases.find(
    (phase) => phase.campaignNumber === 1 && phase.phaseNumber === 1
  );

  if (!sourcePhase) {
    throw new Error(
      "Campaign 1 Phase 1 is unavailable for Individual completion evaluation"
    );
  }

  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const sourceEvents = events.filter(
    (event) =>
      event.properties.Campaign?.relation?.some(
        ({ id }) => id === sourcePhase.id
      ) ?? false
  );
  const eventEvidence = await Promise.all(
    sourceEvents.map(async (event) => {
      const title =
        event.properties["Event Name"]?.title?.[0]?.plain_text ??
        "Unnamed Event";
      const complete =
        event.properties.Status?.select?.name === "Defeated" ||
        Boolean(event.properties["Date Completed"]?.date?.start) ||
        (await hasServiceHistoryForEvent(event.id));

      return { title, complete };
    })
  );
  const xpState = await getRolloverPhaseXpState(
    sourcePhase.id,
    operationalDate
  );
  const properties = serviceRecord.properties;
  const persistedStatus = getPersistedIndividualCompletionStatus(
    properties["Fireteam Eligibility Status"]?.select?.name ?? null
  );
  const progressionStage =
    properties["Progression Stage"]?.select?.name ?? null;
  const evaluation = evaluateIndividualCompletion({
    operationalDate,
    phaseStartDate: sourcePhase.startDate,
    phaseLength: sourcePhase.phaseLength,
    eventCount: sourceEvents.length,
    incompleteEventTitles: eventEvidence
      .filter(({ complete }) => !complete)
      .map(({ title }) => title),
    missingEventHistoryTitles: xpState.phaseXp.missingEventHistoryTitles,
    duplicateEventHistoryTitles:
      xpState.phaseXp.duplicateEventHistoryTitles,
    snapshotFinalizedAt: xpState.frozenSnapshot?.finalizedAt ?? null,
    persistedStatus,
    progressionStage,
  });

  return {
    ...evaluation,
    operationalDate,
    sourcePhase,
    phaseResult: xpState.frozenSnapshot,
    persisted: {
      status: persistedStatus,
      progressionStage,
      completedAt:
        properties["Individual Completed At"]?.date?.start ?? null,
      evaluatedAt:
        properties["Eligibility Evaluated At"]?.date?.start ?? null,
      version: properties["Eligibility Version"]?.number ?? null,
    },
  };
}

let activeEligibilityPersistence: Promise<IndividualCompletionStatus> | null =
  null;

async function persistIndividualCompletionEligibilityInternal(
  operationalDate: string
) {
  const status = await getIndividualCompletionEligibility(operationalDate);
  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const persistedStatus = toPersistedIndividualCompletionStatus(status.state);
  const existingCompletedAt =
    serviceRecord.properties["Individual Completed At"]?.date?.start ?? null;
  const completedAt =
    status.state === "eligible" || status.state === "assigned"
      ? existingCompletedAt ??
        status.evidence.snapshotFinalizedAt ??
        operationalDate
      : existingCompletedAt;
  const progressionStage =
    status.state === "assigned"
      ? "Fireteam Member"
      : serviceRecord.properties["Progression Stage"]?.select?.name ??
        "Individual";

  await getNotionClient().pages.update({
    page_id: serviceRecord.id,
    properties: {
      "Progression Stage": { select: { name: progressionStage } },
      "Fireteam Eligibility Status": {
        select: { name: persistedStatus },
      },
      "Eligibility Source Campaign": {
        relation: [{ id: status.sourcePhase.id }],
      },
      "Eligibility Evaluated At": { date: { start: operationalDate } },
      "Eligibility Version": { number: status.version },
      "Eligibility Explanation": {
        rich_text: [
          {
            text: {
              content: getIndividualCompletionExplanation(status),
            },
          },
        ],
      },
      ...(completedAt
        ? { "Individual Completed At": { date: { start: completedAt } } }
        : {}),
    },
  });

  const verified = await getIndividualCompletionEligibility(operationalDate);

  if (
    verified.persisted.status !== persistedStatus ||
    verified.persisted.version !== status.version
  ) {
    throw new Error(
      "Individual completion eligibility write did not verify"
    );
  }

  return verified;
}

export function persistIndividualCompletionEligibility(
  operationalDate = getOperationalDateKey()
) {
  if (!activeEligibilityPersistence) {
    activeEligibilityPersistence =
      persistIndividualCompletionEligibilityInternal(
        operationalDate
      ).finally(() => {
        activeEligibilityPersistence = null;
      });
  }

  return activeEligibilityPersistence;
}

function getRichTextValue(
  property:
    | { rich_text?: Array<{ plain_text?: string }> }
    | undefined
) {
  return (
    property?.rich_text
      ?.map(({ plain_text }) => plain_text ?? "")
      .join("") ?? null
  );
}

function getPersistedFireteamAssignment(
  serviceRecord: AlexServiceRecordPage
): PersistedFireteamAssignment {
  const properties = serviceRecord.properties;
  const rawStatus =
    properties["Fireteam Assignment Status"]?.select?.name ?? null;
  const validStatuses: Array<
    Exclude<FireteamAssignmentPersistenceStatus, null>
  > = ["Pending", "In Progress", "Finalizing", "Complete"];
  const status = validStatuses.includes(
    rawStatus as Exclude<FireteamAssignmentPersistenceStatus, null>
  )
    ? (rawStatus as Exclude<FireteamAssignmentPersistenceStatus, null>)
    : null;

  return {
    status,
    step: Math.max(
      0,
      Math.min(
        FIRETEAM_ASSIGNMENT_MAX_STEP,
        Math.floor(
          properties["Fireteam Assignment Step"]?.number ?? 0
        )
      )
    ),
    fireteamId: getRichTextValue(properties["Fireteam ID"]),
    fireteamName: getRichTextValue(properties["Fireteam Name"]),
    motto: getRichTextValue(properties["Fireteam Motto"]),
    assignedAt:
      properties["Fireteam Assigned At"]?.date?.start ?? null,
    version:
      properties["Fireteam Assignment Version"]?.number ?? null,
    operationId: getRichTextValue(
      properties["Fireteam Assignment Operation ID"]
    ),
    rosterSnapshot: getRichTextValue(
      properties["Fireteam Roster Snapshot"]
    ),
    updatedAt:
      properties["Fireteam Assignment Updated At"]?.date?.start ?? null,
    progressionStage:
      properties["Progression Stage"]?.select?.name ?? null,
  };
}

async function getFireteamAssignmentHistoryCount({
  serviceRecordPageId,
  sourcePhaseId,
}: {
  serviceRecordPageId: string;
  sourcePhaseId: string;
}) {
  const results = await queryAllDataSourcePages({
    dataSourceId: await getServiceHistoryDataSourceId(),
    filter: {
      and: [
        {
          property: "Title",
          title: { equals: FIRETEAM_ASSIGNMENT_HISTORY_TITLE },
        },
        {
          property: "Entry Type",
          select: { equals: "Assignment" },
        },
        {
          property: "Related Service Record",
          relation: { contains: serviceRecordPageId },
        },
        {
          property: "Related Campaign",
          relation: { contains: sourcePhaseId },
        },
      ],
    },
  });

  return results.length;
}

export async function getFireteamAssignmentStatus(
  operationalDate = getOperationalDateKey()
): Promise<FireteamAssignmentStatus> {
  const eligibility = await getIndividualCompletionEligibility(
    operationalDate
  );
  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const persisted = getPersistedFireteamAssignment(serviceRecord);
  const historyCount = await getFireteamAssignmentHistoryCount({
    serviceRecordPageId: serviceRecord.id,
    sourcePhaseId: eligibility.sourcePhase.id,
  });

  return {
    ...evaluateFireteamAssignment({
      eligibilityState: eligibility.state,
      persisted,
      historyCount,
    }),
    operationalDate,
    eligibility,
    fireteam: FIRETEAM_EPSILON,
  };
}

export class FireteamAssignmentNotAvailableError extends Error {
  status: FireteamAssignmentStatus;

  constructor(status: FireteamAssignmentStatus, message?: string) {
    super(
      message ||
        status.reasons.join(" ") ||
        "Fireteam Assignment is not available."
    );
    this.name = "FireteamAssignmentNotAvailableError";
    this.status = status;
  }
}

let activeIndividualFinalization: Promise<IndividualCompletionStatus> | null =
  null;

async function finalizeIndividualCompletionInternal(
  operationalDate: string
) {
  const initial = await getIndividualCompletionEligibility(operationalDate);

  if (initial.state === "locked") {
    throw new Error(initial.reasons.join(" "));
  }

  if (initial.state === "ready_to_finalize") {
    await ensureFrozenPhaseXpSnapshot(
      initial.sourcePhase.id,
      operationalDate
    );
  }

  const verified = await persistIndividualCompletionEligibility(
    operationalDate
  );

  if (
    verified.state !== "eligible" &&
    verified.state !== "assigned"
  ) {
    throw new Error(
      "Individual completion snapshot finalized but eligibility did not verify"
    );
  }

  return verified;
}

export function finalizeIndividualCompletion(
  operationalDate = getOperationalDateKey()
) {
  if (!activeIndividualFinalization) {
    activeIndividualFinalization =
      finalizeIndividualCompletionInternal(operationalDate).finally(() => {
        activeIndividualFinalization = null;
      });
  }

  return activeIndividualFinalization;
}

export async function beginFireteamAssignmentCeremony(
  operationalDate = getOperationalDateKey()
) {
  await finalizeIndividualCompletion(operationalDate);
  const status = await getFireteamAssignmentStatus(operationalDate);

  if (
    status.state === "in_progress" ||
    status.state === "finalizing" ||
    status.state === "completed"
  ) {
    return status;
  }

  if (!status.canBegin || status.eligibility.state !== "eligible") {
    throw new FireteamAssignmentNotAvailableError(status);
  }

  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  await getNotionClient().pages.update({
    page_id: serviceRecord.id,
    properties: {
      "Fireteam Assignment Status": {
        select: { name: "In Progress" },
      },
      "Fireteam Assignment Step": {
        number: status.persisted.step,
      },
      "Fireteam Assignment Updated At": {
        date: { start: operationalDate },
      },
    },
  });

  const verified = await getFireteamAssignmentStatus(operationalDate);

  if (verified.state !== "in_progress") {
    throw new Error("Fireteam Assignment ceremony did not enter progress");
  }

  return verified;
}

export async function advanceFireteamAssignmentCeremony(
  step: number,
  operationalDate = getOperationalDateKey()
) {
  const status = await getFireteamAssignmentStatus(operationalDate);

  if (
    status.state === "finalizing" ||
    status.state === "completed"
  ) {
    return status;
  }

  if (status.state !== "in_progress") {
    throw new FireteamAssignmentNotAvailableError(status);
  }

  if (
    !Number.isInteger(step) ||
    step < status.persisted.step ||
    step > Math.min(
      FIRETEAM_ASSIGNMENT_MAX_STEP,
      status.persisted.step + 1
    )
  ) {
    throw new Error("Invalid Fireteam Assignment ceremony step");
  }

  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  await getNotionClient().pages.update({
    page_id: serviceRecord.id,
    properties: {
      "Fireteam Assignment Step": { number: step },
      "Fireteam Assignment Updated At": {
        date: { start: operationalDate },
      },
    },
  });

  const verified = await getFireteamAssignmentStatus(operationalDate);

  if (
    verified.state !== "in_progress" ||
    verified.persisted.step !== step
  ) {
    throw new Error("Fireteam Assignment ceremony step did not verify");
  }

  return verified;
}

async function ensureFireteamAssignmentHistory(
  serviceRecord: AlexServiceRecordPage,
  status: FireteamAssignmentStatus,
  assignedAt: string
) {
  const existingCount = await getFireteamAssignmentHistoryCount({
    serviceRecordPageId: serviceRecord.id,
    sourcePhaseId: status.eligibility.sourcePhase.id,
  });

  if (existingCount > 1) {
    throw new Error(
      "Multiple Fireteam Assignment history records require manual reconciliation"
    );
  }

  if (existingCount === 1) {
    return;
  }

  await getNotionClient().pages.create({
    parent: {
      database_id: getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID"),
    },
    properties: {
      Title: {
        title: [
          { text: { content: FIRETEAM_ASSIGNMENT_HISTORY_TITLE } },
        ],
      },
      Date: { date: { start: assignedAt } },
      "Campaign Day": {
        number: status.eligibility.sourcePhase.phaseLength || null,
      },
      "Entry Type": { select: { name: "Assignment" } },
      "XP Awarded": { number: 0 },
      "Readiness Category": { select: { name: "None" } },
      Description: {
        rich_text: [
          {
            text: {
              content:
                "ALEX-225 completed Individual Training and received permanent assignment to Fireteam Epsilon alongside Michael, Paige, Ellie, and Zoe. FIVE, FORWARD.",
            },
          },
        ],
      },
      "Related Campaign": {
        relation: [{ id: status.eligibility.sourcePhase.id }],
      },
      "Related Service Record": {
        relation: [{ id: serviceRecord.id }],
      },
    },
  });
}

let activeFireteamAssignment: Promise<FireteamAssignmentStatus> | null = null;

async function completeFireteamAssignmentInternal(
  operationalDate: string
) {
  let status = await getFireteamAssignmentStatus(operationalDate);

  if (status.state === "completed") {
    return status;
  }

  if (status.state === "conflict" || status.state === "locked") {
    throw new FireteamAssignmentNotAvailableError(status);
  }

  if (status.state === "available") {
    throw new FireteamAssignmentNotAvailableError(
      status,
      "Begin the Fireteam Assignment ceremony before accepting assignment."
    );
  }

  if (
    status.state === "in_progress" &&
    status.persisted.step < FIRETEAM_ASSIGNMENT_MAX_STEP
  ) {
    throw new FireteamAssignmentNotAvailableError(
      status,
      "Complete every ceremony presentation before accepting assignment."
    );
  }

  if (status.eligibility.state === "ready_to_finalize") {
    await finalizeIndividualCompletion(operationalDate);
    status = await getFireteamAssignmentStatus(operationalDate);
  }

  if (
    status.state === "in_progress" &&
    status.eligibility.state !== "eligible"
  ) {
    throw new FireteamAssignmentNotAvailableError(status);
  }

  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const assignedAt = status.persisted.assignedAt ?? operationalDate;

  if (status.state !== "finalizing") {
    await getNotionClient().pages.update({
      page_id: serviceRecord.id,
      properties: {
        "Progression Stage": {
          select: { name: "Fireteam Member" },
        },
        "Fireteam Eligibility Status": {
          select: { name: "Assigned" },
        },
        "Fireteam Assignment Status": {
          select: { name: "Finalizing" },
        },
        "Fireteam Assignment Step": {
          number: FIRETEAM_ASSIGNMENT_MAX_STEP,
        },
        "Fireteam ID": {
          rich_text: [
            { text: { content: FIRETEAM_EPSILON.id } },
          ],
        },
        "Fireteam Name": {
          rich_text: [
            { text: { content: FIRETEAM_EPSILON.name } },
          ],
        },
        "Fireteam Motto": {
          rich_text: [
            { text: { content: FIRETEAM_EPSILON.motto } },
          ],
        },
        "Fireteam Assigned At": { date: { start: assignedAt } },
        "Fireteam Assignment Version": {
          number: FIRETEAM_ASSIGNMENT_VERSION,
        },
        "Fireteam Assignment Operation ID": {
          rich_text: [
            {
              text: {
                content: FIRETEAM_ASSIGNMENT_OPERATION_ID,
              },
            },
          ],
        },
        "Fireteam Roster Snapshot": {
          rich_text: [
            {
              text: {
                content: getCanonicalRosterSnapshot(assignedAt),
              },
            },
          ],
        },
        "Fireteam Assignment Updated At": {
          date: { start: operationalDate },
        },
        "Eligibility Source Campaign": {
          relation: [{ id: status.eligibility.sourcePhase.id }],
        },
        "Eligibility Evaluated At": {
          date: { start: operationalDate },
        },
        "Eligibility Version": {
          number: status.eligibility.version,
        },
        "Eligibility Explanation": {
          rich_text: [
            {
              text: {
                content:
                  "State: Assigned. Canonical Fireteam Epsilon assignment persisted; assignment history reconciliation in progress.",
              },
            },
          ],
        },
        "Individual Completed At": {
          date: {
            start:
              status.eligibility.persisted.completedAt ??
              status.eligibility.phaseResult?.finalizedAt ??
              assignedAt,
          },
        },
      },
    });

    status = await getFireteamAssignmentStatus(operationalDate);

    if (status.state !== "finalizing") {
      throw new Error(
        "Canonical Fireteam Assignment snapshot did not verify"
      );
    }
  }

  await ensureFireteamAssignmentHistory(serviceRecord, status, assignedAt);

  const historyCount = await getFireteamAssignmentHistoryCount({
    serviceRecordPageId: serviceRecord.id,
    sourcePhaseId: status.eligibility.sourcePhase.id,
  });

  if (historyCount !== 1) {
    throw new Error(
      "Fireteam Assignment history did not reconcile to exactly one record"
    );
  }

  await getNotionClient().pages.update({
    page_id: serviceRecord.id,
    properties: {
      "Fireteam Assignment Status": {
        select: { name: "Complete" },
      },
      "Fireteam Assignment Updated At": {
        date: { start: operationalDate },
      },
      "Eligibility Explanation": {
        rich_text: [
          {
            text: {
              content:
                "State: Assigned. Canonical Fireteam Epsilon identity, roster, assignment date, progression stage, and one Assignment Service History record verified.",
            },
          },
        ],
      },
    },
  });

  const verified = await getFireteamAssignmentStatus(operationalDate);

  if (verified.state !== "completed") {
    throw new Error("Fireteam Assignment completion did not verify");
  }

  return verified;
}

export function completeFireteamAssignment(
  operationalDate = getOperationalDateKey()
) {
  if (!activeFireteamAssignment) {
    activeFireteamAssignment =
      completeFireteamAssignmentInternal(operationalDate).finally(() => {
        activeFireteamAssignment = null;
      });
  }

  return activeFireteamAssignment;
}

type UnitCohesionLedgerPage = {
  id: string;
  properties?: Record<
    string,
    | {
        title?: Array<{ plain_text?: string }>;
        rich_text?: Array<{ plain_text?: string }>;
      }
    | undefined
  >;
};

const activeUnitCohesionOperations = new Map<string, Promise<void>>();

function getUnitCohesionPageText(
  page: UnitCohesionLedgerPage,
  propertyName: string
) {
  const property = page.properties?.[propertyName];

  return (
    property?.title
      ?.map(({ plain_text }) => plain_text ?? "")
      .join("") ??
    property?.rich_text
      ?.map(({ plain_text }) => plain_text ?? "")
      .join("") ??
    ""
  );
}

function getBaselineUnitCohesionRelationships() {
  const memberIds: UnitCohesionMemberId[] = [
    "epsilon-michael",
    "epsilon-paige",
    "epsilon-ellie",
    "epsilon-zoe",
  ];

  return memberIds.map((memberId) =>
    getUnitCohesionRelationshipState(memberId, 0)
  );
}

function parseUnitCohesionLedgerEntry(
  page: UnitCohesionLedgerPage
): UnitCohesionLedgerEntry | null {
  const title = getUnitCohesionPageText(page, "Title");

  if (!title.startsWith(UNIT_COHESION_LEDGER_TITLE_PREFIX)) {
    return null;
  }

  try {
    const entry = JSON.parse(
      getUnitCohesionPageText(page, "Description")
    ) as Partial<UnitCohesionLedgerEntry>;

    if (
      entry.version !== UNIT_COHESION_VERSION ||
      typeof entry.operationId !== "string" ||
      (entry.sourceType !== "daily" &&
        entry.sourceType !== "weekly") ||
      typeof entry.sourceRecordId !== "string" ||
      typeof entry.sourceProperty !== "string" ||
      typeof entry.sourceDate !== "string" ||
      typeof entry.memberId !== "string" ||
      typeof entry.category !== "string" ||
      typeof entry.active !== "boolean" ||
      typeof entry.updatedAt !== "string"
    ) {
      return null;
    }

    return entry as UnitCohesionLedgerEntry;
  } catch {
    return null;
  }
}

async function getUnitCohesionLedgerPages(serviceRecordPageId: string) {
  const results = await queryAllDataSourcePages({
    dataSourceId: await getServiceHistoryDataSourceId(),
    filter: {
      and: [
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Service Record",
          relation: { contains: serviceRecordPageId },
        },
      ],
    },
  });

  return (results as UnitCohesionLedgerPage[]).filter((page) =>
    getUnitCohesionPageText(page, "Title").startsWith(
      UNIT_COHESION_LEDGER_TITLE_PREFIX
    )
  );
}

export async function getUnitCohesionStatus(): Promise<UnitCohesionStatus> {
  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const assignment = getPersistedFireteamAssignment(serviceRecord);
  const enabled =
    assignment.status === "Complete" &&
    isCanonicalFireteamAssignment(assignment);

  if (!enabled) {
    return {
      enabled: false,
      eligibleFrom: assignment.assignedAt,
      relationships: getBaselineUnitCohesionRelationships(),
      duplicateOperationIds: [],
    };
  }

  const pages = await getUnitCohesionLedgerPages(serviceRecord.id);
  const entries = pages
    .map(parseUnitCohesionLedgerEntry)
    .filter(
      (entry): entry is UnitCohesionLedgerEntry => entry !== null
    );
  const summary = summarizeUnitCohesionLedger(entries);

  return {
    enabled: true,
    eligibleFrom: assignment.assignedAt,
    ...summary,
  };
}

async function reconcileUnitCohesionHabitInternal({
  sourceType,
  sourceRecordId,
  sourceProperty,
  sourceDate,
  checked,
}: {
  sourceType: UnitCohesionSourceType;
  sourceRecordId: string;
  sourceProperty: string;
  sourceDate: string;
  checked: boolean;
}) {
  const habit = getUnitCohesionHabit(sourceType, sourceProperty);

  if (!habit) {
    return;
  }

  const serviceRecord = (await findAlexServiceRecord()) as
    | AlexServiceRecordPage
    | null;

  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const assignment = getPersistedFireteamAssignment(serviceRecord);

  if (
    assignment.status !== "Complete" ||
    !isCanonicalFireteamAssignment(assignment) ||
    !assignment.assignedAt ||
    !isUnitCohesionSourceEligible({
      assignedAt: assignment.assignedAt,
      sourceDate,
    })
  ) {
    return;
  }

  const operationId = getUnitCohesionOperationId({
    sourceType,
    sourceRecordId,
    sourceProperty,
  });
  const title = getUnitCohesionLedgerTitle({
    sourceType,
    sourceRecordId,
    sourceProperty,
  });
  const existing = (await queryAllDataSourcePages({
    dataSourceId: await getServiceHistoryDataSourceId(),
    filter: {
      and: [
        {
          property: "Title",
          title: { equals: title },
        },
        {
          property: "Entry Type",
          select: { equals: "System" },
        },
        {
          property: "Related Service Record",
          relation: { contains: serviceRecord.id },
        },
      ],
    },
  })) as UnitCohesionLedgerPage[];

  if (existing.length > 1) {
    throw new Error(
      `Duplicate Unit Cohesion ledger operation requires reconciliation: ${operationId}`
    );
  }

  const currentEntry = existing[0]
    ? parseUnitCohesionLedgerEntry(existing[0])
    : null;

  if (existing[0] && !currentEntry) {
    throw new Error(
      `Invalid Unit Cohesion ledger operation requires reconciliation: ${operationId}`
    );
  }

  if ((!currentEntry && !checked) || currentEntry?.active === checked) {
    return;
  }

  const updatedAt = new Date().toISOString();
  const ledgerEntry: UnitCohesionLedgerEntry = {
    version: UNIT_COHESION_VERSION,
    operationId,
    sourceType,
    sourceRecordId,
    sourceProperty,
    sourceDate,
    memberId: habit.memberId,
    category: habit.category,
    active: checked,
    updatedAt,
  };
  const commonProperties = {
    Date: { date: { start: sourceDate } },
    "Campaign Day": { number: null },
    "Entry Type": { select: { name: "System" } },
    "XP Awarded": { number: 0 },
    "Readiness Category": {
      select: { name: habit.category },
    },
    Description: {
      rich_text: [
        {
          text: {
            content: JSON.stringify(ledgerEntry),
          },
        },
      ],
    },
  };

  if (existing[0]) {
    await getNotionClient().pages.update({
      page_id: existing[0].id,
      properties: commonProperties,
    });
  } else {
    await getNotionClient().pages.create({
      parent: {
        database_id: getRequiredNotionId(
          "SERVICE_HISTORY_DATABASE_ID"
        ),
      },
      properties: {
        Title: {
          title: [{ text: { content: title } }],
        },
        ...commonProperties,
        "Related Service Record": {
          relation: [{ id: serviceRecord.id }],
        },
      },
    });
  }
}

export async function reconcileUnitCohesionHabit(
  input: Parameters<typeof reconcileUnitCohesionHabitInternal>[0]
) {
  const operationId = getUnitCohesionOperationId(input);
  const existing = activeUnitCohesionOperations.get(operationId);

  if (existing) {
    await existing;
    return getUnitCohesionStatus();
  }

  const operation = reconcileUnitCohesionHabitInternal(input).finally(
    () => {
      activeUnitCohesionOperations.delete(operationId);
    }
  );
  activeUnitCohesionOperations.set(operationId, operation);
  await operation;

  return getUnitCohesionStatus();
}

export async function findTodaySitrep(dateKey = getOperationalDateKey()) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Mission Date",
      date: {
        equals: dateKey,
      },
    },
    page_size: 1,
  });

  return response.results[0] ?? null;
}

export async function getTodaySitrep() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );
  const today = getOperationalDateKey();
  const existing = await findTodaySitrep(today);

  if (existing) {
    return existing;
  }

  const spartan = await getAlexServiceRecord();

  if (!spartan) {
    throw new Error("Service Record not found for ALEX-225");
  }

  return notion.pages.create({
    parent: {
      data_source_id: dataSourceId,
    },
    properties: {
      "Daily Log": {
        title: [
          {
            text: {
              content: today,
            },
          },
        ],
      },
      "Mission Date": {
        date: {
          start: today,
        },
      },
      Spartan: {
        relation: [
          {
            id: spartan.id,
          },
        ],
      },
    },
  } as never);
}

export async function getHydrationTotalForOperationalDay(date = new Date()) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "HYDRATION_LOG_DATA_SOURCE_ID"
  );
  const { start, endExclusive } = getOperationalDayBounds(date);

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: start.toISOString(),
          },
        },
        {
          property: "Date",
          date: {
            before: endExclusive.toISOString(),
          },
        },
      ],
    },
  });

  return response.results.reduce((sum, page) => {
    const properties = (page as unknown as { properties?: NotionProperties })
      .properties ?? {};
    return sum + getNumberProperty(properties, "Amount");
  }, 0);
}

export async function getHydrationPhaseAverage(startDate: string, endDate: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("HYDRATION_LOG_DATA_SOURCE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { and: [
      { property: "Date", date: { on_or_after: startDate } },
      { property: "Date", date: { before: addDaysToDateKey(endDate, 1) } },
    ] },
    page_size: 100,
  });
  const total = response.results.reduce((sum, page: any) => sum + (page.properties?.Amount?.number ?? 0), 0);
  const days = Math.max(1, differenceInDateKeys(startDate, endDate) + 1);
  return Math.round(total / days);
}

export async function createServiceHistoryEntry({
  eventTitle,
  eventType,
  campaignDay,
  xpReward,
  description,
  eventPageId,
  serviceRecordPageId,
  campaignPageId,
  completedAt = new Date().toISOString(),
}: ServiceHistoryEntry) {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId(
    "SERVICE_HISTORY_DATABASE_ID"
  );

  return notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: buildCampaignServiceHistoryProperties({
      eventTitle,
      eventType,
      campaignDay,
      xpReward,
      description,
      eventPageId,
      serviceRecordPageId,
      campaignPageId,
      completedAt,
    }),
  });
}

export async function createAchievementServiceHistoryEntry({
  achievementPageId,
  achievementTitle,
  category,
  description,
  earnedAt = new Date().toISOString(),
}: {
  achievementPageId: string;
  achievementTitle: string;
  category: string;
  description?: string;
  earnedAt?: string;
}) {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID");
  const serviceRecordPageId = await getAlexServiceRecordPageId();

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: buildAchievementServiceHistoryProperties({
      achievementPageId,
      achievementTitle,
      category,
      description,
      earnedAt,
      serviceRecordPageId,
    }),
  });
}

export async function hasServiceHistoryForAchievement(achievementPageId: string) {
  const notion = getNotionClient();
  const dataSourceId = await getServiceHistoryDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Related Achievement",
      relation: { contains: achievementPageId },
    },
    page_size: 1,
  });
  return response.results.length > 0;
}

export async function updateDailySitrepCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  const updated = await getNotionClient().pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
  const properties = (updated as unknown as {
    properties?: {
      "Mission Date"?: { date?: { start?: string } };
    };
  }).properties;
  const sourceDate =
    properties?.["Mission Date"]?.date?.start ??
    getOperationalDateKey();

  await reconcileUnitCohesionHabit({
    sourceType: "daily",
    sourceRecordId: pageId,
    sourceProperty: propertyName,
    sourceDate,
    checked,
  });

  return updated;
}

export async function getWorkoutCountForWeek(weekStart: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WORKOUT_LOG_DATABASE_ID"
  );
  const weekEnd = addDaysToDateKey(weekStart, 7);

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: weekStart,
          },
        },
        {
          property: "Date",
          date: {
            before: weekEnd,
          },
        },
      ],
    },
  });

  return response.results.length;
}

export async function getWorkoutPhaseTotals(startDate: string, endDate: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("WORKOUT_LOG_DATABASE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { and: [
      { property: "Date", date: { on_or_after: startDate } },
      { property: "Date", date: { on_or_before: endDate } },
    ] },
    page_size: 100,
  });
  return response.results.reduce((totals, page: any) => {
    const properties = page.properties ?? {};
    const number = (name: string) => properties[name]?.number ?? properties[name]?.formula?.number ?? 0;
    return { minutes: totals.minutes + number("Duration (min)"), miles: totals.miles + number("Distance (mi)") };
  }, { minutes: 0, miles: 0 });
}

export async function createWorkoutLog(input: { type: string; category: string; duration: number; distance: number; rpe: number; notes: string; date: string }) {
  return getNotionClient().pages.create({
    parent: { data_source_id: getRequiredNotionId("WORKOUT_LOG_DATABASE_ID") },
    properties: {
      Type: { title: [{ text: { content: input.type } }] },
      Date: { date: { start: input.date } },
      Category: { select: { name: input.category } },
      "Duration (min)": { number: input.duration },
      "Distance (mi)": { number: input.distance },
      "RPE (1-5)": { number: input.rpe },
      Notes: { rich_text: input.notes ? [{ text: { content: input.notes } }] : [] },
      Phase: { select: { name: "Foundation" } },
    },
  });
}

export async function getCurrentWeeklyOperations(weekStart: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WEEKLY_OPERATIONS_DATABASE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Week Start",
      date: {
        equals: weekStart,
      },
    },
  });

  return response.results[0] ?? null;
}

export async function getOrCreateWeeklyOperations(weekStart: string) {
  const existing = await getCurrentWeeklyOperations(weekStart);

  if (existing) return existing;

  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WEEKLY_OPERATIONS_DATABASE_ID"
  );

  return notion.pages.create({
    parent: {
      data_source_id: dataSourceId,
    },
    properties: {
      "Week Start": {
        date: {
          start: weekStart,
        },
      },
      Workouts: {
        checkbox: false,
      },
      Shot: {
        checkbox: false,
      },
      Planning: {
        checkbox: false,
      },
    },
  });
}

export async function updateWeeklyOperationCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  const updated = await getNotionClient().pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
  const properties = (updated as unknown as {
    properties?: {
      "Week Start"?: { date?: { start?: string } };
    };
  }).properties;
  const sourceDate =
    properties?.["Week Start"]?.date?.start ??
    getOperationalDateKey();

  await reconcileUnitCohesionHabit({
    sourceType: "weekly",
    sourceRecordId: pageId,
    sourceProperty: propertyName,
    sourceDate,
    checked,
  });

  return updated;
}

export type AcademicQuarterSummary = {
  name: string;
  credits: number;
  startDate: string | null;
  endDate: string | null;
};

type AcademicQuarterPage = {
  properties?: {
    Quarter?: { title?: Array<{ plain_text?: string }> };
    Credits?: { number?: number | null };
    "Start Date"?: { date?: { start?: string | null } | null };
    "End Date"?: { date?: { start?: string | null } | null };
    Status?: { select?: { name?: string } | null };
  };
};

type DataSourceSearchResult = {
  object: string;
  id: string;
  title?: Array<{ plain_text?: string }>;
};

let academicQuartersDataSourceId: string | null = null;

async function getAcademicQuartersDataSourceId() {
  if (academicQuartersDataSourceId) {
    return academicQuartersDataSourceId;
  }

  const configuredId = process.env.ACADEMIC_QUARTERS_DATA_SOURCE_ID;

  if (configuredId) {
    academicQuartersDataSourceId = configuredId;
    return configuredId;
  }

  const response = await getNotionClient().search({
    query: "Quarters",
    filter: {
      property: "object",
      value: "data_source",
    },
    page_size: 25,
  });
  const exactMatch = (
    response.results as DataSourceSearchResult[]
  ).find(
    (result) =>
      result.object === "data_source" &&
      result.title
        ?.map((part) => part.plain_text ?? "")
        .join("")
        .trim()
        .toLowerCase() === "quarters"
  );

  if (!exactMatch) {
    throw new Error("Academic Quarters data source not found");
  }

  academicQuartersDataSourceId = exactMatch.id;
  return exactMatch.id;
}

function toAcademicQuarterSummary(
  page: AcademicQuarterPage
): AcademicQuarterSummary {
  const properties = page.properties ?? {};

  return {
    name:
      properties.Quarter?.title?.[0]?.plain_text ??
      "Unnamed Quarter",
    credits: properties.Credits?.number ?? 0,
    startDate: properties["Start Date"]?.date?.start ?? null,
    endDate: properties["End Date"]?.date?.start ?? null,
  };
}

export async function getAcademicQuarterOverview() {
  const notion = getNotionClient();
  const dataSourceId = await getAcademicQuartersDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      or: [
        {
          property: "Status",
          select: {
            equals: "Active",
          },
        },
        {
          property: "Status",
          select: {
            equals: "Up Next",
          },
        },
      ],
    },
    page_size: 10,
  });
  const quarters = response.results as AcademicQuarterPage[];
  const active = quarters.find(
    (quarter) =>
      quarter.properties?.Status?.select?.name === "Active"
  );
  const upNext = quarters.find(
    (quarter) =>
      quarter.properties?.Status?.select?.name === "Up Next"
  );

  return {
    active: active ? toAcademicQuarterSummary(active) : null,
    upNext: upNext ? toAcademicQuarterSummary(upNext) : null,
  };
}
