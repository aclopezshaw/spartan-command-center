import { getAlexServiceRecord } from "../lib/notion";
import Image from "next/image";
import NavBar from "./components/NavBar";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
      <div
        className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-cyan-700/50 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function SpartanRenderPanel() {
  return (
    <div className="flex min-h-[360px] flex-col justify-between border border-cyan-700/50 bg-black/70 p-5">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-[360px] w-full overflow-hidden border border-cyan-600/40 bg-slate-900/80 shadow-[0_0_30px_rgba(8,145,178,0.2)]">
          <Image
            src="/images/alex-225-recruit.png"
            alt="ALEX-225 recruit portrait"
            fill
            className="object-cover object-top"
            priority
          />
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button className="bg-cyan-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black">
          Helmet Off
        </button>

        <button className="border border-cyan-700/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
          Helmet On
        </button>
      </div>

      <div className="mt-4 text-center text-sm uppercase tracking-[0.25em]">
        <span className="text-slate-500">Status: </span>
        <span className="text-cyan-400 font-bold">Active</span>
      </div>
    </div>
  );
}

function LoadoutPanel({
  loadout,
}: {
  loadout: {
    armor: string;
    patch: string;
    weapon: string;
    banner: string;
  };
}) {
  const items = [
    ["Armor", loadout.armor],
    ["Patch", loadout.patch],
    ["Weapon", loadout.weapon],
    ["Banner", loadout.banner],
  ];

  return (
    <div className="border border-cyan-700/50 bg-black/60 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
        Equipped Loadout
      </p>

      <div className="mt-5 space-y-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-cyan-900/60 pb-2 text-sm"
          >
            <span className="uppercase tracking-[0.2em] text-slate-500">
              {label}
            </span>
            <span className="text-cyan-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getNextRankXp(xp: number) {
  const thresholds = [
    8000, 16000, 24000, 32000, 40000, 48000,
    56500, 65000, 73500, 82000, 90500, 99000,
    108000, 117000, 126000, 135000, 144000, 153000,
    162500, 172000, 181500, 191000, 200500, 210000,
    220000, 230000, 240000, 250000, 260000, 270000,
  ];

  return thresholds.find((threshold) => xp < threshold) ?? 270000;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const record = await getAlexServiceRecord();
  
  const props = (record as any).properties;
  console.log("SPARTAN:", props["Designation"]);
  console.log("SERVICE SCORE:", props["Service Score"]);
  console.log("TOTAL XP:", props["Total XP Earned"]);

  const properties = (record as any).properties;

  const spartan = {
    designation: properties["Designation"]?.title?.[0]?.plain_text ?? "ALEX-225",
    rank: properties["Calculated Rank"]?.formula?.string ?? "BANANA",
    xp: properties["Service Score"]?.formula?.number ?? 0,
    nextRankXp: getNextRankXp(properties["Service Score"]?.formula?.number ?? 0),
    shields: properties["Shields"]?.number ?? 100,
    campaign: "Spartan Candidate Program",
    campaignProgress: Math.round((2 / 42) * 100),
    campaignDay: 2,
    campaignLength: 42,
    readiness: {
      physical: properties["Physical Readiness"]?.number ?? 0,
      recovery: properties["Recovery Readiness"]?.number ?? 0,
      learning: properties["Learning Readiness"]?.number ?? 0,
      administrative: properties["Administrative Readiness"]?.number ?? 0,
    },
    loadout: {
      armor: "Recruit Armor",
      patch: "Spartan Patch",
      weapon: "Locked",
      banner: "None",
    },
  };
  
  const xpProgress = Math.round((spartan.xp / spartan.nextRankXp) * 100);
  const xpToNextRank = spartan.nextRankXp - spartan.xp;

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <div className="flex items-center justify-between border-b border-cyan-700/50 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">
                UNSC Spartan Dossier
              </p>
              <h1 className="mt-2 text-5xl font-black tracking-tight">
                {spartan.designation}
              </h1>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Current Rank
              </p>
              <p className="text-3xl font-bold text-cyan-300">{spartan.rank}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-4">
                <StatCard label="Service Score" value={spartan.xp} />
                <StatCard label="XP To Bronze 1" value={xpToNextRank} />
                <StatCard label="Shields" value={`${spartan.shields}%`} />
                <StatCard
                  label="Campaign Day"
                  value={`${spartan.campaignDay}/${spartan.campaignLength}`}
                />
              </section>

              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-300">
                  <span>XP PROGRESS</span>
                  <span>
                    {spartan.xp} / {spartan.nextRankXp} XP · {xpProgress}%
                  </span>
                </div>
                <ProgressBar value={xpProgress} />
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-300">
                  <span>SHIELDS</span>
                  <span>{spartan.shields}%</span>
                </div>
                <ProgressBar value={spartan.shields} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                  Current Campaign
                </p>
                <p className="mt-2 text-2xl font-bold">{spartan.campaign}</p>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>CAMPAIGN PROGRESS</span>
                    <span>{spartan.campaignProgress}%</span>
                  </div>
                  <ProgressBar value={spartan.campaignProgress} />
                </div>
              </div>

              <section className="grid gap-4 md:grid-cols-4">
                <StatCard label="Physical" value={spartan.readiness.physical} />
                <StatCard label="Recovery" value={spartan.readiness.recovery} />
                <StatCard label="Learning" value={spartan.readiness.learning} />
                <StatCard
                  label="Admin"
                  value={spartan.readiness.administrative}
                />
              </section>
            </div>

            <div className="space-y-6">
              <SpartanRenderPanel />
              <LoadoutPanel loadout={spartan.loadout} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}