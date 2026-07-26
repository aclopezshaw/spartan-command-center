"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavDestination = {
  label: string;
  href: string;
};

type DirectNavItem = {
  type: "direct";
  label: string;
  href: string;
};

type GroupedNavItem = {
  type: "group";
  label: string;
  destinations: NavDestination[];
};

type NavItem = DirectNavItem | GroupedNavItem;

const navigation: NavItem[] = [
  {
    type: "direct",
    label: "Command HUD",
    href: "/command-hud",
  },
  {
    type: "group",
    label: "Service",
    destinations: [
      { label: "Service Record", href: "/service-record" },
      { label: "Service History", href: "/campaign-history" },
    ],
  },
  {
    type: "group",
    label: "Reports",
    destinations: [
      { label: "Intel Reports", href: "/intel-reports" },
      { label: "Training Reports", href: "/training-reports" },
    ],
  },
  {
    type: "direct",
    label: "Assembly Hall",
    href: "/assembly-hall",
  },
  {
    type: "direct",
    label: "SMU",
    href: "/medical-unit",
  },
];

function isPathActive(pathname: string, href?: string) {
  return Boolean(
    href && (pathname === href || pathname.startsWith(`${href}/`))
  );
}

function isGroupActive(pathname: string, item: GroupedNavItem) {
  return item.destinations.some(({ href }) => isPathActive(pathname, href));
}

function Destination({
  destination,
  pathname,
  mobile = false,
  onNavigate,
}: {
  destination: NavDestination;
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const isActive = isPathActive(pathname, destination.href);
  const sharedClassName = `flex items-center justify-between gap-4 border-l-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
    mobile ? "min-h-11" : ""
  }`;

  return (
    <Link
      href={destination.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={`${sharedClassName} ${
        isActive
          ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
          : "border-cyan-950 text-slate-300 hover:border-cyan-500 hover:bg-cyan-400/10 hover:text-cyan-100"
      }`}
    >
      <span>{destination.label}</span>
      {isActive ? (
        <span className="text-[8px] tracking-[0.2em] text-cyan-400">
          Active
        </span>
      ) : null}
    </Link>
  );
}

function DesktopNavigation({
  pathname,
  openGroup,
  setOpenGroup,
}: {
  pathname: string;
  openGroup: string | null;
  setOpenGroup: (
    group: string | null | ((current: string | null) => string | null)
  ) => void;
}) {
  return (
    <div className="hidden items-stretch gap-1 lg:flex">
      {navigation.map((item) => {
        if (item.type === "direct") {
          const isActive = isPathActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center whitespace-nowrap border px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] transition 2xl:px-4 2xl:tracking-[0.16em] ${
                isActive
                  ? "border-cyan-300 bg-cyan-400 text-black"
                  : "border-cyan-800/70 text-cyan-200 hover:border-cyan-500 hover:bg-cyan-400/10"
              }`}
            >
              {item.label}
            </Link>
          );
        }

        const isActive = isGroupActive(pathname, item);

        return (
          <details
            key={item.label}
            open={openGroup === item.label}
            onToggle={(event) => {
              if (event.currentTarget.open) {
                setOpenGroup(item.label);
              } else {
                setOpenGroup((current) =>
                  current === item.label ? null : current
                );
              }
            }}
            className="group relative"
          >
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center gap-2 whitespace-nowrap border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition [&::-webkit-details-marker]:hidden 2xl:px-4 2xl:tracking-[0.16em] ${
                isActive
                  ? "border-cyan-300 bg-cyan-400 text-black"
                  : "border-cyan-800/70 text-cyan-200 hover:border-cyan-500 hover:bg-cyan-400/10"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[9px] transition-transform group-open:rotate-180 ${
                  isActive
                    ? "text-black/70"
                    : "text-cyan-500"
                }`}
                aria-hidden="true"
              >
                ▼
              </span>
            </summary>

            <div
              className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 border border-cyan-700/70 bg-slate-950/98 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.8),0_0_24px_rgba(8,145,178,0.18)] backdrop-blur-xl"
            >
              <div className="border-b border-cyan-950 px-3 pb-2 pt-1">
                <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-600">
                  {item.label} Directory
                </p>
              </div>
              <div className="mt-2 space-y-1">
                {item.destinations.map((destination) => (
                  <Destination
                    key={destination.label}
                    destination={destination}
                    pathname={pathname}
                    onNavigate={() => setOpenGroup(null)}
                  />
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function MobileNavigation({
  pathname,
  open,
  setOpen,
}: {
  pathname: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const currentSection =
    navigation.find((item) =>
      item.type === "direct"
        ? isPathActive(pathname, item.href)
        : isGroupActive(pathname, item)
    )?.label ?? "Navigation";

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group lg:hidden"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between border border-cyan-800/70 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-[8px] uppercase tracking-[0.3em] text-cyan-600">
            Personnel Navigation
          </p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
            {currentSection}
          </p>
        </div>
        <span
          className="text-xs text-cyan-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          ▼
        </span>
      </summary>

      <div className="mt-2 border border-cyan-900/70 bg-black/70 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {navigation.map((item) => {
            if (item.type === "direct") {
              return (
                <Destination
                  key={item.href}
                  destination={{ label: item.label, href: item.href }}
                  pathname={pathname}
                  mobile
                  onNavigate={() => setOpen(false)}
                />
              );
            }

            const isActive = isGroupActive(pathname, item);

            return (
              <section
                key={item.label}
                className={`border p-2 ${
                  isActive
                    ? "border-cyan-700/70 bg-cyan-950/15"
                    : "border-cyan-950/80"
                }`}
              >
                <p
                  className={`px-2 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.25em] ${
                    isActive
                      ? "text-cyan-300"
                      : "text-slate-500"
                  }`}
                >
                  {item.label}
                </p>
                <div className="space-y-1">
                  {item.destinations.map((destination) => (
                    <Destination
                      key={destination.label}
                      destination={destination}
                      pathname={pathname}
                      mobile
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      aria-label="Primary navigation"
      className="relative z-40 ml-auto w-full border border-cyan-600/60 bg-slate-950/85 p-2 shadow-[0_0_24px_rgba(8,145,178,0.12)] lg:w-fit"
    >
      <DesktopNavigation
        pathname={pathname}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
      />
      <MobileNavigation
        pathname={pathname}
        open={mobileOpen}
        setOpen={setMobileOpen}
      />
    </nav>
  );
}
