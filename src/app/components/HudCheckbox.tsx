"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveHudCheckbox } from "@/lib/hud-checkbox";

export default function HudCheckbox({
  label,
  xp,
  propertyName,
  checked,
  apiPath = "/api/sitrep-checkbox",
  pageId,
}: {
  label: string;
  xp: number;
  propertyName: string;
  checked: boolean;
  apiPath?: string;
  pageId?: string;
}) {
  const router = useRouter();
  const [optimisticState, setOptimisticState] = useState<{
    sourceChecked: boolean;
    value: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isChecked =
    optimisticState?.sourceChecked === checked
      ? optimisticState.value
      : checked;

  async function toggle() {
    const nextChecked = !isChecked;
    setOptimisticState({
      sourceChecked: checked,
      value: nextChecked,
    });
    setIsSaving(true);
    setSaveError(null);

    const result = await saveHudCheckbox({
      apiPath,
      payload: {
        pageId,
        propertyName,
        checked: nextChecked,
      },
    });

    setIsSaving(false);

    if (!result.ok) {
      setOptimisticState(null);
      setSaveError(`${result.error} Previous value restored; try again.`);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={isSaving}
        aria-pressed={isChecked}
        className="flex w-full items-center justify-between border-b border-cyan-900/60 py-1 text-xs disabled:cursor-wait disabled:opacity-70"
      >
        <div className="flex items-center gap-2">
          <div
            className={`h-3.5 w-3.5 border ${
              isChecked
                ? "border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                : "border-cyan-500/70 bg-black/40"
            }`}
          />
          <span
            className={
              isChecked
                ? "text-cyan-100 line-through"
                : "text-slate-300"
            }
          >
            {label}
          </span>
        </div>

        <span className="text-cyan-300">
          {isSaving ? "Saving..." : `+${xp} XP`}
        </span>
      </button>

      {saveError && (
        <p
          role="alert"
          className="border-b border-red-950/70 py-2 text-[10px] leading-4 text-red-300"
        >
          {saveError}
        </p>
      )}
    </div>
  );
}
