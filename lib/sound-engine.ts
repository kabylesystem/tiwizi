"use client";

import { useCallback, useRef } from "react";

/**
 * Minimal WebAudio feedback (no asset files). Tiny synth blips for
 * correct/wrong/complete. Respects a global mute flag.
 */
let muted = false;

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const tone = useCallback((freq: number, dur = 0.12, type: OscillatorType = "sine") => {
    if (muted || typeof window === "undefined") return;
    try {
      ctxRef.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }, []);

  const play = useCallback(
    (kind: "correct" | "wrong" | "complete" | "tap") => {
      if (kind === "correct") tone(660, 0.12), setTimeout(() => tone(880, 0.12), 90);
      else if (kind === "wrong") tone(180, 0.2, "sawtooth");
      else if (kind === "complete") [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.15), i * 110));
      else tone(440, 0.05);
    },
    [tone]
  );

  const setMuted = useCallback((m: boolean) => {
    muted = m;
  }, []);

  return { play, setMuted };
}
