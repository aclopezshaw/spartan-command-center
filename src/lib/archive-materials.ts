export const ARCHIVE_RECOMMENDATION_STATUSES = new Set([
  "Low Priority",
  "Medium Priority",
  "High Priority",
  "Wishlist",
]);

export type ArchiveMaterial = {
  id: string;
  title: string;
  author: string;
  status: string;
  priorityBand: string | null;
  fitScore: number | null;
  currentPage: number;
  totalPages: number;
  lastReadAt: string | null;
};

export type ActiveArchiveMaterial = Pick<
  ArchiveMaterial,
  | "id"
  | "title"
  | "author"
  | "currentPage"
  | "totalPages"
  | "lastReadAt"
>;

export type RecommendedArchiveMaterial = Pick<
  ArchiveMaterial,
  "id" | "title" | "status" | "priorityBand" | "fitScore"
>;

export type ArchiveMaterialsResponse = {
  books: ActiveArchiveMaterial[];
  recommendations: RecommendedArchiveMaterial[];
};

export function formatLastReadDate(value: string | null) {
  if (!value) {
    return "No reports yet";
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const dateOnly = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day))
    );

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(dateOnly);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  }).format(date);
}

function compareTitles(
  left: Pick<ArchiveMaterial, "title">,
  right: Pick<ArchiveMaterial, "title">
) {
  return left.title.localeCompare(right.title, "en", {
    sensitivity: "base",
  });
}

export function selectArchiveMaterials(
  materials: ArchiveMaterial[],
  fitScoreRecommendationLimit = 5
): ArchiveMaterialsResponse {
  const books = materials
    .filter((material) => material.status === "Active")
    .sort((left, right) => {
      const leftProgress =
        left.totalPages > 0 ? left.currentPage / left.totalPages : 0;
      const rightProgress =
        right.totalPages > 0 ? right.currentPage / right.totalPages : 0;

      return rightProgress - leftProgress || compareTitles(left, right);
    })
    .map(
      ({ id, title, author, currentPage, totalPages, lastReadAt }) => ({
      id,
      title,
      author,
      currentPage,
      totalPages,
      lastReadAt,
    })
    );

  const eligibleRecommendations = materials
    .filter((material) =>
      ARCHIVE_RECOMMENDATION_STATUSES.has(material.status)
    )
    .sort((left, right) => {
      const leftScore = left.fitScore ?? Number.NEGATIVE_INFINITY;
      const rightScore = right.fitScore ?? Number.NEGATIVE_INFINITY;

      return rightScore - leftScore || compareTitles(left, right);
    })
  const priorityBandIds = new Set(
    eligibleRecommendations
      .filter((material) => Boolean(material.priorityBand))
      .map((material) => material.id)
  );
  const topFitScoreIds = new Set(
    eligibleRecommendations
      .slice(0, Math.max(0, fitScoreRecommendationLimit))
      .map((material) => material.id)
  );

  const recommendations = eligibleRecommendations
    .filter(
      (material) =>
        priorityBandIds.has(material.id) || topFitScoreIds.has(material.id)
    )
    .map(({ id, title, status, priorityBand, fitScore }) => ({
      id,
      title,
      status,
      priorityBand,
      fitScore,
    }));

  return { books, recommendations };
}
