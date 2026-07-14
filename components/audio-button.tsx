"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function audioUrl(id: number) {
  return `https://audio.tatoeba.org/sentences/kab/${id}.mp3`;
}

/** Voix synthétique locale (MMS kabyle) pour les phrases sans audio natif. */
export function ttsUrl(id: number) {
  return `/tts/${id}.mp3`;
}

export function AudioButton({
  id,
  autoPlay = false,
  size = "md",
  synthetic = false,
}: {
  id: number;
  autoPlay?: boolean;
  size?: "sm" | "md" | "lg";
  /** true = voix synthétique (bouton azur + tooltip) ; false = voix native */
  synthetic?: boolean;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dead, setDead] = useState(false); // fichier absent / CDN 403 → on s'efface

  const play = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(play, 220);
      return () => clearTimeout(t);
    }
  }, [autoPlay, id, play]);

  if (dead) return null;

  const dim =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={play}
      aria-label={synthetic ? "Écouter (voix synthétique)" : "Écouter la prononciation (voix native)"}
      title={synthetic ? "Voix synthétique (IA, MMS) : le texte est humain, la voix non" : "Voix native (Tatoeba)"}
      className={`group grid ${dim} place-items-center rounded-full border bg-card shadow-sm transition-all active:scale-95 ${
        synthetic
          ? "border-[rgba(31,99,176,0.35)] text-[#1f63b0] hover:bg-[rgba(31,99,176,0.08)]"
          : "border-line-strong text-brand hover:border-brand hover:bg-brand-soft"
      }`}
    >
      <audio
        ref={ref}
        src={synthetic ? ttsUrl(id) : audioUrl(id)}
        preload="none"
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onError={() => setDead(true)}
      />
      <svg
        viewBox="0 0 24 24"
        className={`${icon} ${playing ? "animate-pulse" : ""}`}
        fill="currentColor"
      >
        <path d="M11 5 6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4a1 1 0 0 0 1.6-.8V5.8A1 1 0 0 0 11 5z" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"
        />
      </svg>
    </button>
  );
}
