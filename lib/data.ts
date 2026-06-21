import fs from "node:fs";
import path from "node:path";
import { fold } from "./normalize";

const DATA = path.join(process.cwd(), "data");

export type Pair = {
  id: number;
  kab: string;
  fr: string;
  audio: boolean;
  w: number;
  c: number;
};

export type DictMeaning = {
  fr: string[];
  note?: string;
  ex: { kab: string; fr: string }[];
};
export type DictEntry = {
  w: string;
  forms: string[];
  root: string;
  note?: string;
  m: DictMeaning[];
};

function read<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;
}

// --- module-level caches (load once per server process) ---
let _deck: Pair[] | null = null;
let _pairs: Pair[] | null = null;
let _pairsFold: string[] | null = null;
let _dict: DictEntry[] | null = null;
let _dictForms: string[][] | null = null;
let _dictMean: string[] | null = null;

export function deck(): Pair[] {
  return (_deck ??= read<Pair[]>("deck.json"));
}

function pairs(): Pair[] {
  return (_pairs ??= read<Pair[]>("pairs.json"));
}

export function searchSentences(q: string, limit = 60): Pair[] {
  const all = pairs();
  _pairsFold ??= all.map((p) => fold(p.kab + " ¦ " + p.fr));
  const needle = fold(q).trim();
  if (!needle) return all.slice(0, limit);
  const out: Pair[] = [];
  for (let i = 0; i < all.length && out.length < limit; i++) {
    if (_pairsFold[i].includes(needle)) out.push(all[i]);
  }
  return out;
}

function dict(): DictEntry[] {
  return (_dict ??= read<DictEntry[]>("dict.json"));
}

export function searchDict(q: string, limit = 40): DictEntry[] {
  const all = dict();
  _dictForms ??= all.map((e) => e.forms.map((f) => fold(f)));
  _dictMean ??= all.map((e) => " " + fold(e.m.map((m) => m.fr.join(" ")).join(" ")));
  const needle = fold(q).trim();
  if (!needle) return [];

  // lower score = better match (kabyle word matches beat meaning matches)
  const scored: { i: number; s: number }[] = [];
  for (let i = 0; i < all.length; i++) {
    const forms = _dictForms[i];
    let s = 99;
    if (forms.some((f) => f === needle)) s = 0;
    else if (forms.some((f) => f.startsWith(needle))) s = 1;
    else if (forms.some((f) => f.includes(needle))) s = 2;
    else if (_dictMean[i].includes(" " + needle)) s = 3;
    else if (_dictMean[i].includes(needle)) s = 4;
    if (s < 99) scored.push({ i, s });
  }
  scored.sort((a, b) => a.s - b.s || a.i - b.i);
  return scored.slice(0, limit).map((x) => all[x.i]);
}

export type GrammarCard = { topic: string; q: string; a: string };
let _grammar: GrammarCard[] | null = null;
let _grammarFold: string[] | null = null;

export function searchGrammar(q: string, limit = 5): GrammarCard[] {
  _grammar ??= read<GrammarCard[]>("grammar-kb.json");
  _grammarFold ??= _grammar.map((g) => fold(`${g.topic} ${g.q} ${g.a}`));
  const needle = fold(q).trim();
  if (!needle) return [];
  const terms = needle.split(/\s+/).filter((t) => t.length >= 3);
  const scored: { i: number; s: number }[] = [];
  for (let i = 0; i < _grammar.length; i++) {
    const f = _grammarFold[i];
    let s = 0;
    if (f.includes(needle)) s += 5;
    for (const t of terms) if (f.includes(t)) s += 1;
    if (s > 0) scored.push({ i, s });
  }
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  return scored.slice(0, limit).map((x) => _grammar![x.i]);
}

export function stats() {
  const all = pairs();
  return {
    pairs: all.length,
    withAudio: all.filter((p) => p.audio).length,
    deck: deck().length,
    dict: dict().length,
  };
}
