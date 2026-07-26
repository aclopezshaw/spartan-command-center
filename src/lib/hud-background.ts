const PHASE_ONE_BACKGROUNDS = [
  { startHour: 5, endHour: 8, src: "/images/hud-obstacle-course-5.png" },
  { startHour: 8, endHour: 11, src: "/images/hud-tactical-class.png" },
  { startHour: 11, endHour: 13, src: "/images/hud-mess-hall.png" },
  { startHour: 13, endHour: 16, src: "/images/hud-briefing.png" },
  { startHour: 16, endHour: 20, src: "/images/hud-field-exercise.png" },
  { startHour: 20, endHour: 22, src: "/images/hud-night-prep.png" },
] as const;

const PHASE_TWO_BACKGROUNDS = [
  {
    startHour: 5,
    endHour: 8,
    src: "/images/hud/phase-ii-fireteam-room-morning.png",
  },
  {
    startHour: 8,
    endHour: 11,
    src: "/images/hud/phase-ii-classroom.png",
  },
  {
    startHour: 11,
    endHour: 13,
    src: "/images/hud/phase-ii-mess-hall.png",
  },
  {
    startHour: 13,
    endHour: 16,
    src: "/images/hud/phase-ii-fireteam-room-day.png",
  },
  {
    startHour: 16,
    endHour: 20,
    src: "/images/hud/phase-ii-fireteam-room-evening.png",
  },
  {
    startHour: 20,
    endHour: 22,
    src: "/images/hud/phase-ii-fireteam-room-night-prep.png",
  },
] as const;

function findBackgroundForHour(
  hour: number,
  backgrounds: ReadonlyArray<{
    startHour: number;
    endHour: number;
    src: string;
  }>,
  fallback: string
) {
  return (
    backgrounds.find(
      ({ startHour, endHour }) => hour >= startHour && hour < endHour
    )?.src ?? fallback
  );
}

export function getHudBackground(
  phaseName: string | null | undefined,
  operationalHour: number
) {
  if (operationalHour < 0 || operationalHour > 23) {
    throw new RangeError("Operational hour must be between 0 and 23.");
  }

  if (phaseName?.trim().toLowerCase().startsWith("phase ii")) {
    return findBackgroundForHour(
      operationalHour,
      PHASE_TWO_BACKGROUNDS,
      "/images/hud/phase-ii-fireteam-room-night.png"
    );
  }

  return findBackgroundForHour(
    operationalHour,
    PHASE_ONE_BACKGROUNDS,
    "/images/hud-bedtime.png"
  );
}
