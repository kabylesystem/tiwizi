"use client";

/** Snapshot de session en cours · partagé entre /session et l'accueil. */
import { SESSION_MINUTES } from "./session-engine";

export const SNAP_KEY = "tiwizi.session.v1";
export type Snap = {
  day: string;
  ts: number;
  elapsed: number;
  ran: { react: number; induction: number; generate: number; cards: number; scene: number };
  stats: { items: number; ok: number; patterns: string[] };
};

export function loadSnap(): Snap | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(localStorage.getItem(SNAP_KEY) || "null") as Snap | null;
    if (!s) return null;
    // fenêtre de 3 h, PEU IMPORTE le calendrier : une session à cheval sur
    // minuit reste la même séance (bug du 2026-08-13 00h)
    const fresh = Date.now() - s.ts < 3 * 3600_000;
    if (fresh && s.elapsed >= 20) return s;
  } catch {}
  return null;
}

export function clearSnap() {
  localStorage.removeItem(SNAP_KEY);
}
