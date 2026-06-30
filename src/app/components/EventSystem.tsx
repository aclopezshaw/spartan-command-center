"use client";

import { useEffect, useState } from "react";
import { getActiveEvent, getNextEvent } from "@/lib/events";
import { EventOverlay } from "../components/EventOverlay";
import { NextEventPanel } from "../components/NextEventPanel";

const STORAGE_KEY = "spartan-completed-events";

export function EventSystem({ campaignDay }: { campaignDay: number }) {
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

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
        xpReward: event.xpReward ?? (event.type === "Major Event" ? 500 : 250),
        description: event.prompt,
      }),
    });

    if (!response.ok) {
      console.error("Failed to complete event");
      return;
    }

    setCompletedEventIds((prev) =>
      prev.includes(eventId) ? prev : [...prev, eventId]
    );
  }

  return (
    <>
      {!activeEvent && nextEvent && (
        <NextEventPanel event={nextEvent} campaignDay={campaignDay} />
      )}

      {activeEvent && (
        <EventOverlay
          event={activeEvent}
          onComplete={() => completeEvent(activeEvent.id)}
        />
      )}
    </>
  );
}