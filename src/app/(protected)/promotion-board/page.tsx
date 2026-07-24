import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

export default function PromotionBoardPage() {
  const currentXp = 595;
  const nextRankXp = 8000;
  const remainingXp = nextRankXp - currentXp;
  const assumedDailyXp = 150;
  const estimatedDays = Math.ceil(remainingXp / assumedDailyXp);

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-8 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Personnel Command" title="Promotion Board" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 overflow-hidden border border-cyan-700/40 bg-black/50">
              <div
                className="relative min-h-[420px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('/images/promotion-board-stage.png')",
                }}
              >
                <div className="absolute inset-0 bg-black/65" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_55%)]" />

                <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">
                    Board Status
                  </p>

                  <p className="mt-4 text-4xl font-black text-white">
                    NOT READY FOR REVIEW
                  </p>

                  <p className="mt-4 max-w-xl text-sm text-slate-300">
                    Candidate has not yet met promotion eligibility requirements.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="border border-cyan-900/70 bg-black/70 px-6 py-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Current XP
                      </p>
                      <p className="mt-2 text-2xl font-bold text-cyan-200">
                        {currentXp}
                      </p>
                    </div>

                    <div className="border border-cyan-900/70 bg-black/70 px-6 py-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Remaining
                      </p>
                      <p className="mt-2 text-2xl font-bold text-cyan-200">
                        {remainingXp}
                      </p>
                    </div>

                    <div className="border border-cyan-900/70 bg-black/70 px-6 py-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Est. Days
                      </p>
                      <p className="mt-2 text-2xl font-bold text-cyan-200">
                        {estimatedDays}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Board Recommendation
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  Hold
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Continue current training cycle.
                </p>
              </div>

              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Promotion Eligibility
                </p>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-cyan-900/60 pb-2">
                    <span>XP Requirement</span>
                    <span className="text-slate-500">Pending</span>
                  </div>
                  <div className="flex justify-between border-b border-cyan-900/60 pb-2">
                    <span>Campaign Progress</span>
                    <span className="text-slate-500">Pending</span>
                  </div>
                  <div className="flex justify-between border-b border-cyan-900/60 pb-2">
                    <span>Readiness Review</span>
                    <span className="text-slate-500">Pending</span>
                  </div>
                </div>
              </div>

              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Promotion Target
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-500">
                  Bronze I
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Estimated at {assumedDailyXp} XP/day.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
