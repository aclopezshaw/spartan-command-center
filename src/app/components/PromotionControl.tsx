"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PromotionStatus,
  PromotionTransitionResult,
} from "@/lib/notion";

export default function PromotionControl({
  initialStatus,
}: {
  initialStatus: PromotionStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<PromotionTransitionResult["transition"] | null>(null);

  async function acceptPromotion() {
    const fromRank =
      status.state === "finalizing"
        ? status.pendingTransition?.fromRank
        : status.currentRank;
    const toRank =
      status.state === "finalizing"
        ? status.pendingTransition?.toRank
        : status.targetRank;

    if (!fromRank || !toRank) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/progression/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedCurrentRankPageId: fromRank.pageId,
          expectedTargetRankPageId: toRank.pageId,
        }),
      });
      const payload = (await response.json()) as
        | PromotionTransitionResult
        | (PromotionStatus & { error?: string });

      if (!response.ok) {
        if ("state" in payload) {
          setStatus(payload);
        }
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Promotion transition did not verify."
        );
      }

      const completed = payload as PromotionTransitionResult;
      setStatus(completed);
      setResult(completed.transition);
      router.refresh();
    } catch (promotionError) {
      setError(
        promotionError instanceof Error
          ? promotionError.message
          : "Promotion transition did not verify."
      );
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="mt-5 border-l-2 border-cyan-300 bg-cyan-950/35 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
          Promotion Verified
        </p>
        <p className="mt-2 text-sm font-black uppercase text-white">
          {result.fromRank.name} → {result.toRank.name}
        </p>
      </div>
    );
  }

  if (
    status.state !== "eligible" &&
    status.state !== "finalizing"
  ) {
    return null;
  }

  const isRecovery = status.state === "finalizing";
  const orderTarget = isRecovery
    ? status.pendingTransition?.toRank.name
    : status.targetRank?.name;

  return (
    <div className="mt-5 border border-amber-500/50 bg-amber-950/25 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
        {isRecovery
          ? "Promotion Record Recovery"
          : "Promotion Order Authorized"}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-300">
        {isRecovery
          ? "The rank transition is durable. Personnel Command must reconcile the one-time Service History record for "
          : "Personnel Command has verified the XP threshold for "}
        <span className="font-bold text-white">
          {orderTarget}
        </span>
        . This ceremony awards no XP, readiness, or standings points.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={acceptPromotion}
        className="mt-4 border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-200 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-50"
      >
        {pending
          ? "Verifying Promotion…"
          : isRecovery
            ? "Reconcile Promotion Record"
            : "Accept Promotion"}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
