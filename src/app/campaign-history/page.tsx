import NavBar from "../components/NavBar";

function CampaignCard({
  name,
  status,
  progress,
  reward,
  medal,
}: {
  name: string;
  status: string;
  progress: number;
  reward: string;
  medal: string;
}) {
  const isActive = status === "Active";

  return (
    <div
      className={`border p-5 ${
        isActive
          ? "border-cyan-500/70 bg-slate-950/90 shadow-[0_0_20px_rgba(8,145,178,0.2)]"
          : "border-cyan-900/60 bg-black/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            Campaign
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{name}</h2>
        </div>

        <span
          className={`border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
            isActive
              ? "border-cyan-400 bg-cyan-400 text-black"
              : "border-cyan-900/60 text-slate-500"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm text-slate-300">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-sm border border-cyan-700/50 bg-slate-800">
          <div
            className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Reward
          </p>
          <p className="mt-1 text-cyan-100">{reward}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Medal Earned
          </p>
          <p className="mt-1 text-cyan-100">{medal}</p>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CampaignHistoryPage() {
  const campaigns = [
    {
      name: "Spartan Candidate Program",
      status: "Active",
      progress: 7,
      reward: "Recruit Armor Set",
      medal: "None",
    },
    {
      name: "The Pillar of Autumn",
      status: "Locked",
      progress: 0,
      reward: "Classified",
      medal: "Locked",
    },
    {
      name: "Halo",
      status: "Locked",
      progress: 0,
      reward: "Classified",
      medal: "Locked",
    },
    {
      name: "The Truth and Reconciliation",
      status: "Locked",
      progress: 0,
      reward: "Classified",
      medal: "Locked",
    },
    {
      name: "The Silent Cartographer",
      status: "Locked",
      progress: 0,
      reward: "Classified",
      medal: "Locked",
    },
    {
      name: "Assault on the Control Room",
      status: "Locked",
      progress: 0,
      reward: "Classified",
      medal: "Locked",
    },
  ];

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-6 shadow-[0_0_30px_rgba(8,145,178,0.25)]">
          <div className="border-b border-cyan-700/50 pb-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">
              UNSC Campaign Archive
            </p>
            <h1 className="mt-2 text-5xl font-black tracking-tight">
              Campaign History
            </h1>
          </div>

          <div className="mt-6 grid gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.name} {...campaign} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}