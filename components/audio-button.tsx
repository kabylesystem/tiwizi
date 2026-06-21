"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function audioUrl(id: number) {
  return `https://audio.tatoeba.org/sentences/kab/${id}.mp3`;
}

export function AudioButton({
  id,
  autoPlay = false,
  size = "md",
}: {
  id: number;
  autoPlay?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

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

  const dim =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={play}
      aria-label="Écouter la prononciation"
      className={`group grid ${dim} place-items-center rounded-full border border-line-strong bg-card text-brand shadow-sm transition-all hover:border-brand hover:bg-brand-soft active:scale-95`}
    >
      <audio
        ref={ref}
        src={audioUrl(id)}
        preload="none"
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
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
