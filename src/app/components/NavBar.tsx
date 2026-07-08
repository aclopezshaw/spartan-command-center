"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Command HUD", href: "/command-hud" },
  { label: "Service Record", href: "/service-record" },
  { label: "Armory", href: "/armory" },
  { label: "Promotion Board", href: "/promotion-board" },
  { label: "Campaign History", href: "/campaign-history" },
  { label: "Intel Reports", href: "/intel-reports" },
  { label: "Training Reports", href: "/training-reports" },
  { label: "Medical Unit", href: "/medical-unit" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border border-cyan-600/60 bg-slate-950/70 p-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
              isActive
                ? "bg-cyan-400 text-black"
                : "border border-cyan-600/60 text-cyan-300 hover:bg-cyan-400/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}