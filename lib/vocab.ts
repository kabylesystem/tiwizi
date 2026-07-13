"use client";

/**
 * Suivi des MOTS : chaque mot tapé (→ fiche Dallet) entre dans le lexique
 * personnel. Le vocab s'acquiert par l'exposition massive aux phrases ; ici on
 * rend l'exploration active traçable (mots rencontrés → curiosité → ancrage).
 * Synchronisé sur disque comme le reste (lib/persist.ts).
 */
import { fold } from "./normalize";

export type VocabEntry = {
  w: string; // forme telle que rencontrée
  lookups: number;
  first: string; // jour de première rencontre
  last: string;
};

type VocabStore = { v: 1; words: Record<string, VocabEntry> };

const KEY = "tiwizi.vocab.v1";
const today = () => new Date().toISOString().slice(0, 10);

export function loadVocab(): VocabStore {
  if (typeof window === "undefined") return { v: 1, words: {} };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as VocabStore | null;
    if (s?.v === 1 && s.words) return s;
  } catch {}
  return { v: 1, words: {} };
}

export function recordLookup(word: string) {
  if (typeof window === "undefined") return;
  const clean = word.replace(/[.,;:!?«»"()…]/gu, "");
  if (!clean) return;
  const k = fold(clean);
  const s = loadVocab();
  const e = s.words[k];
  if (e) {
    e.lookups += 1;
    e.last = today();
  } else {
    s.words[k] = { w: clean, lookups: 1, first: today(), last: today() };
  }
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tiwizi:dirty"));
}

export function vocabCount(): number {
  return Object.keys(loadVocab().words).length;
}
