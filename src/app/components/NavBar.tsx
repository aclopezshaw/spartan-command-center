"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Command HUD", href: "/command-hud" },
  { label: "Dossier", href: "/dossier" },
  { label: "Service Record", href: "/service-record" },
  { label: "Armory", href: "/armory" },
  { label: "Promotion Board", href: "/promotion-board" },
  { label: "Campaign History", href: "/campaign-history" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border border-cyan-700/40 bg-slate-950/70 p-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
              isActive
                ? "bg-cyan-400 text-black"
                : "border border-cyan-700/40 text-cyan-300 hover:bg-cyan-400/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}