"use client";

import { cn } from "@/lib/utils";

export type FennecMood = "happy" | "excited" | "thinking" | "encouraging" | "sad";

/** Idir · the fennec fox guide. Drawn as SVG so it needs no assets. */
export function FennecMascot({
  mood = "happy",
  size = 72,
  animated = true,
  className = "",
}: {
  mood?: FennecMood;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const eyes = (() => {
    switch (mood) {
      case "excited":
        return (
          <>
            <circle cx="38" cy="55" r="5.2" fill="#2A1F14" />
            <circle cx="62" cy="55" r="5.2" fill="#2A1F14" />
            <circle cx="40" cy="53" r="1.7" fill="#fff" />
            <circle cx="64" cy="53" r="1.7" fill="#fff" />
          </>
        );
      case "thinking":
        return (
          <>
            <path d="M33 55 q5 -4 10 0" stroke="#2A1F14" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <circle cx="62" cy="55" r="4.6" fill="#2A1F14" />
            <circle cx="63.6" cy="53.4" r="1.5" fill="#fff" />
          </>
        );
      case "sad":
        return (
          <>
            <circle cx="38" cy="57" r="4.4" fill="#2A1F14" />
            <circle cx="62" cy="57" r="4.4" fill="#2A1F14" />
            <path d="M31 49 q6 -3 11 1" stroke="#9b7b46" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M58 50 q6 -4 11 -1" stroke="#9b7b46" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        );
      default: // happy / encouraging
        return (
          <>
            <circle cx="38" cy="55" r="4.8" fill="#2A1F14" />
            <circle cx="62" cy="55" r="4.8" fill="#2A1F14" />
            <circle cx="39.7" cy="53.4" r="1.6" fill="#fff" />
            <circle cx="63.7" cy="53.4" r="1.6" fill="#fff" />
          </>
        );
    }
  })();

  const mouth =
    mood === "sad" ? (
      <path d="M44 72 q6 -5 12 0" stroke="#2A1F14" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    ) : mood === "thinking" ? (
      <path d="M45 71 h10" stroke="#2A1F14" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M43 70 q7 7 14 0" stroke="#2A1F14" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    );

  return (
    <span
      className={cn("inline-block shrink-0", animated && "animate-bob", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-label="Idir le fennec">
        {/* ears */}
        <g>
          <path d="M30 38 L12 4 L44 30 Z" fill="#d9a64e" stroke="#b9842f" strokeWidth="2" strokeLinejoin="round" />
          <path d="M70 38 L88 4 L56 30 Z" fill="#d9a64e" stroke="#b9842f" strokeWidth="2" strokeLinejoin="round" />
          <path d="M31 34 L19 12 L40 29 Z" fill="#f3d6a6" />
          <path d="M69 34 L81 12 L60 29 Z" fill="#f3d6a6" />
        </g>
        {/* head */}
        <ellipse cx="50" cy="56" rx="29" ry="27" fill="#f6e3c0" stroke="#dcb978" strokeWidth="2" />
        {/* cheeks / muzzle */}
        <ellipse cx="50" cy="66" rx="20" ry="16" fill="#fdf3df" />
        <circle cx="33" cy="64" r="4" fill="#f0c9a0" opacity="0.6" />
        <circle cx="67" cy="64" r="4" fill="#f0c9a0" opacity="0.6" />
        {eyes}
        {/* nose */}
        <path d="M47 62 h6 l-3 4 Z" fill="#2A1F14" />
        {mouth}
        {mood === "excited" && (
          <g fill="#cf8a16">
            <path d="M16 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
            <path d="M82 40 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" />
          </g>
        )}
      </svg>
    </span>
  );
}

export function FennecLogo({ size = 32 }: { size?: number }) {
  return <FennecMascot mood="happy" size={size} animated={false} />;
}
