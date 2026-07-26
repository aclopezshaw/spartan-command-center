import { SpartanEvent } from "@/data/events";
import {
  formatRetryCountdown,
  type EventOutcomeState,
} from "@/lib/event-outcome";
import HudPanel from "../components/HudPanel";

export function NextEventPanel({
  event,
  campaignDay,
  isActive = false,
  onReview,
  outcomeState,
  retryAvailableDay,
}: {
  event: SpartanEvent;
  campaignDay: number;
  isActive?: boolean;
  onReview?: () => void;
  outcomeState?: EventOutcomeState;
  retryAvailableDay?: number | null;
}) {
  const daysRemaining = event.unlockDay - campaignDay;
  const state =
    outcomeState ??
    (isActive || daysRemaining <= 0 ? "active" : "upcoming");
  const isAvailable = ["active", "missed", "retry-ready"].includes(
    state
  );
  const countdownMessage =
    state === "cooldown"
      ? formatRetryCountdown(retryAvailableDay, campaignDay)
      : state === "retry-ready"
        ? "Retry Authorized"
        : state === "failed-terminal"
          ? "Event Failed — No Retry Available"
        : state === "missed"
          ? "Past Due — Review Required"
          : isAvailable
            ? "Available Today"
            : `${Math.max(1, daysRemaining)} Day${daysRemaining === 1 ? "" : "s"} Remaining`;
  const failedReview = ["cooldown", "retry-ready", "failed-terminal"].includes(
    state
  );
  const panelTitle = isActive ? "Campaign Event" : "Next Event";
  const actionLabel =
    state === "retry-ready"
      ? "Retry Event"
      : state === "missed"
        ? "Review Event"
        : event.buttonText;

  return (
    <HudPanel
      title={panelTitle}
      titleClassName={
        failedReview
          ? "text-amber-300 tracking-[0.3em]"
          : "text-cyan-300 tracking-[0.4em]"
      }
      className={
        failedReview
          ? "border-amber-500/50 shadow-[0_0_18px_rgba(245,158,11,0.12)]"
          : ""
      }
    >
      <div className="space-y-3">
        {failedReview && (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">
            Failed Readiness Review
          </p>
        )}
        <p className="text-med font-bold uppercase text-slate-100 leading-tight">
          {event.title}
        </p>

        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {event.type} Campaign Day {event.unlockDay}
        </p>

        <p
          aria-live="polite"
          className={`text-center text-med font-semibold ${
            failedReview ? "text-amber-200" : "text-cyan-300"
          }`}
        >
          {countdownMessage}
        </p>

        <p className="text-xs text-slate-400">
          {state === "cooldown"
            ? "Readiness review remains incomplete. Improve readiness and return on the authorized campaign day."
            : state === "failed-terminal"
              ? "This phase has no remaining event day. The failed result is final."
            : `Report to ${event.location} ${isAvailable ? "immediately" : "when available"}.`}
        </p>
        {isActive && (
          <button
            onClick={onReview}
            disabled={!isAvailable}
            className="w-full border border-cyan-400 bg-cyan-500/10 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300 hover:bg-cyan-500/20"
          >
            {state === "cooldown"
              ? "Retry Locked"
              : state === "failed-terminal"
                ? "Final Result Recorded"
                : actionLabel}
          </button>
        )}
      </div>
    </HudPanel>
  );
}
