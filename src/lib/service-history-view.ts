export const SERVICE_HISTORY_FILTERS = [
  { value: "all", label: "All Records" },
  { value: "campaigns", label: "Campaigns" },
  { value: "events", label: "Events" },
  { value: "achievements", label: "Achievements" },
  { value: "promotions", label: "Promotions" },
  { value: "assignments", label: "Assignments" },
  { value: "readiness", label: "Readiness" },
  { value: "records", label: "Other Records" },
] as const;

export type ServiceHistoryFilter =
  (typeof SERVICE_HISTORY_FILTERS)[number]["value"];

export type ServiceHistoryViewRecord = {
  entryType: string;
  readinessPoints: number;
};

function normalizeEntryType(entryType: string) {
  return entryType.trim().toLowerCase();
}

export function getServiceHistoryCategory(
  entry: ServiceHistoryViewRecord
): Exclude<ServiceHistoryFilter, "all" | "readiness"> {
  const entryType = normalizeEntryType(entry.entryType);

  if (entryType === "campaign") return "campaigns";
  if (
    entryType === "minor event" ||
    entryType === "major event" ||
    entryType === "event"
  ) {
    return "events";
  }
  if (entryType === "achievement") return "achievements";
  if (entryType === "promotion") return "promotions";
  if (entryType === "assignment") return "assignments";

  return "records";
}

export function parseServiceHistoryFilter(
  value: string | string[] | undefined
): ServiceHistoryFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return SERVICE_HISTORY_FILTERS.some(
    (filter) => filter.value === candidate
  )
    ? (candidate as ServiceHistoryFilter)
    : "all";
}

export function matchesServiceHistoryFilter(
  entry: ServiceHistoryViewRecord,
  filter: ServiceHistoryFilter
) {
  if (filter === "all") return true;
  if (filter === "readiness") return entry.readinessPoints !== 0;

  return getServiceHistoryCategory(entry) === filter;
}

export function countServiceHistoryFilters(
  entries: ServiceHistoryViewRecord[]
) {
  return Object.fromEntries(
    SERVICE_HISTORY_FILTERS.map(({ value }) => [
      value,
      entries.filter((entry) =>
        matchesServiceHistoryFilter(entry, value)
      ).length,
    ])
  ) as Record<ServiceHistoryFilter, number>;
}
