type HudPanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
};

export default function HudPanel({
  title,
  children,
  className = "",
  titleClassName = "",
}: HudPanelProps) {
  return (
    <div
      className={`
        border border-cyan-900/60
        bg-black/10
        backdrop-blur-xs
        p-3
        ${className}
      `}
    >
      <p className={`text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4 ${titleClassName}`}>
    {title}
</p>

      {children}
    </div>
  );
}