"use client";

import HudPanel from "../../components/HudPanel";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { submitIntelReport } from "@/lib/intel-report";
import type {
  ActiveArchiveMaterial,
  ArchiveMaterialsResponse,
  RecommendedArchiveMaterial,
} from "@/lib/archive-materials";
import { formatLastReadDate } from "@/lib/archive-materials";

type ArchiveMaterialsApiResponse = Partial<ArchiveMaterialsResponse> & {
  error?: string;
};

async function fetchArchiveMaterials() {
  const response = await fetch("/api/intel-books", {
    cache: "no-store",
  });
  const data = (await response.json()) as ArchiveMaterialsApiResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load Archive materials.");
  }

  return {
    books: data.books ?? [],
    recommendations: data.recommendations ?? [],
  };
}

export default function IntelReportsPage() {
  const [books, setBooks] = useState<ActiveArchiveMaterial[]>([]);
  const [recommendations, setRecommendations] = useState<
    RecommendedArchiveMaterial[]
  >([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pageReadTo, setPageReadTo] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [materialsError, setMaterialsError] = useState("");
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetchArchiveMaterials()
      .then((materials) => {
        setBooks(materials.books);
        setRecommendations(materials.recommendations);
        setSelectedBookId(materials.books[0]?.id ?? "");
        setMaterialsError("");
      })
      .catch((error: unknown) => {
        setMaterialsError(
          error instanceof Error
            ? error.message
            : "Unable to load Archive materials."
        );
      })
      .finally(() => {
        setIsLoadingMaterials(false);
      });
  }, []);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId),
    [books, selectedBookId]
  );

  async function submitReport() {
    setIsSubmitting(true);
    setStatus("Submitting...");

    try {
      const result = await submitIntelReport({
        bookId: selectedBookId,
        pageReadTo,
        notes,
      });

      if (!result.ok) {
        setStatus(result.error);
        return;
      }

      const materials = await fetchArchiveMaterials();
      setBooks(materials.books);
      setRecommendations(materials.recommendations);
      setMaterialsError("");
      setSelectedBookId((currentId) =>
        materials.books.some((book) => book.id === currentId)
          ? currentId
          : materials.books[0]?.id ?? ""
      );
      setPageReadTo("");
      setNotes("");
      setStatus(
        `Intel report recorded: ${result.pagesRead} pages; current page ${result.newPage}.`
      );
    } catch {
      setStatus("Unable to reach command services. Retry the report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <NavBar />
        <div className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
            <PageHeader eyebrow="UNSC Intelligence File" title="Intel Reports" />

            <div className="space-y-6">

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <HudPanel title="Daily Intelligence Report">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Current Reading Material
                </span>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  disabled={isSubmitting || books.length === 0}
                  className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
                {selectedBook && (
                  <span className="mt-2 block text-xs text-slate-500">
                    Recorded at page {selectedBook.currentPage} of{" "}
                    {selectedBook.totalPages}.
                  </span>
                )}
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  New Current Page
                </span>
                <input
                  type="number"
                  min={(selectedBook?.currentPage ?? 0) + 1}
                  max={selectedBook?.totalPages}
                  step={1}
                  value={pageReadTo}
                  onChange={(e) => setPageReadTo(e.target.value)}
                  placeholder={
                    selectedBook
                      ? `${selectedBook.currentPage + 1}–${selectedBook.totalPages}`
                      : "Select a material"
                  }
                  disabled={isSubmitting || !selectedBook}
                  className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Field Notes
                </span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  maxLength={5000}
                  disabled={isSubmitting || !selectedBook}
                  className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                />
              </label>

              <button
                onClick={submitReport}
                disabled={isSubmitting || !selectedBook || !pageReadTo}
                className="border border-cyan-500 bg-cyan-950/50 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-cyan-100 hover:bg-cyan-800/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              {status && (
                <p aria-live="polite" className="text-sm text-cyan-300">
                  {status}
                </p>
              )}
            </div>
          </HudPanel>

          <HudPanel title="Active Materials">
            <div className="space-y-4">
              {isLoadingMaterials && (
                <p className="text-sm text-slate-400">
                  Loading Archive materials...
                </p>
              )}
              {!isLoadingMaterials && materialsError && (
                <p role="alert" className="text-sm text-rose-300">
                  {materialsError}
                </p>
              )}
              {!isLoadingMaterials &&
                !materialsError &&
                books.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No active reading materials.
                  </p>
                )}
              {books.map((book) => {
                const progress =
                  book.totalPages > 0
                    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
                    : 0;

                return (
                  <div key={book.id} className="border-b border-cyan-900/60 pb-4">
                    <p className="font-bold uppercase text-slate-100">{book.title}</p>

                    <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                      <p className="text-slate-400">
                        {book.currentPage} / {book.totalPages} pages
                      </p>
                      <p className="whitespace-nowrap text-right text-slate-500">
                        Last Read: {formatLastReadDate(book.lastReadAt)}
                      </p>
                    </div>

                    <div className="mt-2 h-2 border border-cyan-900/60 bg-black/50">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-cyan-300">{progress}% complete</p>
                  </div>
                );
              })}
            </div>
          </HudPanel>
        </div>

        <HudPanel title="Recommended Reading Materials">
          {isLoadingMaterials && (
            <p className="text-sm text-slate-400">
              Loading Archive recommendations...
            </p>
          )}
          {!isLoadingMaterials && materialsError && (
            <p role="alert" className="text-sm text-rose-300">
              Recommendations unavailable: {materialsError}
            </p>
          )}
          {!isLoadingMaterials &&
            !materialsError &&
            recommendations.length === 0 && (
              <p className="text-sm text-slate-400">
                No recommendation-eligible materials.
              </p>
            )}
          {!isLoadingMaterials &&
            !materialsError &&
            recommendations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {recommendations.map((book) => (
              <div
                key={book.id}
                className="border border-cyan-900/60 bg-black/40 p-4"
              >
                <p className="text-sm font-bold uppercase text-slate-100">
                  {book.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-400">
                  Fit Score {book.fitScore ?? "—"}
                </p>
                <p className="mt-2 text-xs text-slate-400">{book.status}</p>
                {book.priorityBand && (
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500">
                    Priority Band {book.priorityBand}
                  </p>
                )}
              </div>
            ))}
          </div>
          )}
                </HudPanel>
      </div>
    </div>
  </div>
</main>
  );
}
