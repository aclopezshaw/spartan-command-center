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

      <Image
        src="/images/scp-emblem-trans.png"
        alt="Spartan Candidate Program"
        width={110}
        height={110}
        className="opacity-90"
      />
    </div>
  );
}