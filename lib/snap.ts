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
    // la reprise vaut TOUTE LA JOURNÉE (demande kabylesystem : le programme du
    // jour doit se finir même s'il part des heures) · + fenêtre de 3 h pour
    // les sessions à cheval sur minuit (bug du 2026-08-13 00h)
    const sameDay = s.day === new Date().toISOString().slice(0, 10);
    const fresh = Date.now() - s.ts < 3 * 3600_000;
    if ((sameDay || fresh) && s.elapsed >= 20) return s;
  } catch {}
  return null;
}

export function clearSnap() {
  localStorage.removeItem(SNAP_KEY);
}
