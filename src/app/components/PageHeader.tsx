import Image from "next/image";

export default function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between border-b border-cyan-700/50 pb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative grid h-[90px] w-[78px] place-items-center sm:h-[108px] sm:w-[92px]">
          <div className="absolute inset-2 rounded-full bg-cyan-400/20 blur-xl" />
          <Image
            src="/images/ranks/recruit.png"
            alt="Recruit rank insignia"
            width={88}
            height={88}
            className="relative z-10 h-[82px] w-[82px] object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.55)] sm:h-[97px] sm:w-[97px]"
          />
        </div>

        <Image
          src="/images/scp-emblem-trans.png"
          alt="Spartan Candidate Program"
          width={110}
          height={110}
          className="h-[88px] w-[88px] object-contain opacity-90 sm:h-[110px] sm:w-[110px]"
        />
      </div>
    </div>
  );
}
