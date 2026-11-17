"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BattalionRankingsControls({ finalize = false }: { finalize?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function reconcile() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/command/rankings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reconcile" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to update standings");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to update standings"); }
    finally { setSaving(false); }
  }
  return <div>
    <button onClick={reconcile} disabled={saving} className="border border-blue-500/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 transition hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 disabled:opacity-50">{saving ? "Verifying…" : finalize ? "Record final placement" : "Refresh verified standings"}</button>
    {error ? <p role="alert" className="mt-3 text-xs leading-6 text-amber-300">{error}</p> : null}
  </div>;
}
