"use client";

/**
 * Bouton son pour un MOT (cartes, fiches) : demande la synthèse à /api/tts
 * (une fois, puis cache disque). Le bouton apparaît TOUT DE SUITE : état
 * « préparation » qui pulse tant que la voix se génère (15-30 s la première
 * fois), lecture auto dès qu'elle est prête si on a cliqué entre-temps.
 */
import { useEffect, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";

export function WordAudio({ kab, size = "md", autoPlay = false }: { kab: string; size?: "sm" | "md" | "lg"; autoPlay?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [clicked, setClicked] = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    tries.current = 0;
    const ask = () => {
      fetch(`/api/tts?t=${encodeURIComponent(kab)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d.url) setUrl(d.url);
          else throw new Error("no url");
        })
        .catch(() => {
          if (!alive) return;
          tries.current += 1;
          if (tries.current < 3) setTimeout(ask, 4000);
          else setFailed(true);
        });
    };
    ask();
    return () => {
      alive = false;
    };
  }, [kab]);

  if (failed) return null;
  if (!url) {
    const dim = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
    return (
      <button
        type="button"
        onClick={() => setClicked(true)}
        title="Voix en préparation… (première génération de ce mot)"
        aria-label="Voix en préparation"
        className={`grid ${dim} animate-pulse place-items-center rounded-full border border-[rgba(31,99,176,0.35)] bg-card text-[#1f63b0] shadow-sm`}
      >
        <svg viewBox="0 0 24 24" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} fill="currentColor">
          <path d="M11 5 6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4a1 1 0 0 0 1.6-.8V5.8A1 1 0 0 0 11 5z" />
        </svg>
      </button>
    );
  }
  return <AudioButton id={0} synthetic src={url} size={size} autoPlay={autoPlay || clicked} />;
}
