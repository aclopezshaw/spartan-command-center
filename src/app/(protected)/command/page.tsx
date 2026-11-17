import Image from "next/image";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import PageHeader from "@/app/components/PageHeader";
import { ATHENA_COMMAND_ROSTER } from "@/lib/command-school";
import { getCommandAssignmentStatus } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandRosterPage() {
  const assignment = await getCommandAssignmentStatus();
  const unlocked = assignment.state === "completed";
  const canReport = ["available", "in_progress", "finalizing"].includes(
    assignment.state
  );

  return (
    <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
          <PageHeader
            eyebrow="SCP Personnel Command · Phase III Leadership"
            title={unlocked ? assignment.command.name : "Command Records"}
          />

          {!unlocked ? (
            <div className="mt-6 grid min-h-[520px] place-items-center border border-blue-900/60 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.16),rgba(0,0,0,0.92)_65%)] p-6 text-center">
              <div className="max-w-xl">
                <Image
                  src={assignment.command.patchPath}
                  alt="Athena Command patch"
                  width={150}
                  height={150}
                  className="mx-auto h-32 w-32 object-contain opacity-30 grayscale"
                />
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.35em] text-blue-400">
                  Command File Restricted
                </p>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Command Assignment Pending
                </h2>
                <p className="mt-3 text-xs leading-6 text-slate-400 sm:text-sm">
                  Athena Command&apos;s leadership roster unlocks only after you
                  personally accept command in the Assembly Hall.
                </p>
                {canReport ? (
                  <Link
                    href="/assembly-hall"
                    className="mt-6 inline-block border border-amber-400/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-200 transition hover:bg-amber-300/10"
                  >
                    Report to Assembly Hall
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 border border-blue-800/60 bg-black/50 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                <Image
                  src={assignment.command.patchPath}
                  alt="Athena Command patch"
                  width={170}
                  height={170}
                  priority
                  className="h-36 w-36 object-contain drop-shadow-[0_0_24px_rgba(59,130,246,0.4)]"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-blue-400">
                    Permanent Leadership Identity
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-white">
                    {assignment.command.battalion.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-blue-200">
                    {assignment.command.motto}
                  </p>
                </div>
                <div className="border-l border-blue-800/60 pl-4 md:text-right">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    Your Role
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase text-white">
                    {assignment.persisted.role}
                  </p>
                  <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    Assigned
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase text-white">
                    {assignment.persisted.assignedAt}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 border border-blue-900/60 bg-blue-950/15 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                    Battalion Leadership System
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Review the approved chain of command and each commander&apos;s
                    readiness affinity.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3"><Link href="/command/dashboard" className="shrink-0 border border-blue-500/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10">Leadership Dashboard</Link><Link
                  href="/command/trust"
                  className="shrink-0 border border-blue-500/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10"
                >
                  Open Command Trust
                </Link><Link href="/command/cohesion" className="shrink-0 border border-blue-500/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10">Battalion Cohesion</Link><Link href="/command/leaderboard" className="shrink-0 border border-blue-500/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10">Battalion Rankings</Link></div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {ATHENA_COMMAND_ROSTER.map((member) => (
                  <article
                    key={member.memberId}
                    className="overflow-hidden border border-blue-900/70 bg-black/60"
                  >
                    <div className="relative aspect-[4/5] bg-slate-950">
                      <Image
                        src={member.dossierPath}
                        alt={`${member.designation} dossier portrait`}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent p-4 pt-14">
                        <p className="text-lg font-black uppercase text-white">
                          {member.designation}
                        </p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.18em] text-slate-500">
                          Command
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase text-slate-200">
                          {member.companyName ?? assignment.command.battalion.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.18em] text-slate-500">
                          Readiness Affinity
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase text-cyan-200">
                          {member.affinity}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
