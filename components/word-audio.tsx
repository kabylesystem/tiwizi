"use client";

/**
 * Bouton son pour un MOT (cartes, fiches) : demande la synthèse à /api/tts
 * (une fois, puis cache disque) et affiche le bouton azur quand c'est prêt.
 */
import { useEffect, useState } from "react";
import { AudioButton } from "@/components/audio-button";

export function WordAudio({ kab, size = "md", autoPlay = false }: { kab: string; size?: "sm" | "md" | "lg"; autoPlay?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/tts?t=${encodeURIComponent(kab)}`)
      .then((r) => r.json())
      .then((d) => alive && d.url && setUrl(d.url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [kab]);
  if (!url) return null;
  return <AudioButton id={0} synthetic src={url} size={size} autoPlay={autoPlay} />;
}
