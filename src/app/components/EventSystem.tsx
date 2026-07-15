"use client";

import { useEffect, useState } from "react";
import { getActiveEvent, getNextEvent } from "@/lib/events";
import { EventOverlay } from "../components/EventOverlay";
import { NextEventPanel } from "../components/NextEventPanel";

const STORAGE_KEY = "spartan-completed-events";

export function EventSystem({ campaignDay }: { campaignDay: number }) {
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reviewingEventId, setReviewingEventId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setCompletedEventIds(JSON.parse(saved));
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedEventIds));
  }, [completedEventIds, loaded]);

  const activeEvent = loaded
    ? getActiveEvent(campaignDay, completedEventIds)
    : undefined;

  const nextEvent = loaded
    ? getNextEvent(campaignDay, completedEventIds)
    : undefined;

  async function completeEvent(eventId: string) {
    const event = activeEvent;

    if (!event) return;

    setCompletedEventIds((prev) =>
      prev.includes(eventId) ? prev : [...prev, eventId]
    );
    setReviewingEventId(null);

    try {
      const response = await fetch("/api/complete-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          campaignDay,
          xpReward:
            event.xpReward ?? (event.type === "Major Event" ? 500 : 250),
          description: event.prompt,
        }),
      });

      if (!response.ok) {
        console.error(
          "Event completed locally, but backend synchronization failed"
        );
      }
    } catch (error) {
      console.error(
        "Event completed locally, but backend synchronization failed",
        error
      );
    }
  }

  return (
    <>
      {activeEvent?.backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${activeEvent.backgroundImage})` }}
        />
      )}

      {activeEvent && (
        <div className="absolute right-8 top-32 z-20 w-[220px]">
          <NextEventPanel
            event={activeEvent}
            campaignDay={campaignDay}
            isActive
            onReview={() => setReviewingEventId(activeEvent.id)}
          />
        </div>
      )}

      {activeEvent && reviewingEventId === activeEvent.id && (
        <div className="absolute left-1/2 top-1/2 z-30 w-[420px] -translate-x-1/2 -translate-y-1/2 border border-cyan-400 bg-black/90 p-6 text-xs text-slate-200 shadow-[0_0_35px_rgba(34,211,238,0.45)]">
          <p className="font-bold uppercase tracking-[0.25em] text-cyan-300">
            Event Review
          </p>

          <p className="mt-3 text-lg font-bold uppercase text-slate-100">
            {activeEvent.title}
          </p>

          <p className="mt-3 font-bold text-slate-100">
            Requirement: Physical Readiness ≥ 1
          </p>

          <p className="mt-2 text-slate-400">
            Confirm Physical Readiness status in Service Record.
          </p>

          <button
            onClick={() => completeEvent(activeEvent.id)}
            className="mt-4 w-full border border-emerald-400 bg-emerald-500/10 py-2 font-bold uppercase tracking-[0.2em] text-emerald-300 hover:bg-emerald-500/20"
          >
            Mark Event Complete
          </button>
        </div>
      )}

      {!activeEvent && nextEvent && (
        <div className="absolute right-8 top-32 z-20 w-[220px]">
          <NextEventPanel event={nextEvent} campaignDay={campaignDay} />
        </div>
      )}
    </>
  );
}
