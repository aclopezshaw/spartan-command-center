import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import {
  getReadinessLedgerStatus,
  getServiceHistoryRecords,
} from "@/lib/notion";
import { formatDueDate } from "@/lib/date";
import {
  countServiceHistoryFilters,
  getServiceHistoryCategory,
  matchesServiceHistoryFilter,
  parseServiceHistoryFilter,
  SERVICE_HISTORY_FILTERS,
  type ServiceHistoryFilter,
} from "@/lib/service-history-view";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readinessColor(category: string) {
  switch (category) {
    case "Physical":
      return "text-emerald-300 border-emerald-500/60";
    case "Recovery":
      return "text-blue-300 border-blue-500/60";
    case "Intelligence":
      return "text-yellow-300 border-yellow-500/60";
    case "Professional":
      return "text-purple-300 border-purple-500/60";
    case "Mixed":
      return "text-rose-300 border-rose-500/60";
    default:
      return "text-cyan-100 border-cyan-900/50";
  }
}

function recordTheme(filter: Exclude<ServiceHistoryFilter, "all" | "readiness">) {
  switch (filter) {
    case "campaigns":
      return "border-white/80 bg-white/5 text-white shadow-[0_0_14px_rgba(255,255,255,0.16)]";
    case "events":
      return "border-cyan-500/70 bg-cyan-950/15 text-cyan-200";
    case "achievements":
      return "border-amber-500/60 bg-amber-950/10 text-amber-200";
    case "promotions":
      return "border-violet-500/60 bg-violet-950/10 text-violet-200";
    case "assignments":
      return "border-blue-500/60 bg-blue-950/10 text-blue-200";
    default:
      return "border-cyan-900/50 bg-black/50 text-cyan-100";
  }
}

export default async function ServiceHistoryPage({
  searchParams,
}: PageProps<"/campaign-history">) {
  const selectedFilter = parseServiceHistoryFilter(
    (await searchParams).filter
  );
  const [history, readinessLedger] = await Promise.all([
    getServiceHistoryRecords(),
    getReadinessLedgerStatus(),
  ]);
  const filterCounts = countServiceHistoryFilters(history);
  const visibleHistory = history.filter((entry) =>
    matchesServiceHistoryFilter(entry, selectedFilter)
  );
  const readinessTotals = [
    {
      label: "Physical",
      value: readinessLedger.authoritativeTotals.physical,
    },
    {
      label: "Recovery",
      value: readinessLedger.authoritativeTotals.recovery,
    },
    {
      label: "Intelligence",
      value: readinessLedger.authoritativeTotals.intelligence,
    },
    {
      label: "Professional",
      value: readinessLedger.authoritativeTotals.professional,
    },
  ];

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Personnel Archive" title="Service History" />

          <section className="mt-6 border border-cyan-900/60 bg-black/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-400">
                  Readiness Attribution
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Current readiness totals with a durable source record for every awarded point.
                </p>
              </div>
              <p
                className={`text-xs uppercase tracking-[0.2em] ${
                  readinessLedger.reconciled
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {readinessLedger.reconciled
                  ? "Ledger Verified"
                  : readinessLedger.available
                    ? "Reconciliation Required"
                    : "Ledger Migration Pending"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {readinessTotals.map(({ label, value }) => (
                <div
                  key={label}
                  className={`border bg-slate-950/80 p-3 ${readinessColor(label)}`}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-200">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Durable record of campaigns, events, achievements, and progression.
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Showing {visibleHistory.length} of {history.length}
              </p>
            </div>

            <nav
              aria-label="Service History filters"
              className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            >
              {SERVICE_HISTORY_FILTERS.map(({ value, label }) => {
                const active = selectedFilter === value;
                const href =
                  value === "all"
                    ? "/campaign-history"
                    : `/campaign-history?filter=${value}`;

                return (
                  <Link
                    key={value}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                      active
                        ? "border-cyan-300 bg-cyan-400 text-black"
                        : "border-cyan-900/60 bg-black/40 text-slate-300 hover:border-cyan-500 hover:bg-cyan-400/10 hover:text-cyan-100"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={
                        active ? "text-black/70" : "text-cyan-600"
                      }
                    >
                      {filterCounts[value]}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {history.length === 0 ? (
              <p className="mt-5 border border-cyan-900/50 bg-black/50 p-5 text-sm text-slate-400">
                No durable service history entries have been recorded yet.
              </p>
            ) : visibleHistory.length === 0 ? (
              <p className="mt-5 border border-cyan-900/50 bg-black/50 p-5 text-sm text-slate-400">
                No records match this Service History filter.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {visibleHistory.map((entry) => {
                  const category = getServiceHistoryCategory(entry);
                  const theme =
                    entry.readinessPoints !== 0
                      ? readinessColor(entry.readinessCategory)
                      : recordTheme(category);

                  return (
                    <article
                      key={entry.id}
                      className={`border p-4 ${theme}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {entry.title || "Untitled record"}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="border border-current/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">
                              {entry.entryType}
                            </span>
                            {entry.campaignDay ? (
                              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                Campaign Day {entry.campaignDay}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>{entry.date ? formatDueDate(entry.date) : "DATE UNKNOWN"}</p>
                          {entry.xpAwarded > 0 && <p className="mt-1 text-cyan-300">+{entry.xpAwarded} XP</p>}
                          {entry.readinessPoints !== 0 && (
                            <p className={`mt-1 ${readinessColor(entry.readinessCategory).split(" ")[0]}`}>
                              {entry.readinessPoints > 0 ? "+" : ""}
                              {entry.readinessPoints} {entry.readinessCategory}
                            </p>
                          )}
                        </div>
                      </div>
                      {entry.description && <p className="mt-3 text-sm text-slate-300">{entry.description}</p>}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
