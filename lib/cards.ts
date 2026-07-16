"use client";

/**
 * « Mes cartes » : le deck personnel de naly, alimenté par sa curiosité
 * (mots tapés dans les phrases ou dans le chat d'Idir). PROVENANCE DURE :
 * une carte vient TOUJOURS d'une fiche Dallet (source vérifiée), jamais de
 * la prose d'un LLM. SRS SM-2 par carte, localStorage + réplication disque.
 */
import { schedule, type CardState, type Grade } from "./srs";
import { fold } from "./normalize";

export type MyCard = {
  k: string; // clé foldée
  kab: string; // forme Dallet
  fr: string; // sens (Dallet, 3 premiers)
  root?: string;
  addedAt: string;
  state: CardState;
};

type CardStore = { v: 1; cards: Record<string, MyCard> };

const KEY = "tiwizi.cards.v1";

export function loadCards(): CardStore {
  if (typeof window === "undefined") return { v: 1, cards: {} };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as CardStore | null;
    if (s?.v === 1 && s.cards) return s;
  } catch {}
  return { v: 1, cards: {} };
}

function save(s: CardStore) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tiwizi:dirty"));
}

/** Ajoute une carte depuis une fiche Dallet. Retourne false si déjà là. */
export function addCard(entry: { w: string; root?: string; m: { fr: string[] }[] }): boolean {
  const s = loadCards();
  const k = fold(entry.w);
  if (s.cards[k]) return false;
  s.cards[k] = {
    k,
    kab: entry.w,
    fr: entry.m[0]?.fr.slice(0, 3).join(" · ") ?? "",
    root: entry.root || undefined,
    addedAt: new Date().toISOString().slice(0, 10),
    state: schedule(undefined, 2), // entre dans le cycle : dû demain
  };
  save(s);
  return true;
}

export function hasCard(word: string): boolean {
  return !!loadCards().cards[fold(word)];
}

export function gradeCard(k: string, g: Grade) {
  const s = loadCards();
  const c = s.cards[k];
  if (!c) return;
  c.state = schedule(c.state, g);
  save(s);
}

export function removeCard(k: string) {
  const s = loadCards();
  delete s.cards[k];
  save(s);
}

export function allCards(): MyCard[] {
  return Object.values(loadCards().cards).sort((a, b) => a.state.due - b.state.due);
}

export function dueCards(): MyCard[] {
  const now = Date.now();
  return allCards().filter((c) => c.state.due <= now);
}
