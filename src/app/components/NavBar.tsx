"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Command HUD", href: "/command-hud" },
  { label: "Service Record", href: "/service-record" },
  { label: "Armory", href: "/armory" },
  { label: "Promotion Board", href: "/promotion-board" },
  { label: "Service History", href: "/campaign-history" },
  { label: "Intel Reports", href: "/intel-reports" },
  { label: "Training Reports", href: "/training-reports" },
  { label: "SMU", href: "/medical-unit" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-nowrap justify-evenly gap-0 overflow-x-auto border border-cyan-600/60 bg-slate-950/70 p-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 whitespace-nowrap px-3 py-2 text-center text-xs uppercase tracking-[0.14em] transition ${
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
