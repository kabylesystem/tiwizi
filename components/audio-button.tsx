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
  src,
  text,
}: {
  id: number;
  autoPlay?: boolean;
  size?: "sm" | "md" | "lg";
  /** true = voix synthétique (bouton azur + tooltip) ; false = voix native */
  synthetic?: boolean;
  /** URL explicite (ex : TTS d'une variante corrompue) · prime sur id */
  src?: string;
  /** texte kabyle : permet la génération TTS à la demande en dernier recours */
  text?: string;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dead, setDead] = useState(false);
  const [usingSynth, setUsingSynth] = useState(synthetic);

  // fichier mort ≠ bouton mort : natif → tts local → génération à la demande
  const candidates = useRef<string[]>([]);
  const stage = useRef(0);
  if (candidates.current.length === 0) {
    const c: string[] = [];
    if (src) c.push(src);
    else if (synthetic) c.push(ttsUrl(id));
    else c.push(audioUrl(id), ttsUrl(id));
    if (text && text.length <= 60) c.push("gen:" + text);
    candidates.current = c;
  }

  // Audio HORS DOM (new Audio()) : les extensions type Video Speed Controller
  // s'accrochent aux <audio> insérés dans la page · ici il n'y en a plus.
  const playStage = useCallback(async (i: number) => {
    const cand = candidates.current[i];
    if (!cand) {
      setDead(true);
      return;
    }
    let url = cand;
    if (cand.startsWith("gen:")) {
      try {
        const d = await fetch(`/api/tts?t=${encodeURIComponent(cand.slice(4))}`).then((r) => r.json());
        if (!d.url) throw new Error("no url");
        url = d.url;
        candidates.current[i] = url;
      } catch {
        setDead(true);
        return;
      }
    }
    ref.current?.pause();
    const a = new Audio(url);
    a.preload = "none";
    a.onplay = () => setPlaying(true);
    a.onended = () => setPlaying(false);
    a.onpause = () => setPlaying(false);
    a.onerror = () => {
      stage.current = i + 1;
      playStage(i + 1);
    };
    ref.current = a;
    if (i > 0 || synthetic) setUsingSynth(true);
    a.play().catch(() => {});
  }, [synthetic]);

  const play = useCallback(() => {
    playStage(stage.current);
  }, [playStage]);

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(play, 220);
      return () => clearTimeout(t);
    }
  }, [autoPlay, id, play]);

  useEffect(() => () => ref.current?.pause(), []);

  if (dead) return null;
  const synthLook = usingSynth;

  const dim =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={play}
      aria-label={synthLook ? "Écouter (voix synthétique)" : "Écouter la prononciation (voix native)"}
      title={synthLook ? "Voix synthétique (IA, MMS) : le texte est humain, la voix non" : "Voix native (Tatoeba)"}
      className={`group grid ${dim} place-items-center rounded-full border bg-card shadow-sm transition-all active:scale-95 ${
        synthLook
          ? "border-[rgba(31,99,176,0.35)] text-[#1f63b0] hover:bg-[rgba(31,99,176,0.08)]"
          : "border-line-strong text-brand hover:border-brand hover:bg-brand-soft"
      }`}
    >
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
