"use client";

/**
 * Axxam · a traditional Kabyle house that "builds itself" as you progress.
 * Revealed bottom-up via a clip whose height tracks `progress` (0..100).
 */
export function AxxamPreview({
  progress = 0,
  className = "",
}: {
  progress?: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, progress));
  const topY = 18;
  const botY = 92;
  const revealH = ((botY - topY) * p) / 100;
  const clipY = botY - revealH;
  const id = "axxam-clip";

  const House = ({ faint }: { faint?: boolean }) => (
    <g
      opacity={faint ? 0.16 : 1}
      stroke={faint ? "#b9842f" : "#b9842f"}
      strokeWidth={faint ? 1.4 : 1.8}
      strokeLinejoin="round"
    >
      {/* roof */}
      <path d="M16 48 L50 18 L84 48 Z" fill={faint ? "none" : "#cf8a5a"} />
      {/* body */}
      <rect x="22" y="48" width="56" height="44" fill={faint ? "none" : "#ecd6aa"} />
      {/* door */}
      <rect x="42" y="64" width="16" height="28" rx="1" fill={faint ? "none" : "#9c6b3f"} />
      <circle cx="54" cy="78" r="1.4" fill={faint ? "none" : "#f6e3c0"} stroke="none" />
      {/* windows */}
      <rect x="28" y="56" width="11" height="10" fill={faint ? "none" : "#bfe0ef"} />
      <rect x="61" y="56" width="11" height="10" fill={faint ? "none" : "#bfe0ef"} />
      {/* yaz on the gable */}
      <g stroke={faint ? "#b9842f" : "#a8763a"} strokeWidth="1.6" strokeLinecap="round">
        <line x1="46" y1="36" x2="54" y2="36" />
        <line x1="46" y1="44" x2="54" y2="44" />
        <line x1="50" y1="36" x2="50" y2="44" />
      </g>
    </g>
  );

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label={`Axxam · ${Math.round(p)}%`}>
      <defs>
        <clipPath id={id}>
          <rect x="0" y={clipY} width="100" height={revealH + 0.5} />
        </clipPath>
      </defs>
      {/* ground */}
      <ellipse cx="50" cy="92" rx="40" ry="4" fill="#e7d3a6" opacity="0.5" />
      <House faint />
      <g clipPath={`url(#${id})`}>
        <House />
      </g>
    </svg>
  );
}
