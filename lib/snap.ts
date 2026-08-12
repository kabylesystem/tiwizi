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
    const fresh = Date.now() - s.ts < 3 * 3600_000;
    const today = s.day === new Date().toISOString().slice(0, 10);
    // pas de plafond : le programme du jour peut légitimement dépasser 15:00
    if (fresh && today && s.elapsed >= 20) return s;
  } catch {}
  return null;
}

export function clearSnap() {
  localStorage.removeItem(SNAP_KEY);
}
