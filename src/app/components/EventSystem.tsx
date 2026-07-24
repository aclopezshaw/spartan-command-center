"use client";

import { type ReactNode, useEffect, useState } from "react";
import { areAllCampaignEventsComplete, getActiveEvent, getNextEvent } from "@/lib/events";
import { getEventReadinessCopy } from "@/lib/event-readiness";
import { getCampaignPhaseDisplayName } from "@/lib/campaign";
import { CampaignEvent } from "@/data/events";
import HudPanel from "../components/HudPanel";
import { NextEventPanel } from "../components/NextEventPanel";

type CompletionResponse = {
  ok?: boolean;
  error?: string;
  unmetRequirements?: string[];
};

export function EventSystem({ children }: { children: ReactNode }) {
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [campaignDay, setCampaignDay] = useState<number | null>(null);
  const [phaseName, setPhaseName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewingEventId, setReviewingEventId] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const activeCampaignDay = campaignDay ?? 0;

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/events/status", { cache: "no-store" });
        const body = (await response.json()) as {
          completedEventIds?: string[];
          campaignDay?: number | null;
          phase?: { name?: string | null } | null;
          events?: CampaignEvent[];
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Unable to load event status");
        if (active) {
          setCompletedEventIds(body.completedEventIds ?? []);
          setEvents(body.events ?? []);
          setCampaignDay(body.campaignDay ?? null);
          setPhaseName(body.phase?.name ?? null);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load event status"
          );
        }
      } finally {
        if (active) setLoaded(true);
      }
    }

    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const activeEvent = loaded && !loadError && campaignDay !== null
    ? getActiveEvent(activeCampaignDay, completedEventIds, events)
    : undefined;
  const nextEvent = loaded && !loadError && campaignDay !== null
    ? getNextEvent(activeCampaignDay, completedEventIds, events)
    : undefined;
  const phaseComplete =
    loaded && !loadError && areAllCampaignEventsComplete(completedEventIds, events);

  async function completeEvent() {
    if (!activeEvent || isSaving) return;

    setCompletionError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/complete-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEvent.id }),
      });
      const body = (await response.json()) as CompletionResponse;

      if (!response.ok || !body.ok) {
        const details = body.unmetRequirements?.join(". ");
        throw new Error(details || body.error || "Unable to save event completion");
      }

      setCompletedEventIds((previous) =>
        previous.includes(activeEvent.id) ? previous : [...previous, activeEvent.id]
      );
      setReviewingEventId(null);
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : "Unable to save event completion. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  let eventPanel: ReactNode = null;

  if (loaded && loadError) {
    eventPanel = (
      <HudPanel title="Event Status" titleClassName="text-amber-300 tracking-[0.4em]">
        <p className="text-xs text-amber-200">{loadError}. Refresh to try again.</p>
      </HudPanel>
    );
  } else if (activeEvent) {
    eventPanel = (
      <NextEventPanel
        event={activeEvent}
        campaignDay={activeCampaignDay}
        isActive
        onReview={() => {
          setCompletionError(null);
          setReviewingEventId(activeEvent.id);
        }}
      />
    );
  } else if (nextEvent) {
    eventPanel = (
      <NextEventPanel event={nextEvent} campaignDay={activeCampaignDay} />
    );
  } else if (phaseComplete) {
    eventPanel = (
      <HudPanel title="Campaign Events" titleClassName="text-emerald-300 tracking-[0.3em]">
        <p className="text-sm font-bold uppercase leading-tight text-emerald-200">
          All Events Complete for This Phase
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {getCampaignPhaseDisplayName(phaseName)} transition awaits its separate
          operational criteria.
        </p>
      </HudPanel>
    );
  }

  return (
    <>
      {activeEvent?.backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${activeEvent.backgroundImage})` }}
        />
      )}

      {activeEvent && reviewingEventId === activeEvent.id && (
        <div className="absolute left-1/2 top-1/2 z-30 w-[420px] -translate-x-1/2 -translate-y-1/2 border border-cyan-400 bg-black/90 p-6 text-xs text-slate-200 shadow-[0_0_35px_rgba(34,211,238,0.45)]">
          <p className="font-bold uppercase tracking-[0.25em] text-cyan-300">Event Review</p>
          <p className="mt-3 text-lg font-bold uppercase text-slate-100">{activeEvent.title}</p>
          <p className="mt-3 font-bold text-slate-100">Requirement: {getEventReadinessCopy(activeEvent)}</p>
          <p className="mt-2 text-slate-400">Completion is confirmed only after the operational record saves.</p>
          {completionError && (
            <p className="mt-3 border border-amber-400/50 bg-amber-500/10 p-2 text-amber-200">
              {completionError}
            </p>
          )}
          <button
            onClick={completeEvent}
            disabled={isSaving}
            className="mt-4 w-full border border-emerald-400 bg-emerald-500/10 py-2 font-bold uppercase tracking-[0.2em] text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving Event…" : "Mark Event Complete"}
          </button>
        </div>
      )}

      <div className="absolute right-8 top-32 z-20 flex w-[220px] flex-col gap-6">
        {eventPanel}
        {children}
      </div>
    </>
  );
}
