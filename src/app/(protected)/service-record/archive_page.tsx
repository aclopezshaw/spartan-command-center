import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-cyan-700/50 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
      <div
        className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ServiceRecordPage() {
  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Personnel File" title="Service Record" />

          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard label="Current Rank" value="Recruit" />
            <StatCard label="Service Score" value={175} />
            <StatCard label="Next Promotion" value="Bronze I" />
            <StatCard label="Status" value="Active" />
            <StatCard label="Campaigns" value={0} />
            <StatCard label="Medals" value={0} />
            <StatCard label="Achievements" value={0} />
            <StatCard label="Commendations" value={0} />
          </section>

          <section className="mt-6 border border-cyan-700/50 bg-black/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              Promotion Track
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-300">
                  <span>Recruit → Bronze I</span>
                  <span>175 / 8000 XP · 2%</span>
                </div>
                <ProgressBar value={2} />
              </div>

              {[
                "Bronze I",
                "Bronze II",
                "Bronze III",
                "Silver I",
                "Silver II",
                "Silver III",
                "Gold I",
                "Gold II",
                "Gold III",
              ].map((rank) => (
                <div
                  key={rank}
                  className="flex justify-between border-t border-cyan-900/60 pt-3 text-sm"
                >
                  <span className="text-slate-400">{rank}</span>
                  <span className="uppercase tracking-[0.2em] text-slate-600">
                    Locked
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="border border-cyan-700/50 bg-black/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                Service Timeline
              </p>

              <div className="mt-5 space-y-4">
                {[
                  ["Day 1", "Entered Spartan Candidate Program."],
                  ["Day 2", "Established Spartan Command Center."],
                  ["Day 3", "Campaign Operations linked."],
                  ["Day 3", "UNSC personnel render uploaded."],
                ].map(([day, event]) => (
                  <div key={`${day}-${event}`} className="border-b border-cyan-900/60 pb-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      {day}
                    </p>
                    <p className="mt-1 text-cyan-100">{event}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-cyan-700/50 bg-black/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                Awards Cabinet
              </p>

              <div className="mt-5 space-y-3">
                {["Bronze Medal", "Silver Medal", "Gold Medal"].map((award) => (
                  <div
                    key={award}
                    className="flex justify-between border-b border-cyan-900/60 pb-2 text-sm"
                  >
                    <span className="text-slate-400">{award}</span>
                    <span className="uppercase tracking-[0.2em] text-slate-600">
                      Locked
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm text-slate-500">
                No awards earned. Complete campaign objectives to unlock medals.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}