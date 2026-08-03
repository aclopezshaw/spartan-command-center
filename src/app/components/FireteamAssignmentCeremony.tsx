"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FireteamAssignmentStatus } from "@/lib/notion";
import { FIRETEAM_ASSIGNMENT_MAX_STEP } from "@/lib/fireteam-assignment";

type CeremonyAction = "begin" | "progress" | "complete";

export default function FireteamAssignmentCeremony({
  initialStatus,
  preview = false,
}: {
  initialStatus: FireteamAssignmentStatus;
  preview?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replayStep, setReplayStep] = useState<number | null>(null);
  const isReplay = replayStep !== null;
  const step = replayStep ?? initialStatus.persisted.step;
  const phaseResult = initialStatus.eligibility.phaseResult;
  const teammates = initialStatus.fireteam.members.filter(
    ({ isPlayer }) => !isPlayer
  );

  if (preview) {
    return (
      <div className="mt-5 overflow-hidden border border-cyan-400/60 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(0,15,25,0.94))] shadow-[0_0_32px_rgba(34,211,238,0.16)]">
        <div className="border-b border-cyan-800/70 bg-cyan-950/25 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-300">
              Personnel Command · Formal Proceedings
            </p>
            <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
              Development Preview · No Record Mutation
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.72fr_1.4fr] lg:items-center">
          <div className="flex flex-col items-center border-b border-cyan-900/70 pb-6 text-center lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <Image
              src={initialStatus.fireteam.patchPath}
              alt="Fireteam Epsilon assignment insignia"
              width={220}
              height={220}
              className="h-40 w-40 object-contain drop-shadow-[0_0_28px_rgba(34,211,238,0.45)] sm:h-48 sm:w-48"
            />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
              Unit Designation
            </p>
            <p className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">
              Fireteam Epsilon
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">
              Five, Forward.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
              Assignment Order
            </p>
            <blockquote className="mt-3 border-l-2 border-amber-300/70 pl-4">
              <p className="text-base font-bold leading-7 text-slate-100 sm:text-lg">
                “ALEX-225. Individual Training is complete. Effective
                immediately, you are assigned to Fireteam Epsilon.”
              </p>
            </blockquote>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {initialStatus.fireteam.members.map((member) => (
                <div
                  key={member.id}
                  className={`border px-3 py-3 ${
                    member.isPlayer
                      ? "border-amber-400/60 bg-amber-950/20"
                      : "border-cyan-900/70 bg-black/35"
                  }`}
                >
                  <p
                    className={`text-[9px] font-bold uppercase tracking-[0.14em] ${
                      member.isPlayer ? "text-amber-200" : "text-cyan-300"
                    }`}
                  >
                    {member.designation}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {member.isPlayer ? "You" : member.name}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-2xl text-xs leading-6 text-slate-300">
              Your status advances from Individual to Fireteam Member. This
              roster constitutes your permanent operational identity for
              Phase II Fireteam Operations.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-900/70 pt-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Acknowledgment creates the permanent assignment record
              </p>
              <button
                type="button"
                disabled
                className="border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100"
              >
                Acknowledge Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function mutate(action: CeremonyAction, nextStep?: number) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/progression/fireteam-assignment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, step: nextStep }),
        }
      );
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Personnel Command rejected the operation."
        );
      }

      router.refresh();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update the ceremony."
      );
    } finally {
      setPending(false);
    }
  }

  if (initialStatus.state === "locked") {
    return (
      <div className="mt-5 border-l-2 border-slate-700 bg-black/35 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Ceremony Control
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
          Awaiting eligible assignment orders
        </p>
      </div>
    );
  }

  if (initialStatus.state === "conflict") {
    return (
      <div className="mt-5 border border-red-700/70 bg-red-950/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-red-300">
          Personnel Record Conflict
        </p>
        <p className="mt-2 text-xs leading-5 text-red-100">
          {initialStatus.reasons.join(" ")}
        </p>
      </div>
    );
  }

  if (initialStatus.state === "available") {
    return (
      <div className="mt-5 border border-amber-500/60 bg-amber-950/25 p-4 shadow-[0_0_24px_rgba(245,158,11,0.12)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
          Assignment Orders Authenticated
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Enter the ceremony to freeze the final Individual Training record
          and begin the recoverable Fireteam Assignment sequence.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => mutate("begin")}
          className="mt-4 border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Opening Ceremony…" : "Begin Ceremony"}
        </button>
        {error ? (
          <p
            className="mt-3 text-xs text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (initialStatus.state === "finalizing") {
    return (
      <div className="mt-5 border border-amber-500/60 bg-amber-950/25 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
          Assignment Reconciliation Required
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          The canonical Fireteam Epsilon identity is safe. Personnel Command
          must reconcile its history and completion marker before dismissing
          these orders.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => mutate("complete")}
          className="mt-4 border border-amber-300/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 transition hover:bg-amber-300/10 disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Reconciling…" : "Recover Assignment Record"}
        </button>
        {error ? (
          <p className="mt-3 text-xs text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (initialStatus.state === "completed" && !isReplay) {
    return (
      <div className="mt-5 border border-cyan-600/50 bg-cyan-950/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
          Permanent Assignment Recorded
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image
            src={initialStatus.fireteam.patchPath}
            alt="Fireteam Epsilon patch"
            width={104}
            height={104}
            className="h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.3)]"
          />
          <div>
            <p className="text-xl font-black uppercase tracking-[0.12em] text-white">
              {initialStatus.fireteam.name}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              {initialStatus.fireteam.motto}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-400">
              Assigned {initialStatus.persisted.assignedAt}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReplayStep(0)}
          className="mt-4 border border-cyan-500/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          Replay Ceremony
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 border border-cyan-500/60 bg-slate-950/80 p-4 shadow-[0_0_28px_rgba(8,145,178,0.14)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            {isReplay ? "Ceremony Archive Replay" : "Ceremony In Progress"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Presentation {step + 1} / {FIRETEAM_ASSIGNMENT_MAX_STEP + 1}
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({
            length: FIRETEAM_ASSIGNMENT_MAX_STEP + 1,
          }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 w-5 ${
                index <= step ? "bg-cyan-300" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 0 ? (
        <div className="mt-5">
          <p className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Individual Training Complete
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">
            ALEX-225 has satisfied the operational, event, and service-history
            requirements of Phase I. The final campaign record is frozen.
          </p>
          <div className="mt-4 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
            <CeremonyMetric
              label="Final XP"
              value={
                phaseResult
                  ? `${phaseResult.earnedXp.toLocaleString()}`
                  : "Verified"
              }
            />
            <CeremonyMetric
              label="Maximum"
              value={
                phaseResult
                  ? phaseResult.maxPhaseXp.toLocaleString()
                  : "Frozen"
              }
            />
            <CeremonyMetric
              label="Campaign Medal"
              value={phaseResult?.medalEarned ?? "Recorded"}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Image
            src={initialStatus.fireteam.patchPath}
            alt="Fireteam Epsilon patch"
            width={180}
            height={180}
            className="h-36 w-36 object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.38)] sm:h-44 sm:w-44"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
              Unit Designation
            </p>
            <p className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-white">
              Fireteam Epsilon
            </p>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.3em] text-cyan-200">
              FIVE, FORWARD.
            </p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-slate-400">
              Five candidates. One permanent operational identity. Every
              member advances; no member is left behind.
            </p>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5">
          <p className="text-2xl font-black uppercase tracking-tight text-white">
            Your Fireteam
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {teammates.map((member) => (
              <div
                key={member.id}
                className="overflow-hidden border border-cyan-900/70 bg-black/50"
              >
                <div className="relative aspect-[2/3]">
                  <Image
                    src={member.dossierPath}
                    alt={`${member.name} dossier portrait`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 45vw, 180px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-white">
                      {member.name}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-cyan-300">
                      {member.affinity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
              Personnel Command Order
            </p>
            <p className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-white">
              ALEX-225
            </p>
            <p className="mt-2 text-lg font-bold uppercase tracking-[0.16em] text-cyan-100">
              Assigned — Fireteam Epsilon
            </p>
            <p className="mt-4 max-w-2xl text-xs leading-6 text-slate-300">
              Effective upon acceptance of these orders, your status advances
              from Individual to Fireteam Member. This roster is permanent and
              will serve as the foundation of all Phase II operations.
            </p>
          </div>
          <Image
            src={initialStatus.fireteam.patchPath}
            alt="Fireteam Epsilon assignment insignia"
            width={140}
            height={140}
            className="hidden h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.35)] sm:block"
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
            Phase II Orders
          </p>
          <p className="mt-2 text-3xl font-black uppercase tracking-tight text-white">
            Fireteam Operations
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <CeremonyMetric label="Unit" value="Epsilon" />
            <CeremonyMetric label="Strength" value="5 Candidates" />
            <CeremonyMetric label="Status" value="Ready" />
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-6 text-slate-300">
            Report with Michael, Paige, Ellie, and Zoe for Phase II Fireteam
            Operations. Your readiness now contributes to a shared operational
            identity. Move as five. Move forward.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-900/60 pt-4">
        {isReplay ? (
          <button
            type="button"
            onClick={() =>
              step === 0
                ? setReplayStep(null)
                : setReplayStep(step - 1)
            }
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition hover:text-white"
          >
            {step === 0 ? "Exit Replay" : "Previous"}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Progress saved after each presentation
          </span>
        )}

        {step < FIRETEAM_ASSIGNMENT_MAX_STEP ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              isReplay
                ? setReplayStep(step + 1)
                : mutate("progress", step + 1)
            }
            className="border border-cyan-400/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? "Recording…" : "Continue"}
          </button>
        ) : isReplay ? (
          <button
            type="button"
            onClick={() => setReplayStep(null)}
            className="border border-cyan-400/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 transition hover:bg-cyan-400/10"
          >
            Close Record
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => mutate("complete")}
            className="border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? "Finalizing Assignment…" : "Accept Assignment"}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CeremonyMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-l border-cyan-500/50 bg-black/30 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
        {value}
      </p>
    </div>
  );
}
