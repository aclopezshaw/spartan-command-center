import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import { getServiceHistoryRecords } from "@/lib/notion";
import { formatDueDate } from "@/lib/date";

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

function isCampaignRecord(entryType: string) {
  return entryType === "Campaign" || entryType === "Minor Event" || entryType === "Major Event";
}

export default async function ServiceHistoryPage() {
  const history = await getServiceHistoryRecords();

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Personnel Archive" title="Service History" />

          <section className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Durable record of campaigns, events, achievements, and progression.
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {history.length} {history.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            {history.length === 0 ? (
              <p className="mt-5 border border-cyan-900/50 bg-black/50 p-5 text-sm text-slate-400">
                No durable service history entries have been recorded yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {history.map((entry) => (
                  <article
                    key={entry.id}
                    className={`border bg-black/50 p-4 ${
                      entry.readinessPoints > 0
                        ? readinessColor(entry.readinessCategory)
                        : isCampaignRecord(entry.entryType)
                          ? "border-white/80 shadow-[0_0_14px_rgba(255,255,255,0.16)]"
                          : "border-cyan-900/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className={`font-bold ${entry.readinessPoints > 0 ? readinessColor(entry.readinessCategory).split(" ")[0] : "text-cyan-100"}`}>
                          {entry.title || "Untitled record"}
                        </h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {entry.entryType}{entry.campaignDay ? ` · Campaign Day ${entry.campaignDay}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{entry.date ? formatDueDate(entry.date) : "DATE UNKNOWN"}</p>
                        {entry.xpAwarded > 0 && <p className="mt-1 text-cyan-300">+{entry.xpAwarded} XP</p>}
                        {entry.readinessPoints > 0 && (
                          <p className={`mt-1 ${readinessColor(entry.readinessCategory).split(" ")[0]}`}>
                            +{entry.readinessPoints} {entry.readinessCategory}
                          </p>
                        )}
                      </div>
                    </div>
                    {entry.description && <p className="mt-3 text-sm text-slate-300">{entry.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
