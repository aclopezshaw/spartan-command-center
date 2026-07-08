import { SpartanEvent } from "@/data/events";
import HudPanel from "../components/HudPanel";

export function NextEventPanel({
  event,
  campaignDay,
  isActive = false,
  onReview,
}: {
  event: SpartanEvent;
  campaignDay: number;
  isActive?: boolean;
  onReview?: () => void;
}) {
  const daysRemaining = event.unlockDay - campaignDay;
  const isToday = daysRemaining <= 0;

  return (
    <HudPanel title="Next Event" titleClassName="text-cyan-300 tracking-[0.4em]">
      <div className="space-y-3">
        <p className="text-med font-bold uppercase text-slate-100 leading-tight">
          {event.title}
        </p>

        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {event.type} Campaign Day {event.unlockDay}
        </p>

        <p className="text-center text-cyan-300 text-med font-semibold">
          {daysRemaining} Day{daysRemaining !== 1 ? "s" : ""} Remaining
        </p>

        <p className="text-xs text-slate-400">
          Report to {event.location} immediately.
        </p>
        {isActive && (
          <button
            onClick={onReview}
            className="w-full border border-cyan-400 bg-cyan-500/10 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300 hover:bg-cyan-500/20"
          >
            {event.buttonText}
          </button>
        )}
      </div>
    </HudPanel>
  );
}