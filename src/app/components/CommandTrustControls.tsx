"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function CommandTrustControls({ days }: { days: { date: string; review: string; canReview: boolean }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save(body: object) {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/command/trust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update Trust");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update Trust"); }
    finally { setSaving(false); }
  }
  return <section className="mt-6 space-y-4 border border-cyan-900 p-4">
    <button disabled={saving} onClick={() => save({ action: "reconcile" })} className="border border-cyan-600 px-4 py-2 text-xs text-cyan-200 disabled:opacity-50">{saving ? "Saving…" : "Refresh Trust from habit records"}</button>
    <p className="text-xs leading-5 text-slate-400">Confirm a finished day only when its habits are accurate. Confirmed zero-completion days can count toward neglect. Excused days earn no daily Trust and break neglect. Pending days protect against missing-data penalties.</p>
    {days.filter(day => day.canReview).slice().reverse().map(day => <div key={day.date} className="flex flex-wrap items-center gap-3 border-t border-slate-800 py-2 text-xs">
      <span>{day.date} · {day.review}</span>
      {(["Confirmed", "Excused", "Pending"] as const).map(review => <button key={review} disabled={saving || day.review === review} onClick={() => save({ action: "review", date: day.date, review })} className="border border-slate-700 px-2 py-2 disabled:opacity-40">{review === "Confirmed" ? "Confirm day" : review === "Excused" ? "Excuse day" : "Reopen day"}</button>)}
    </div>)}
    {error ? <p role="alert" className="text-xs text-amber-300">{error}</p> : null}
  </section>;
}
