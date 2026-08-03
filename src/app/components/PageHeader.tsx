"use client";

import Image from "next/image";
import { getRankInsigniaPath } from "@/lib/rank-insignia";
import {
  FIRETEAM_EPSILON_INSIGNIA,
  SCP_INSTITUTIONAL_INSIGNIA,
  type PersonnelInsignia,
} from "@/lib/personnel-insignia";
import { useNavigationAvailability } from "./NavigationAvailability";

export default function PageHeader({
  eyebrow,
  title,
  personnelInsignia = [],
}: {
  eyebrow: string;
  title: string;
  personnelInsignia?: readonly PersonnelInsignia[];
}) {
  const { fireteamUnlocked } = useNavigationAvailability();
  const visiblePersonnelInsignia =
    personnelInsignia.length > 0
      ? personnelInsignia
      : fireteamUnlocked
        ? [FIRETEAM_EPSILON_INSIGNIA]
        : [];

  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-cyan-700/50 pb-4 sm:flex-row">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 self-end items-center gap-2 sm:self-auto sm:gap-3">
        <div className="relative grid h-[90px] w-[78px] place-items-center sm:h-[108px] sm:w-[92px]">
          <div className="absolute inset-2 rounded-full bg-cyan-400/20 blur-xl" />
          <Image
            src={getRankInsigniaPath("Recruit")}
            alt="Recruit rank insignia"
            width={88}
            height={88}
            className="relative z-10 h-[82px] w-[82px] object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.55)] sm:h-[97px] sm:w-[97px]"
          />
        </div>

        {visiblePersonnelInsignia.map((insignia) => (
          <Image
            key={insignia.id}
            src={insignia.path}
            alt={`${insignia.label} patch`}
            width={96}
            height={96}
            className="h-[74px] w-[74px] object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.35)] sm:h-[92px] sm:w-[92px]"
          />
        ))}

        <Image
          src={SCP_INSTITUTIONAL_INSIGNIA.path}
          alt={SCP_INSTITUTIONAL_INSIGNIA.label}
          width={110}
          height={110}
          className="h-[88px] w-[88px] object-contain opacity-90 sm:h-[110px] sm:w-[110px]"
        />
      </div>
    </div>
  );
}
