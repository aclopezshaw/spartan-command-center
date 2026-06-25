import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";

export default function ArmoryPage() {
  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <PageHeader eyebrow="UNSC Equipment Bay" title="Armory" />

          <div className="mt-6 border border-cyan-700/50 bg-black/50 p-6">
            <p className="text-xl font-bold text-cyan-100">
              Armory systems pending.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Recruit armor, equipment unlocks, and campaign rewards will be installed here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}