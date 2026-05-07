import { cn } from "@/lib/utils";

/**
 * Realistic 3D Zexo Coin — minted metallic look with embossed Z.
 */
export function ZexoCoin({ size = 22, className }: { size?: number; className?: string }) {
  const id = `zc-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("inline-block", className)}
      aria-label="Zexo Coin"
    >
      <defs>
        {/* Outer beveled rim */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4D078" />
          <stop offset="50%" stopColor="#B8861F" />
          <stop offset="100%" stopColor="#6B4A0A" />
        </linearGradient>
        {/* Coin face — brushed gold */}
        <radialGradient id={`${id}-face`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#F8E6A8" />
          <stop offset="55%" stopColor="#D9A82B" />
          <stop offset="100%" stopColor="#8E5F0B" />
        </radialGradient>
        {/* Z embossed gradient */}
        <linearGradient id={`${id}-z`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="100%" stopColor="#7F5408" />
        </linearGradient>
      </defs>

      {/* outer ring */}
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-rim)`} />
      {/* face */}
      <circle cx="32" cy="32" r="26" fill={`url(#${id}-face)`} />
      {/* inner engraved circle */}
      <circle cx="32" cy="32" r="22" fill="none" stroke="#7A4F08" strokeWidth="0.7" opacity="0.55" />
      {/* tiny notches around the rim for realism */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * Math.PI) / 12;
        const x1 = 32 + Math.cos(a) * 28;
        const y1 = 32 + Math.sin(a) * 28;
        const x2 = 32 + Math.cos(a) * 30;
        const y2 = 32 + Math.sin(a) * 30;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5A3A02" strokeWidth="0.6" opacity="0.5" />;
      })}
      {/* Z monogram */}
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="30"
        fill={`url(#${id}-z)`}
        stroke="#4A3000"
        strokeWidth="0.5"
      >
        Z
      </text>
      {/* subtle highlight (no big lightning) */}
      <ellipse cx="24" cy="20" rx="8" ry="3.5" fill="white" opacity="0.22" />
    </svg>
  );
}

export function ZexoBalance({
  amount,
  size = 18,
  variant = "default",
}: {
  amount: number;
  size?: number;
  variant?: "default" | "compact" | "pill";
}) {
  const formatted = Number(amount || 0).toLocaleString("en-IN");
  if (variant === "pill") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-amber-300/40 dark:ring-amber-500/30">
        <ZexoCoin size={size} />
        <span className="font-semibold text-foreground tabular-nums text-sm">{formatted}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <ZexoCoin size={size} />
      <span className="tabular-nums text-foreground">{formatted}</span>
    </span>
  );
}
