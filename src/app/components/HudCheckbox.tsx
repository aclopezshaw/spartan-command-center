"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [isChecked, setIsChecked] = useState(checked);
  const [isSaving, setIsSaving] = useState(false);

  async function toggle() {
    const nextChecked = !isChecked;
    setIsChecked(nextChecked);
    setIsSaving(true);

    await fetch(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pageId,
        propertyName,
        checked: nextChecked,
      }),
    });

    setIsSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={isSaving}
      className="flex w-full items-center justify-between border-b border-cyan-900/60 py-1 text-xs"
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-3.5 w-3.5 border ${
            isChecked
              ? "border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              : "border-cyan-500/70 bg-black/40"
          }`}
        />
        <span className={isChecked ? "text-cyan-100 line-through" : "text-slate-300"}>
          {label}
        </span>
      </div>

      <span className="text-cyan-300">
        {isSaving ? "..." : `+${xp} XP`}
      </span>
    </button>
  );
}