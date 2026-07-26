"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CampaignRolloverStatus } from "@/lib/notion";

const CONFIRMATION_PHRASE = "CONFIRM ROLLOVER";

function stateLabel(state: CampaignRolloverStatus["state"]) {
  switch (state) {
    case "ready":
      return "Ready to Execute";
    case "recovery":
      return "Recovery Required";
    case "complete":
      return "Transition Verified";
    default:
      return "Awaiting Boundary";
  }
}

function stateColor(state: CampaignRolloverStatus["state"]) {
  switch (state) {
    case "ready":
      return "text-amber-200";
    case "recovery":
      return "text-red-300";
    case "complete":
      return "text-cyan-200";
    default:
      return "text-slate-400";
  }
}

export default function CampaignRolloverControl({
  initialStatus,
}: {
  initialStatus: CampaignRolloverStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState<"inspect" | "execute" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canExecute =
    (status.state === "ready" || status.state === "recovery") &&
    status.eligible;

  async function inspect() {
    setPending("inspect");
    setError(null);

    try {
      const response = await fetch("/api/campaign/rollover", {
        cache: "no-store",
      });
      const payload = (await response.json()) as CampaignRolloverStatus & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to inspect transition state.");
      }

      setStatus(payload);
    } catch (inspectionError) {
      setError(
        inspectionError instanceof Error
          ? inspectionError.message
          : "Unable to inspect transition state."
      );
    } finally {
      setPending(null);
    }
  }

  async function execute() {
    if (confirmation !== CONFIRMATION_PHRASE) {
      return;
    }

    setPending("execute");
    setError(null);

    try {
      const response = await fetch("/api/campaign/rollover", {
        method: "POST",
      });
      const payload = (await response.json()) as CampaignRolloverStatus & {
        error?: string;
      };

      if (!response.ok) {
        if (payload.state) {
          setStatus(payload);
        }
        throw new Error(
          payload.error ?? "Campaign transition did not verify."
        );
      }

      setStatus(payload);
      setConfirmation("");
      router.refresh();
    } catch (executionError) {
      setError(
        executionError instanceof Error
          ? executionError.message
          : "Campaign transition did not verify."
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="border border-cyan-900/60 bg-black/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
            Campaign Transition Control
          </p>
          <p
            className={`mt-2 text-sm font-black uppercase tracking-[0.14em] ${stateColor(
              status.state
            )}`}
          >
            {stateLabel(status.state)}
          </p>
        </div>

        <button
          type="button"
          disabled={pending !== null}
          onClick={inspect}
          className="border border-cyan-700/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-wait disabled:opacity-50"
        >
          {pending === "inspect" ? "Inspecting…" : "Refresh Status"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <TransitionDatum
          label="Operational Date"
          value={status.operationalDate}
        />
        <TransitionDatum
          label="Outgoing Phase"
          value={status.transition?.source.phaseName ?? "Not due"}
        />
        <TransitionDatum
          label="Incoming Phase"
          value={status.transition?.target.phaseName ?? "Not due"}
        />
      </div>

      {status.phaseXp ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <TransitionDatum
            label="Earned XP"
            value={status.phaseXp.earnedXp.toLocaleString()}
          />
          <TransitionDatum
            label="Maximum XP"
            value={status.phaseXp.maxPhaseXp.toLocaleString()}
          />
          <TransitionDatum
            label="Projected Medal"
            value={status.phaseXp.projectedMedalPace.replace(" Pace", "")}
          />
        </div>
      ) : null}

      {status.state === "complete" ? (
        <p className="mt-5 border-l-2 border-cyan-400/70 bg-cyan-950/20 px-4 py-3 text-xs leading-5 text-cyan-100">
          The outgoing record is frozen, the next phase is active, and the
          durable transition has been verified.
        </p>
      ) : null}

      {status.reasons.length > 0 ? (
        <div className="mt-5 border-l-2 border-slate-700 bg-slate-950/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Current Hold
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
            {status.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {canExecute ? (
        <div className="mt-5 border border-amber-600/50 bg-amber-950/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-amber-300">
            Irreversible Campaign Record
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            This freezes the outgoing XP and medal result, records phase
            completion, and activates the incoming phase. Type{" "}
            <span className="font-bold text-amber-100">
              {CONFIRMATION_PHRASE}
            </span>{" "}
            to authorize the transition.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="Campaign rollover confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={pending !== null}
              placeholder={CONFIRMATION_PHRASE}
              className="min-w-0 flex-1 border border-amber-700/60 bg-black/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white outline-none transition placeholder:text-slate-700 focus:border-amber-300 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={
                pending !== null || confirmation !== CONFIRMATION_PHRASE
              }
              onClick={execute}
              className="border border-amber-300/80 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending === "execute"
                ? "Verifying Transition…"
                : status.state === "recovery"
                  ? "Recover Transition"
                  : "Execute Transition"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-xs leading-5 text-red-300" role="alert">
          {error} Refresh the transition status before retrying.
        </p>
      ) : null}
    </section>
  );
}

function TransitionDatum({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-l border-cyan-800/50 pl-3">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-200">{value}</p>
    </div>
  );
}
