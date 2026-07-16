export const OPERATIONAL_TIME_ZONE = "America/Denver";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getDateTimeParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function operationalDateTimeToInstant(
  dateKey: string,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`Invalid operational date key: ${dateKey}`);
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const wallClockUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );

  let instant = new Date(wallClockUtc);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = new Date(wallClockUtc - getTimeZoneOffsetMs(instant));
  }

  return instant;
}

export function getOperationalDateKey(date = new Date()) {
  const { year, month, day } = getDateTimeParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getOperationalDateKeyFromValue(value: string) {
  if (DATE_KEY_PATTERN.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid operational date value: ${value}`);
  }

  return getOperationalDateKey(date);
}

export function getOperationalHour(date = new Date()) {
  return getDateTimeParts(date).hour;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`Invalid operational date key: ${dateKey}`);
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days, 12));

  return result.toISOString().slice(0, 10);
}

export function differenceInDateKeys(startDateKey: string, endDateKey: string) {
  const start = new Date(`${startDateKey}T12:00:00.000Z`);
  const end = new Date(`${endDateKey}T12:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date key supplied for calendar-day difference");
  }

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

export function getOperationalDateBounds(dateKey: string) {
  const nextDateKey = addDaysToDateKey(dateKey, 1);

  return {
    dateKey,
    start: operationalDateTimeToInstant(dateKey),
    endExclusive: operationalDateTimeToInstant(nextDateKey),
  };
}

export function getOperationalDayBounds(date = new Date()) {
  return getOperationalDateBounds(getOperationalDateKey(date));
}

export function getOperationalWeekRange(
  date = new Date(),
  weekStartsOn: 0 | 1 = 0
) {
  const todayKey = getOperationalDateKey(date);
  const weekday = new Date(`${todayKey}T12:00:00.000Z`).getUTCDay();
  const daysSinceStart = (weekday - weekStartsOn + 7) % 7;
  const startDateKey = addDaysToDateKey(todayKey, -daysSinceStart);
  const endDateKeyExclusive = addDaysToDateKey(startDateKey, 7);

  return {
    startDateKey,
    endDateKeyExclusive,
    start: operationalDateTimeToInstant(startDateKey),
    endExclusive: operationalDateTimeToInstant(endDateKeyExclusive),
  };
}

export function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "NO DUE";

  const dateOnly = dueDate.split("T")[0];

  return new Date(`${dateOnly}T12:00:00.000Z`)
    .toLocaleDateString("en-US", {
      timeZone: OPERATIONAL_TIME_ZONE,
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}
