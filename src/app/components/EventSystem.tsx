"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { areAllCampaignEventsComplete, getActiveEvent, getNextEvent } from "@/lib/events";
import { getEventReadinessCopy } from "@/lib/event-readiness";
import { getCampaignPhaseDisplayName } from "@/lib/campaign";
import { CampaignEvent } from "@/data/events";
import type { CeremonialEvent } from "@/lib/ceremonial-events";
import HudPanel from "../components/HudPanel";
import { NextEventPanel } from "../components/NextEventPanel";

type CompletionResponse = {
  ok?: boolean;
  error?: string;
  unmetRequirements?: string[];
};

export function EventSystem({
  children,
  ceremonialEvent = null,
}: {
  children: ReactNode;
  ceremonialEvent?: CeremonialEvent | null;
}) {
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
  } else if (ceremonialEvent) {
    eventPanel = (
      <HudPanel
        title="Campaign Event"
        titleClassName="text-amber-300 tracking-[0.3em]"
        className="border-amber-400/50 bg-black/35 shadow-[0_0_22px_rgba(251,191,36,0.16)]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
          {ceremonialEvent.orderLabel}
        </p>
        <p className="mt-3 text-sm font-black uppercase leading-tight text-white">
          {ceremonialEvent.title}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-300">
          Report to {ceremonialEvent.destination}.
        </p>

        <div className="mt-3 flex items-center justify-between border-y border-amber-500/20 py-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
          <span>XP 0</span>
          <span>Readiness 0</span>
          <span>History on Completion</span>
        </div>

        <Link
          href={ceremonialEvent.href}
          className="mt-3 block border border-amber-300/70 bg-amber-300/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-300/20"
        >
          Report to Assembly Hall
        </Link>
      </HudPanel>
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
