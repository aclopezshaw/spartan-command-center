"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BattalionCohesionControls() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function recover() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/command/cohesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reconcile" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to recover event review");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to recover event review"); }
    finally { setSaving(false); }
  }
  return <div className="mt-4">
    <button disabled={saving} onClick={recover} className="border border-amber-400/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-300/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 disabled:opacity-50">{saving ? "Recovering…" : "Recover saved event review"}</button>
    {error ? <p role="alert" className="mt-3 text-xs text-amber-300">{error}</p> : null}
  </div>;
}
