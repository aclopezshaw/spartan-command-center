import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

export default function PromotionBoardPage() {
  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-8 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Personnel Command" title="Promotion Board" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Main Board */}
            <div className="lg:col-span-2 border border-cyan-700/40 bg-black/50 p-6">
              <p className="text-sm uppercase tracking-widest text-cyan-400">
                Board Status
              </p>

              <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center text-center">
                <p className="text-4xl font-bold text-slate-400">
                  NOT UP FOR PROMOTION
                </p>

                <p className="mt-4 text-slate-500">
                  Candidate has not yet met promotion eligibility requirements.
                </p>

                <div className="mt-8 border border-slate-700 px-6 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Estimated Time Until Promotion
                  </p>

                  <p className="mt-2 text-2xl font-bold text-cyan-300">
                    TBD
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Current Rank
                </p>

                <p className="mt-2 text-2xl font-bold">
                  Recruit
                </p>
              </div>

              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Next Rank
                </p>

                <p className="mt-2 text-2xl font-bold">
                  Bronze I
                </p>
              </div>

              <div className="border border-cyan-700/40 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Promotion Status
                </p>

                <p className="mt-2 font-bold text-yellow-400">
                  Pending Eligibility
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border border-cyan-700/40 bg-black/50 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-400">
              Future Features
            </p>

            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>• Promotion Eligibility Detection</li>
              <li>• Promotion Ceremony</li>
              <li>• Readiness Point Allocation</li>
              <li>• Promotion History Archive</li>
              <li>• Rank Advancement Rewards</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}