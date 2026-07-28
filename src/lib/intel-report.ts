export const INTEL_REPORT_MAX_PAGE = 100_000;
export const INTEL_REPORT_MAX_NOTES_LENGTH = 5_000;

export type IntelReportRequest = {
  bookId?: unknown;
  pageReadTo?: unknown;
  notes?: unknown;
};

export type ParsedIntelReportRequest = {
  bookId: string;
  pageReadTo: number;
  notes: string;
};

export type IntelReportAdvance = {
  previousPage: number;
  newPage: number;
  pagesRead: number;
};

export type IntelReportSubmissionResult =
  | {
      ok: true;
      recovered: boolean;
      previousPage: number;
      newPage: number;
      pagesRead: number;
    }
  | {
      ok: false;
      error: string;
    };

type IntelReportFetch = (
  input: string,
  init: {
    method: "POST";
    headers: { "Content-Type": "application/json" };
    body: string;
  }
) => Promise<{
  ok: boolean;
  json(): Promise<unknown>;
}>;

type IntelReportValidationResult =
  | { ok: true; value: ParsedIntelReportRequest }
  | { ok: false; error: string };

function isNotionPageId(value: string) {
  return /^[0-9a-f]{32}$/i.test(value.replaceAll("-", ""));
}

export function parseIntelReportRequest(
  body: IntelReportRequest
): IntelReportValidationResult {
  const bookId =
    typeof body.bookId === "string" ? body.bookId.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const pageReadTo =
    typeof body.pageReadTo === "number" ||
    (typeof body.pageReadTo === "string" && body.pageReadTo.trim() !== "")
      ? Number(body.pageReadTo)
      : Number.NaN;

  if (!isNotionPageId(bookId)) {
    return { ok: false, error: "Select a valid active reading material." };
  }

  if (
    !Number.isInteger(pageReadTo) ||
    pageReadTo < 1 ||
    pageReadTo > INTEL_REPORT_MAX_PAGE
  ) {
    return {
      ok: false,
      error: `New current page must be a whole number from 1 to ${INTEL_REPORT_MAX_PAGE.toLocaleString("en-US")}.`,
    };
  }

  if (notes.length > INTEL_REPORT_MAX_NOTES_LENGTH) {
    return {
      ok: false,
      error: `Field notes cannot exceed ${INTEL_REPORT_MAX_NOTES_LENGTH.toLocaleString("en-US")} characters.`,
    };
  }

  return {
    ok: true,
    value: {
      bookId,
      pageReadTo,
      notes,
    },
  };
}

export function calculateIntelReportAdvance({
  currentPage,
  totalPages,
  pageReadTo,
}: {
  currentPage: number;
  totalPages: number;
  pageReadTo: number;
}): IntelReportAdvance {
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 1
  ) {
    throw new Error("The selected Archive record has invalid page metadata.");
  }

  if (currentPage > totalPages) {
    throw new Error(
      `The selected Archive record is already beyond its total page count (${currentPage} / ${totalPages}).`
    );
  }

  if (pageReadTo <= currentPage) {
    throw new Error(
      `New current page must be higher than the recorded page (${currentPage}).`
    );
  }

  if (pageReadTo > totalPages) {
    throw new Error(
      `New current page cannot exceed the material's total page count (${totalPages}).`
    );
  }

  return {
    previousPage: currentPage,
    newPage: pageReadTo,
    pagesRead: pageReadTo - currentPage,
  };
}

export function getIntelReportTitle(bookTitle: string, pageReadTo: number) {
  return `${bookTitle} — Through Page ${pageReadTo}`;
}

export function buildIntelReportProperties({
  bookId,
  bookTitle,
  pageReadTo,
  pagesRead,
  notes,
  reportedAt,
}: {
  bookId: string;
  bookTitle: string;
  pageReadTo: number;
  pagesRead: number;
  notes: string;
  reportedAt: string;
}) {
  return {
    Title: {
      title: [
        {
          text: {
            content: getIntelReportTitle(bookTitle, pageReadTo),
          },
        },
      ],
    },
    Date: {
      date: { start: reportedAt },
    },
    Book: {
      relation: [{ id: bookId }],
    },
    "Pages Read": {
      number: pagesRead,
    },
    Notes: {
      rich_text: notes
        ? [{ text: { content: notes } }]
        : [],
    },
  };
}

export async function submitIntelReport({
  bookId,
  pageReadTo,
  notes,
  fetcher = fetch,
}: {
  bookId: string;
  pageReadTo: string;
  notes: string;
  fetcher?: IntelReportFetch;
}): Promise<IntelReportSubmissionResult> {
  const response = await fetcher("/api/intel-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookId,
      pageReadTo,
      notes,
    }),
  });
  const result = (await response.json()) as Partial<
    IntelReportSubmissionResult & { error: string }
  >;

  if (!response.ok || result.ok !== true) {
    return {
      ok: false,
      error:
        typeof result.error === "string"
          ? result.error
          : "Failed to submit report.",
    };
  }

  if (
    typeof result.pagesRead !== "number" ||
    typeof result.previousPage !== "number" ||
    typeof result.newPage !== "number"
  ) {
    return {
      ok: false,
      error: "Command services returned an invalid Intel Report response.",
    };
  }

  return {
    ok: true,
    recovered: result.recovered === true,
    pagesRead: result.pagesRead,
    previousPage: result.previousPage,
    newPage: result.newPage,
  };
}
