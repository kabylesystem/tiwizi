"use client";

/**
 * The per-user cognitive model (docs/pedagogie.md §3).
 * For every pattern, FOUR separately-scheduled channels · recognising in
 * text, recognising in audio, predicting the form, producing it · because
 * these are different cognitive states. Spacing per channel reuses the SM-2
 * scheduler from lib/srs.ts. Errors are classified (confused pattern, broken
 * channel, slowness), not just counted. localStorage only.
 */
import { schedule, type CardState, type Grade } from "./srs";
import type { PatternMeta } from "./patterns";

export type Channel = "recogText" | "recogAudio" | "predict" | "produce";
export const CHANNELS: Channel[] = ["recogText", "recogAudio", "predict", "produce"];

export const CHANNEL_LABEL: Record<Channel, string> = {
  recogText: "lecture",
  recogAudio: "oreille",
  predict: "anticipation",
  produce: "production",
};

export type ChannelState = CardState & {
  meanMs: number; // EMA of response time (automatisation proxy)
  hintLevel: number; // 2 word-bank → 1 assisted → 0 free (fading)
};

export type PatternSkill = {
  exposure: number; // instances encountered (flood & co)
  channels: Partial<Record<Channel, ChannelState>>;
  confusions: Record<string, number>; // competing patternId → count
  abstracted: boolean; // passed ≥2/3 fresh-vocab probes
  noteShown: boolean; // explicit note revealed (only AFTER induction)
  seenIds: number[]; // sentence ids already shown (variation control)
};

export type CogStore = {
  v: 1;
  patterns: Record<string, PatternSkill>;
  day: string;
  minutesToday: number;
  sessionsDone: number;
  lastSession: string;
  /** Longueur de flood adaptée à la vitesse d'induction réelle de l'élève (3..8). */
  floodLen: number;
};

const KEY = "tiwizi.cog.v1";
const today = () => new Date().toISOString().slice(0, 10);

const freshSkill = (): PatternSkill => ({
  exposure: 0,
  channels: {},
  confusions: {},
  abstracted: false,
  noteShown: false,
  seenIds: [],
});

export function loadCog(): CogStore {
  const fresh: CogStore = { v: 1, patterns: {}, day: today(), minutesToday: 0, sessionsDone: 0, lastSession: "", floodLen: 5 };
  if (typeof window === "undefined") return fresh;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as CogStore | null;
    if (!s || s.v !== 1 || typeof s.patterns !== "object" || !s.patterns) return fresh;
    s.floodLen ??= 5;
    if (s.day !== today()) {
      s.day = today();
      s.minutesToday = 0;
    }
    return s;
  } catch {
    return fresh;
  }
}

export function saveCog(s: CogStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tiwizi:dirty")); // → réplication disque (StateSync)
}

export function skill(s: CogStore, patternId: string): PatternSkill {
  return (s.patterns[patternId] ??= freshSkill());
}

/** Log pure exposure (flood, reveals) · no scheduling, just the input diet. */
export function recordExposure(s: CogStore, patternId: string, sentenceIds: number[]) {
  const sk = skill(s, patternId);
  sk.exposure += sentenceIds.length;
  const set = new Set(sk.seenIds);
  for (const id of sentenceIds) set.add(id);
  sk.seenIds = [...set].slice(-400);
}

export type CogEvent = {
  patternId: string;
  channel: Channel;
  grade: Grade; // 0 encore · 1 difficile · 2 bien · 3 facile
  ms?: number;
  confusedWith?: string; // competing pattern the user applied
};

export function recordEvent(s: CogStore, e: CogEvent) {
  const sk = skill(s, e.patternId);
  const prev = sk.channels[e.channel];
  const next = schedule(prev, e.grade) as ChannelState;
  next.meanMs = prev?.meanMs ? Math.round(prev.meanMs * 0.7 + (e.ms ?? prev.meanMs) * 0.3) : e.ms ?? 0;
  const prevHint = prev?.hintLevel ?? 2;
  // fading: two clean reps at this hint level → less help; a lapse → more help
  next.hintLevel = e.grade === 0 ? Math.min(2, prevHint + 1) : next.reps >= 2 && e.grade >= 2 ? Math.max(0, prevHint - 1) : prevHint;
  sk.channels[e.channel] = next;
  if (e.confusedWith) sk.confusions[e.confusedWith] = (sk.confusions[e.confusedWith] || 0) + 1;
}

export type Due = { patternId: string; channel: Channel; overdueMs: number; state: ChannelState };

/** Every (pattern, channel) whose review is due, most overdue first. */
export function dues(s: CogStore): Due[] {
  const now = Date.now();
  const out: Due[] = [];
  for (const [pid, sk] of Object.entries(s.patterns)) {
    for (const ch of CHANNELS) {
      const st = sk.channels[ch];
      if (st && st.due <= now) out.push({ patternId: pid, channel: ch, overdueMs: now - st.due, state: st });
    }
  }
  return out.sort((a, b) => b.overdueMs - a.overdueMs);
}

/** Next pattern to induce: lowest order, prerequisites exposed, not yet abstracted. */
export function nextInduction(s: CogStore, metas: PatternMeta[]): PatternMeta | null {
  const ordered = [...metas].sort((a, b) => a.order - b.order);
  for (const m of ordered) {
    const sk = s.patterns[m.id];
    if (sk?.abstracted) continue;
    const ready = m.requires.every((r) => (s.patterns[r]?.exposure ?? 0) >= 4);
    if (ready) return m;
  }
  return null;
}

/** Weakest abstracted patterns (for consolidation when nothing is due). */
export function weakest(s: CogStore, metas: PatternMeta[], n: number): PatternMeta[] {
  const strength = (sk: PatternSkill) => {
    const sts = CHANNELS.map((c) => sk.channels[c]).filter(Boolean) as ChannelState[];
    if (!sts.length) return 0;
    return sts.reduce((a, st) => a + st.reps - st.lapses, 0) / sts.length;
  };
  return metas
    .filter((m) => s.patterns[m.id]?.abstracted)
    .sort((a, b) => strength(s.patterns[a.id]!) - strength(s.patterns[b.id]!))
    .slice(0, n);
}

/** Compact snapshot of the learner state, sent to Idir so the tutor KNOWS
 *  where naly really is (patterns extraits, canaux faibles, confusions, dûs). */
export type CogSnapshot = {
  abstracted: string[];
  learning: string | null; // pattern en cours d'induction (exposé mais pas extrait)
  due: { id: string; channels: Channel[] }[];
  weak: { id: string; channel: Channel; lapses: number }[];
  confusions: { id: string; with: string; n: number }[];
  sessionsDone: number;
};

export function cogSnapshot(s: CogStore): CogSnapshot {
  const now = Date.now();
  const abstracted: string[] = [];
  let learning: string | null = null;
  const due: CogSnapshot["due"] = [];
  const weak: CogSnapshot["weak"] = [];
  const confusions: CogSnapshot["confusions"] = [];
  for (const [pid, sk] of Object.entries(s.patterns)) {
    if (sk.abstracted) abstracted.push(pid);
    else if (sk.exposure > 0 && !learning) learning = pid;
    const dueCh = CHANNELS.filter((c) => sk.channels[c] && sk.channels[c]!.due <= now);
    if (dueCh.length) due.push({ id: pid, channels: dueCh });
    for (const c of CHANNELS) {
      const st = sk.channels[c];
      if (st && st.lapses >= 2 && st.lapses > st.reps) weak.push({ id: pid, channel: c, lapses: st.lapses });
    }
    for (const [w, n] of Object.entries(sk.confusions)) if (n >= 2) confusions.push({ id: pid, with: w, n });
  }
  return { abstracted, learning, due: due.slice(0, 6), weak: weak.slice(0, 6), confusions: confusions.slice(0, 4), sessionsDone: s.sessionsDone };
}

/** The channel of a pattern that most needs work (least reps, most lapses). */
export function weakestChannel(sk: PatternSkill): Channel {
  let best: Channel = "recogAudio";
  let bestScore = Infinity;
  for (const ch of CHANNELS) {
    const st = sk.channels[ch];
    const score = st ? st.reps * 2 - st.lapses : -1;
    if (score < bestScore) {
      bestScore = score;
      best = ch;
    }
  }
  return best;
}
