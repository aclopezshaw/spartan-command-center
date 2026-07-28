const RANK_INSIGNIA_DIVISIONS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Onyx",
] as const;

const RANK_INSIGNIA_TIERS = ["I", "II", "III", "IV", "V", "VI"] as const;

export const APPROVED_RANK_INSIGNIA_NAMES = [
  "Recruit",
  ...RANK_INSIGNIA_DIVISIONS.flatMap((division) =>
    RANK_INSIGNIA_TIERS.map((tier) => `${division} ${tier}`)
  ),
  "Champion",
] as const;

export type ApprovedRankInsigniaName =
  (typeof APPROVED_RANK_INSIGNIA_NAMES)[number];

function normalizeRankInsigniaName(rank: string) {
  return rank
    .trim()
    .replace(
      /\b([1-6])$/,
      (_, tier: string) => RANK_INSIGNIA_TIERS[Number(tier) - 1]
    )
    .toLowerCase();
}

const RANK_INSIGNIA_PATHS = new Map(
  APPROVED_RANK_INSIGNIA_NAMES.map((rank) => [
    rank.toLowerCase(),
    `/images/ranks/${rank.toLowerCase().replace(/\s+/g, "-")}.png`,
  ])
);

export function getRankInsigniaPath(rank: string) {
  return (
    RANK_INSIGNIA_PATHS.get(normalizeRankInsigniaName(rank)) ??
    "/images/ranks/recruit.png"
  );
}
