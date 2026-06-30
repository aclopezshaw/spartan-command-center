"use client";

import HudPanel from "../../components/HudPanel";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import { useEffect, useState } from "react";

export default function IntelReportsPage() {
  const recommendedBooks = [
    { title: "Red Rising", score: 97, status: "High Priority" },
    { title: "The Will of the Many", score: 95, status: "High Priority" },
    { title: "Iron Prince", score: 94, status: "Wishlist" },
    { title: "Blood Song", score: 92, status: "Owned" },
    { title: "Rage of Dragons", score: 91, status: "Owned" },
  ];

  const [books, setBooks] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadBooks() {
      const response = await fetch("/api/intel-books");
      const data = await response.json();

      setBooks(data.books ?? []);

      if (data.books?.length > 0) {
        setSelectedBookId(data.books[0].id);
      }
    }

    loadBooks();
  }, []);

  async function submitReport() {
    setStatus("Submitting...");

    const selectedBook = books.find((book) => book.id === selectedBookId);

    const response = await fetch("/api/intel-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: selectedBookId,
        bookTitle: selectedBook?.title ?? "Unknown Book",
        pagesRead,
        notes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      setStatus(error.error ?? "Failed to submit report");
      return;
    }

    setPagesRead("");
    setNotes("");
    setStatus("Intel report submitted.");
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
                  className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Pages Read Today
                </span>
                <input
                  type="number"
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  placeholder="0"
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
                  className="mt-2 w-full border border-cyan-900/60 bg-black/60 p-3 text-slate-100"
                />
              </label>

              <button
                onClick={submitReport}
                className="border border-cyan-500 bg-cyan-950/50 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-cyan-100 hover:bg-cyan-800/60"
              >
                Submit Report
              </button>
              {status && <p className="text-sm text-cyan-300">{status}</p>}
            </div>
          </HudPanel>

          <HudPanel title="Active Materials">
            <div className="space-y-4">
              {books.map((book) => {
                const progress =
                  book.totalPages > 0
                    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
                    : 0;

                return (
                  <div key={book.id} className="border-b border-cyan-900/60 pb-4">
                    <p className="font-bold uppercase text-slate-100">{book.title}</p>

                    <p className="mt-1 text-xs text-slate-400">
                      {book.currentPage} / {book.totalPages} pages
                    </p>

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {recommendedBooks.map((book) => (
              <div
                key={book.title}
                className="border border-cyan-900/60 bg-black/40 p-4"
              >
                <p className="text-sm font-bold uppercase text-slate-100">
                  {book.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-400">
                  Fit Score {book.score}
                </p>
                <p className="mt-2 text-xs text-slate-400">{book.status}</p>
              </div>
            ))}
          </div>
                </HudPanel>
      </div>
    </div>
  </div>
</main>
  );
}