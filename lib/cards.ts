"use client";

/**
 * « Mes cartes » : le deck personnel de naly, alimenté par sa curiosité
 * (mots tapés dans les phrases ou dans le chat d'Idir). PROVENANCE DURE :
 * une carte vient TOUJOURS d'une fiche Dallet (source vérifiée), jamais de
 * la prose d'un LLM. SRS SM-2 par carte, localStorage + réplication disque.
 */
import { schedule, type CardState, type Grade } from "./srs";
import { fold, cleanGloss } from "./normalize";

export type MyCard = {
  k: string; // clé foldée
  kab: string;
  fr: string; // sens, toujours issu d'une source humaine
  root?: string;
  source?: string; // Dallet · grammaire (cours) · …
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

/** Ajoute une carte (sens TOUJOURS issu d'une source humaine). */
export function addCardRaw(c: { kab: string; fr: string; root?: string; source?: string }): boolean {
  const s = loadCards();
  const k = fold(c.kab);
  if (s.cards[k] || !c.fr) return false;
  s.cards[k] = {
    k,
    kab: c.kab,
    fr: cleanGloss(c.fr),
    root: c.root,
    source: c.source,
    addedAt: new Date().toISOString().slice(0, 10),
    state: schedule(undefined, 2), // entre dans le cycle : dû demain
  };
  save(s);
  return true;
}

/** Depuis une fiche Dallet (bouton « + ma carte » des popovers). */
export function addCard(entry: { w: string; root?: string; m: { fr: string[] }[] }): boolean {
  return addCardRaw({
    kab: entry.w,
    fr: entry.m[0]?.fr.slice(0, 3).join(" · ") ?? "",
    root: entry.root || undefined,
    source: "Dallet",
  });
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
