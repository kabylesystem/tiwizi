/**
 * Yaz (ⵣ) — the Tifinagh letter at the heart of Amazigh identity.
 * Drawn as an SVG so it renders identically everywhere (no Tifinagh font needed).
 */
export function Yaz({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      >
        <line x1="6" y1="5.5" x2="18" y2="5.5" />
        <line x1="6" y1="18.5" x2="18" y2="18.5" />
        <line x1="12" y1="5.5" x2="12" y2="18.5" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-brand text-white shadow-sm">
        <Yaz className="h-4 w-4" />
      </span>
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
        Tiwizi
      </span>
    </span>
  );
}
