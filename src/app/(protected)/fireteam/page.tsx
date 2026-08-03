import Image from "next/image";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import PageHeader from "../../components/PageHeader";
import {
  FIRETEAM_RELATIONSHIP_LADDER,
  getUnitCohesionRelationshipState,
  type UnitCohesionMemberId,
} from "@/lib/unit-cohesion";
import {
  getFireteamAssignmentStatus,
  getUnitCohesionStatus,
} from "@/lib/notion";
import { getAwardedPersonnelInsignia } from "@/lib/personnel-insignia";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FireteamPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { preview } = await searchParams;
  const assignment = await getFireteamAssignmentStatus();
  const isDevelopmentPreview =
    process.env.NODE_ENV === "development" && preview === "assigned";
  const unlocked =
    assignment.state === "completed" || isDevelopmentPreview;
  const assignmentDate =
    assignment.persisted.assignedAt ??
    (isDevelopmentPreview ? "PHASE II PREVIEW" : null);
  const cohesion =
    assignment.state === "completed"
      ? await getUnitCohesionStatus()
      : {
          enabled: isDevelopmentPreview,
          eligibleFrom: assignment.persisted.assignedAt,
          relationships: [
            "epsilon-michael",
            "epsilon-paige",
            "epsilon-ellie",
            "epsilon-zoe",
          ].map((memberId) =>
            getUnitCohesionRelationshipState(
              memberId as UnitCohesionMemberId,
              0
            )
          ),
          duplicateOperationIds: [],
        };
  const relationshipsByMember = new Map(
    cohesion.relationships.map((relationship) => [
      relationship.memberId,
      relationship,
      ])
  );
  const personnelInsignia = getAwardedPersonnelInsignia({
    fireteamAssignmentState: assignment.state,
    fireteamId: assignment.persisted.fireteamId,
  });

  return (
    <main className="min-h-screen bg-black p-4 font-mono text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <NavBar />

        <section className="border border-cyan-600/60 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(8,145,178,0.22)] sm:p-6">
          <PageHeader
            eyebrow="SCP Personnel Command · Phase II Operations"
            title={unlocked ? assignment.fireteam.name : "Fireteam Records"}
            personnelInsignia={personnelInsignia}
          />

          {isDevelopmentPreview ? (
            <div className="mt-5 border border-amber-500/60 bg-amber-950/30 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">
              Development Preview · No personnel state or ceremony progress
              has been written
            </div>
          ) : null}

          {!unlocked ? (
            <div className="mt-6 grid min-h-[520px] place-items-center overflow-hidden border border-cyan-900/60 bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.13),rgba(0,0,0,0.92)_65%)] p-6 text-center">
              <div className="max-w-xl">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-cyan-800/50 bg-black/50 text-4xl text-cyan-900">
                  ε
                </div>
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-500">
                  Personnel File Restricted
                </p>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Fireteam Assignment Pending
                </h2>
                <p className="mt-3 text-xs leading-6 text-slate-400 sm:text-sm">
                  Roster, identity, and dossier access unlock after Personnel
                  Command verifies the permanent Fireteam Assignment record.
                </p>
                {assignment.state === "available" ||
                assignment.state === "in_progress" ||
                assignment.state === "finalizing" ? (
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
              <div className="mt-6 grid gap-5 border border-cyan-800/60 bg-black/50 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                <Image
                  src={assignment.fireteam.patchPath}
                  alt="Fireteam Epsilon patch"
                  width={160}
                  height={160}
                  priority
                  className="h-36 w-36 object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.32)]"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-400">
                    Permanent Operational Identity
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-white">
                    {assignment.fireteam.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-cyan-200">
                    {assignment.fireteam.motto}
                  </p>
                </div>
                <div className="border-l border-cyan-800/60 pl-4 md:text-right">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    Assignment Date
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase text-white">
                    {assignmentDate}
                  </p>
                  <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    Strength
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase text-white">
                    5 / 5
                  </p>
                </div>
              </div>

              <section className="mt-5 border border-cyan-800/60 bg-black/50 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-400">
                      Fireteam Relationship Progression
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Complete habits in a teammate&apos;s associated readiness
                      category to advance that relationship.
                    </p>
                  </div>
                  <p className="shrink-0 border-l border-cyan-800/60 pl-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
                    1 Associated Habit
                    <span className="mx-2 text-cyan-700">=</span>
                    1 Point
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {["Acquaintance", "Familiar", "Trusted", "Bonded"].map(
                    (stage, stageIndex) => {
                      const tiers = FIRETEAM_RELATIONSHIP_LADDER.filter(
                        (level) => level.stage === stage
                      );

                      return (
                        <div
                          key={stage}
                          className="border border-slate-800 bg-slate-950/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                                stageIndex === 0
                                  ? "text-cyan-300"
                                  : "text-slate-300"
                              }`}
                            >
                              {stage}
                            </p>
                            <p className="text-[8px] uppercase tracking-[0.16em] text-slate-500">
                              {tiers[0].points} pts / tier
                            </p>
                          </div>

                          <div
                            className="mt-3 grid grid-cols-4 overflow-hidden border border-slate-800"
                            aria-label={`${stage} relationship tiers`}
                          >
                            {tiers.map((level) => (
                              <div
                                key={level.level}
                                className={`relative border-r border-slate-800 px-2 py-2 text-center last:border-r-0 ${
                                  level.level === "Acquaintance I"
                                    ? "bg-cyan-950/55"
                                    : "bg-black/50"
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-black ${
                                    level.level === "Acquaintance I"
                                      ? "text-cyan-200"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {level.tier}
                                </p>
                                <div
                                  className={`absolute inset-x-0 bottom-0 h-0.5 ${
                                    level.level === "Acquaintance I"
                                      ? "bg-cyan-500"
                                      : "bg-slate-800"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3 text-[8px] uppercase tracking-[0.16em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-800" />
                  <span>16 levels · 1,000 total qualifying habits</span>
                  <span className="h-px flex-1 bg-slate-800" />
                </div>

                {cohesion.duplicateOperationIds.length > 0 ? (
                  <p className="mt-3 border border-amber-700/60 bg-amber-950/30 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200">
                    Unit Cohesion ledger requires reconciliation before
                    additional relationship progress is trusted.
                  </p>
                ) : null}
              </section>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {assignment.fireteam.members
                  .filter((member) => !member.isPlayer)
                  .map((member) => {
                    const relationship =
                      relationshipsByMember.get(member.id) ??
                      getUnitCohesionRelationshipState(
                        member.id as UnitCohesionMemberId,
                        0
                      );

                    return (
                      <article
                        key={member.id}
                        className="overflow-hidden border border-cyan-900/70 bg-black/60"
                      >
                    <div className="relative aspect-[2/3]">
                      <Image
                        src={member.dossierPath}
                        alt={`${member.name} dossier portrait`}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 220px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.7)]"
                            aria-label="Active"
                          />
                          <p className="text-lg font-black uppercase tracking-[0.09em] text-white">
                            {member.designation}
                          </p>
                        </div>
                        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                          {member.affinity}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-cyan-900/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em]">
                        <span className="font-bold text-slate-300">
                          {relationship.relationshipState}
                        </span>
                        <span className="shrink-0 text-slate-500">
                          {relationship.relationshipProgress} /{" "}
                          {relationship.relationshipThreshold}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1 overflow-hidden bg-slate-800"
                        role="progressbar"
                        aria-label={`${member.name} relationship progress`}
                        aria-valuemin={0}
                        aria-valuemax={relationship.relationshipThreshold}
                        aria-valuenow={relationship.relationshipProgress}
                      >
                        <div
                          className="h-full bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.45)]"
                          style={{
                            width: `${Math.min(
                              100,
                              (relationship.relationshipProgress /
                                relationship.relationshipThreshold) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </article>
                    );
                  })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
