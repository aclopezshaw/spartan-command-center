import { SpartanEvent } from "@/data/events";

export function EventOverlay({
  event,
  onComplete,
}: {
  event: SpartanEvent;
  onComplete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="max-w-xl border border-red-700 bg-slate-950/95 p-8 text-center shadow-2xl shadow-red-950/40">
        <p className="text-xs uppercase tracking-[0.35em] text-red-500">
          {event.type} In Progress
        </p>

        <p className="mt-6 text-sm uppercase tracking-[0.25em] text-slate-400">
          Report to {event.location} for:
        </p>

        <h2 className="mt-3 text-3xl font-black uppercase text-slate-100">
          {event.title}
        </h2>

        <p className="mt-6 text-lg text-slate-300">{event.prompt}</p>

        <button
          onClick={onComplete}
          className="mt-8 border border-red-500 bg-red-950/60 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-red-100 hover:bg-red-800/70"
        >
          {event.buttonText}
        </button>
      </div>
    </div>
  );
}