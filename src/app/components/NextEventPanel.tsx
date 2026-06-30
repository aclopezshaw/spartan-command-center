import { SpartanEvent } from "@/data/events";
import HudPanel from "../components/HudPanel";

export function NextEventPanel({
  event,
  campaignDay,
}: {
  event: SpartanEvent;
  campaignDay: number;
}) {
  const daysRemaining = event.unlockDay - campaignDay;

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
          Report to {event.location} when available.
        </p>
      </div>
    </HudPanel>
  );
}