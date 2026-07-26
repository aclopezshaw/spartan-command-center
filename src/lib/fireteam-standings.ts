export const FIRETEAM_STANDINGS_VERSION = 1;
export const FIRETEAM_STANDINGS_TITLE_PREFIX =
  `Fireteam Standings · v${FIRETEAM_STANDINGS_VERSION} ·`;

export const PHASE_TWO_COMPETITIVE_EVENT_IDS = [
  "fireteam-coordination-drill",
  "casualty-evacuation-simulation",
  "tactical-obstacle-course-trial",
  "squad-navigation-challenge",
  "fireteam-battle-assessment",
] as const;

export type FireteamStandingId =
  | "alpha"
  | "delta"
  | "epsilon"
  | "sigma"
  | "theta";
export type StandingsReadinessKey =
  | "physical"
  | "recovery"
  | "intelligence"
  | "professional";
export type StandingsReadiness = Record<StandingsReadinessKey, number>;

export type FireteamEventScore = {
  fireteamId: FireteamStandingId;
  points: number;
  placement: number;
};

export type FireteamCumulativeStanding = {
  fireteamId: FireteamStandingId;
  points: number;
  eventWins: number;
  finalMajorPlacement: number | null;
  rank: number;
};

export type FireteamStandingWithMovement = FireteamCumulativeStanding & {
  previousRank: number;
  movement: number;
};

export type FireteamStandingsResolution = {
  version: typeof FIRETEAM_STANDINGS_VERSION;
  eventId: string;
  eventPageId: string;
  campaignPageId: string;
  eventType: "Minor Event" | "Major Event";
  eventDay: number;
  primaryReadiness: StandingsReadinessKey | "mixed";
  readinessSnapshot: StandingsReadiness;
  seed: string;
  scores: FireteamEventScore[];
  cumulativeStandings: FireteamCumulativeStanding[];
  resolvedAt: string;
};

const FIRETEAMS: FireteamStandingId[] = [
  "alpha",
  "delta",
  "epsilon",
  "sigma",
  "theta",
];
const RIVAL_BASE_WEIGHTS: Record<
  Exclude<FireteamStandingId, "epsilon">,
  number
> = {
  sigma: 0.4,
  alpha: 0.25,
  theta: 0.2,
  delta: 0.15,
};
const RIVAL_AFFINITIES: Record<
  Exclude<FireteamStandingId, "epsilon">,
  StandingsReadinessKey[]
> = {
  alpha: ["professional"],
  delta: ["recovery"],
  sigma: ["physical"],
  theta: ["intelligence"],
};

function clampPoints(value: number) {
  return Math.max(0, Math.min(4, Math.floor(value)));
}

function hashSeed(seed: string) {
  let value = 2166136261;

  for (const character of seed) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }

  return value >>> 0;
}

function createSeededRandom(seed: string) {
  let value = hashSeed(seed);

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedRivalOrder({
  seed,
  primaryReadiness,
  major,
}: {
  seed: string;
  primaryReadiness: StandingsReadinessKey | "mixed";
  major: boolean;
}) {
  const random = createSeededRandom(seed);
  const remaining: Array<Exclude<FireteamStandingId, "epsilon">> = [
    "alpha",
    "delta",
    "sigma",
    "theta",
  ];
  const ordered: Array<Exclude<FireteamStandingId, "epsilon">> = [];

  while (remaining.length > 0) {
    const weighted = remaining.map((fireteamId) => {
      const affinityBoost =
        (primaryReadiness !== "mixed" &&
          RIVAL_AFFINITIES[fireteamId].includes(primaryReadiness)) ||
        (major && fireteamId === "sigma")
          ? 1.35
          : 1;

      return {
        fireteamId,
        weight: RIVAL_BASE_WEIGHTS[fireteamId] * affinityBoost,
      };
    });
    const totalWeight = weighted.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    let roll = random() * totalWeight;
    let selected = weighted[weighted.length - 1].fireteamId;

    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) {
        selected = item.fireteamId;
        break;
      }
    }

    ordered.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }

  return ordered;
}

export function calculateEpsilonStandingsPoints({
  eventType,
  readiness,
  primaryReadiness,
  requirement,
}: {
  eventType: "Minor Event" | "Major Event";
  readiness: StandingsReadiness;
  primaryReadiness: StandingsReadinessKey | "mixed";
  requirement: number;
}) {
  if (eventType === "Major Event") {
    const average =
      Object.values(readiness).reduce((sum, value) => sum + value, 0) /
      4;
    return clampPoints(average - requirement);
  }

  if (primaryReadiness === "mixed") {
    throw new Error("Minor standings events require one readiness category");
  }

  return clampPoints(readiness[primaryReadiness] - requirement);
}

export function resolveFireteamEventScores({
  eventType,
  readiness,
  primaryReadiness,
  requirement,
  seed,
}: {
  eventType: "Minor Event" | "Major Event";
  readiness: StandingsReadiness;
  primaryReadiness: StandingsReadinessKey | "mixed";
  requirement: number;
  seed: string;
}) {
  const epsilonPoints = calculateEpsilonStandingsPoints({
    eventType,
    readiness,
    primaryReadiness,
    requirement,
  });
  const availableRivalPoints = [0, 1, 2, 3, 4]
    .filter((points) => points !== epsilonPoints)
    .sort((a, b) => b - a);
  const rivalOrder = weightedRivalOrder({
    seed,
    primaryReadiness,
    major: eventType === "Major Event",
  });
  const pointsByFireteam = new Map<FireteamStandingId, number>([
    ["epsilon", epsilonPoints],
  ]);

  rivalOrder.forEach((fireteamId, index) => {
    pointsByFireteam.set(fireteamId, availableRivalPoints[index]);
  });

  return [...pointsByFireteam.entries()]
    .map(([fireteamId, points]) => ({ fireteamId, points }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        FIRETEAMS.indexOf(a.fireteamId) -
          FIRETEAMS.indexOf(b.fireteamId)
    )
    .map((score, index) => ({
      ...score,
      placement: index + 1,
    }));
}

export function calculateCumulativeStandings(
  resolutions: Array<
    Pick<
      FireteamStandingsResolution,
      "eventType" | "scores" | "eventDay"
    >
  >
) {
  const standings = new Map<
    FireteamStandingId,
    Omit<FireteamCumulativeStanding, "rank">
  >(
    FIRETEAMS.map((fireteamId) => [
      fireteamId,
      {
        fireteamId,
        points: 0,
        eventWins: 0,
        finalMajorPlacement: null,
      },
    ])
  );

  for (const resolution of [...resolutions].sort(
    (a, b) => a.eventDay - b.eventDay
  )) {
    for (const score of resolution.scores) {
      const standing = standings.get(score.fireteamId)!;
      standing.points += score.points;
      if (score.placement === 1) standing.eventWins += 1;
      if (resolution.eventType === "Major Event") {
        standing.finalMajorPlacement = score.placement;
      }
    }
  }

  return [...standings.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.eventWins - a.eventWins ||
        (a.finalMajorPlacement ?? Number.POSITIVE_INFINITY) -
          (b.finalMajorPlacement ?? Number.POSITIVE_INFINITY) ||
        FIRETEAMS.indexOf(a.fireteamId) -
          FIRETEAMS.indexOf(b.fireteamId)
    )
    .map((standing, index) => ({
      ...standing,
      rank: index + 1,
    }));
}

export function addStandingsMovement(
  standings: FireteamCumulativeStanding[],
  previousStandings: FireteamCumulativeStanding[] = calculateCumulativeStandings(
    []
  )
): FireteamStandingWithMovement[] {
  const previousRankByFireteam = new Map(
    previousStandings.map((standing) => [
      standing.fireteamId,
      standing.rank,
    ])
  );

  return standings.map((standing) => {
    const previousRank =
      previousRankByFireteam.get(standing.fireteamId) ?? standing.rank;

    return {
      ...standing,
      previousRank,
      movement: previousRank - standing.rank,
    };
  });
}

export function isPhaseTwoCompetitiveEvent(eventId: string) {
  return PHASE_TWO_COMPETITIVE_EVENT_IDS.includes(
    eventId as (typeof PHASE_TWO_COMPETITIVE_EVENT_IDS)[number]
  );
}

export function getFireteamStandingsTitle(eventPageId: string) {
  return `${FIRETEAM_STANDINGS_TITLE_PREFIX} ${eventPageId}`;
}
