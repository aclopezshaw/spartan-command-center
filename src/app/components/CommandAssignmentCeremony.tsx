"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMMAND_ASSIGNMENT_MAX_STEP } from "@/lib/command-assignment";
import type { CommandAssignmentStatus } from "@/lib/notion";

type CeremonyAction = "begin" | "progress" | "complete";

export default function CommandAssignmentCeremony({
  initialStatus,
  initialReplay = false,
  replayHref,
}: {
  initialStatus: CommandAssignmentStatus;
  initialReplay?: boolean;
  replayHref?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replayStep, setReplayStep] = useState<number | null>(
    initialReplay ? 0 : null
  );
  const [liveStep, setLiveStep] = useState(initialStatus.persisted.step);
  const isReplay = replayStep !== null;
  const step = replayStep ?? liveStep;

  function exitReplay() {
    setReplayStep(null);
    if (initialReplay) {
      router.replace("/assembly-hall", { scroll: false });
    }
  }

  async function mutate(action: CeremonyAction, nextStep?: number) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/progression/command-assignment",
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

      if (action === "progress" && nextStep !== undefined) {
        setLiveStep(nextStep);
      } else {
        router.refresh();
      }
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
      <CeremonyNotice
        tone="slate"
        title="Command Orders Locked"
        body={
          initialStatus.eligibility.reasons.join(" ") ||
          "Phase II completion evidence is still being verified."
        }
      />
    );
  }

  if (initialStatus.state === "conflict") {
    return (
      <CeremonyNotice
        tone="red"
        title="Command Record Conflict"
        body={initialStatus.reasons.join(" ")}
      />
    );
  }

  if (initialStatus.state === "available") {
    return (
      <div className="mt-5 border border-amber-500/60 bg-amber-950/25 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
          Command Orders Authenticated
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Phase II is complete and Phase III remains staged. Begin the
          recoverable ceremony to review Athena Training Battalion command
          assignments. This does not activate Phase III.
        </p>
        <ActionButton
          pending={pending}
          label="Begin Command Ceremony"
          pendingLabel="Opening Ceremony…"
          onClick={() => mutate("begin")}
        />
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (initialStatus.state === "finalizing") {
    return (
      <div className="mt-5 border border-amber-500/60 bg-amber-950/25 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
          Command Record Recovery Required
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Personnel Command will reconcile the canonical identity, exact
          Service History record, Trust unlock, and completion marker.
        </p>
        <ActionButton
          pending={pending}
          label="Recover Command Record"
          pendingLabel="Reconciling…"
          onClick={() => mutate("complete")}
        />
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (initialStatus.state === "completed" && !isReplay) {
    return (
      <div className="mt-5 border border-cyan-600/50 bg-cyan-950/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
          Permanent Command Assignment Recorded
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image
            src={initialStatus.command.patchPath}
            alt="Athena Command patch"
            width={112}
            height={112}
            className="h-28 w-28 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]"
          />
          <div>
            <p className="text-xl font-black uppercase tracking-[0.12em] text-white">
              {initialStatus.command.battalion.name}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              ALEX-225 · Battalion Commander
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-400">
              Assigned {initialStatus.persisted.assignedAt}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            replayHref ? router.push(replayHref) : setReplayStep(0)
          }
          className="mt-4 border border-cyan-500/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:bg-cyan-400/10"
        >
          Replay Ceremony
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 border border-cyan-500/60 bg-slate-950/85 p-4 shadow-[0_0_28px_rgba(8,145,178,0.14)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-300">
            {isReplay ? "Command Record Replay" : "Ceremony In Progress"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Presentation {step + 1} / {COMMAND_ASSIGNMENT_MAX_STEP + 1}
          </p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: COMMAND_ASSIGNMENT_MAX_STEP + 1 }).map(
            (_, index) => (
              <span
                key={index}
                className={`h-1.5 w-5 ${
                  index <= step ? "bg-cyan-300" : "bg-slate-700"
                }`}
              />
            )
          )}
        </div>
      </div>

      <div className="mt-5 min-h-56">
        {step === 0 ? (
          <CeremonyPanel
            eyebrow="Phase II Record"
            title="Fireteam Operations Complete"
            body="ALEX-225 and Fireteam Epsilon have reached the Phase II completion boundary. The staged Phase III record remains Upcoming and inactive."
          />
        ) : null}
        {step === 1 ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Image
              src={initialStatus.command.patchPath}
              alt="Athena Command patch"
              width={180}
              height={180}
              className="h-40 w-40 object-contain drop-shadow-[0_0_26px_rgba(34,211,238,0.4)]"
            />
            <CeremonyPanel
              eyebrow="Command Identity"
              title={initialStatus.command.name}
              body={`${initialStatus.command.motto} Athena Command is the permanent command identity for the Phase III leadership cadre.`}
            />
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <CeremonyPanel
              eyebrow="Unit Activation Orders"
              title={initialStatus.command.battalion.name}
              body="The Fireteam Epsilon roster remains intact while each member assumes a defined command responsibility."
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {initialStatus.command.assignments.map((assignment) => (
                <div
                  key={assignment.memberId}
                  className="border border-cyan-900/70 bg-black/40 p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                    {assignment.designation}
                  </p>
                  <p className="mt-2 text-[10px] uppercase leading-5 tracking-[0.12em] text-slate-300">
                    {assignment.role}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">
                    {assignment.companyName ?? "Battalion Command"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <CeremonyPanel
            eyebrow="Personnel Command Order"
            title="ALEX-225 · Battalion Commander"
            body="Effective upon acceptance, ALEX-225 assumes command of Athena Training Battalion. Michael, Paige, Ellie, and Zoe assume command of Alpha, Bravo, Charlie, and Delta Companies."
          />
        ) : null}
        {step === 4 ? (
          <CeremonyPanel
            eyebrow="Command School Status"
            title="Trust Authority Unlocked"
            body="Acceptance records the Command School progression stage and unlocks the durable Command Trust authority. Trust scoring and later leadership systems remain separate future work."
          />
        ) : null}
        {step === 5 ? (
          <CeremonyPanel
            eyebrow="Acceptance of Command"
            title="Wisdom Under Fire"
            body="Accepting these orders creates one permanent zero-XP Assignment history record. It does not set the Phase III start date or activate the campaign."
          />
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-900/60 pt-4">
        {isReplay ? (
          <button
            type="button"
            onClick={() =>
              step === 0 ? exitReplay() : setReplayStep(step - 1)
            }
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white"
          >
            {step === 0 ? "Exit Replay" : "Previous"}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Progress saved after each presentation
          </span>
        )}

        {step < COMMAND_ASSIGNMENT_MAX_STEP ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              isReplay
                ? setReplayStep(step + 1)
                : mutate("progress", step + 1)
            }
            className="border border-cyan-400/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-50"
          >
            {pending ? "Recording…" : "Continue"}
          </button>
        ) : isReplay ? (
          <button
            type="button"
            onClick={exitReplay}
            className="border border-cyan-400/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100"
          >
            Close Record
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => mutate("complete")}
            className="border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 hover:bg-amber-300/20 disabled:opacity-50"
          >
            {pending ? "Finalizing Command…" : "Accept Command"}
          </button>
        )}
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

function CeremonyPanel({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
        {eyebrow}
      </p>
      <p className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
        {title}
      </p>
      <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-300">
        {body}
      </p>
    </div>
  );
}

function CeremonyNotice({
  tone,
  title,
  body,
}: {
  tone: "slate" | "red";
  title: string;
  body: string;
}) {
  return (
    <div
      className={`mt-5 border p-4 ${
        tone === "red"
          ? "border-red-700/70 bg-red-950/40"
          : "border-slate-700 bg-black/35"
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
          tone === "red" ? "text-red-300" : "text-slate-400"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-300">{body}</p>
    </div>
  );
}

function ActionButton({
  pending,
  label,
  pendingLabel,
  onClick,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="mt-4 border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  return error ? (
    <p className="mt-3 text-xs text-red-300" role="alert">
      {error}
    </p>
  ) : null;
}
