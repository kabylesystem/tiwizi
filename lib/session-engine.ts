"use client";

/**
 * Adaptive session composition (docs/pedagogie.md §4 & §6).
 * The engine decides WHAT the brain works on next from the cognitive model:
 *   réactivation (dues, weakest channel first) → induction OR consolidation
 *   → génération · looping while the 15 minutes run.
 * Each item = one FORMAT targeting one CHANNEL of one PATTERN.
 */
import type { PatternMeta, PatternMaterial, Lite, Corrupt, Twin, ProbeItem } from "./patterns";
import {
  type CogStore, type Channel, type Due,
  dues, nextInduction, weakest, weakestChannel, skill,
} from "./cognitive-model";
import { dueCards, type MyCard } from "./cards";

export const SESSION_MINUTES = 15;

export type Fmt = "listen-meaning" | "read-meaning" | "sounds-right" | "anticipate" | "transform" | "produce" | "free-produce";

export type ReactItem = {
  patternId: string;
  channel: Channel;
  fmt: Fmt;
  pair?: Lite;
  corrupt?: Corrupt;
  useBad?: boolean; // sounds-right: show the corrupted or the authentic form
  twin?: Twin;
};

export type Block =
  | { type: "react"; items: ReactItem[] }
  | { type: "induction"; meta: PatternMeta; flood: Lite[]; probes: ProbeItem[] }
  | { type: "generate"; items: ReactItem[] }
  | { type: "cards"; cards: MyCard[] };

export type BlockRequest = { type: Block["type"]; patternIds: string[] };

/** What comes next, given elapsed time and what already ran. */
export function planNextBlock(
  cog: CogStore,
  metas: PatternMeta[],
  ran: { react: number; induction: number; generate: number; cards: number },
  elapsedMin: number
): BlockRequest | null {
  const due = dues(cog);
  if (ran.react === 0 && due.length > 0)
    return { type: "react", patternIds: [...new Set(due.slice(0, 10).map((d) => d.patternId))] };

  // le deck personnel fait partie du quotidien : ses cartes dues passent ici
  if (ran.cards === 0 && dueCards().length > 0) return { type: "cards", patternIds: [] };

  if (ran.induction === 0) {
    const next = nextInduction(cog, metas);
    if (next) return { type: "induction", patternIds: [next.id] };
    const weak = weakest(cog, metas, 2);
    if (weak.length) return { type: "react", patternIds: weak.map((m) => m.id) };
  }

  if (ran.generate === 0) {
    const producible = metas
      .filter((m) => (cog.patterns[m.id]?.exposure ?? 0) >= 4)
      .sort((a, b) => a.order - b.order);
    if (producible.length)
      return { type: "generate", patternIds: producible.slice(-2).map((m) => m.id) };
  }

  // time left → keep going: next induction, else more reactivation
  if (elapsedMin < SESSION_MINUTES) {
    const next = nextInduction(cog, metas);
    if (next) return { type: "induction", patternIds: [next.id] };
    if (due.length) return { type: "react", patternIds: [...new Set(due.slice(0, 6).map((d) => d.patternId))] };
    const weak = weakest(cog, metas, 2);
    if (weak.length) return { type: "react", patternIds: weak.map((m) => m.id) };
  }
  return null;
}

/** Pick the format that targets a channel, given available material. */
function itemFor(
  patternId: string,
  channel: Channel,
  meta: PatternMeta,
  mat: PatternMaterial,
  used: Set<number>,
  seen: Set<number>,
  salt: number
): ReactItem | null {
  const fresh = (arr: Lite[]) => arr.find((p) => !used.has(p.id) && !seen.has(p.id)) || arr.find((p) => !used.has(p.id));
  const pool = [...mat.extra, ...mat.probes, ...mat.flood];

  if (channel === "produce") {
    const twin = mat.twins[salt % Math.max(1, mat.twins.length)];
    if (twin && !used.has(twin.marked.id)) {
      used.add(twin.marked.id);
      return { patternId, channel, fmt: "transform", twin };
    }
    const p = fresh(pool.filter((x) => x.w <= 6));
    if (!p) return null;
    used.add(p.id);
    return { patternId, channel, fmt: "produce", pair: p };
  }
  if (channel === "predict") {
    const p = fresh(pool.filter((x) => x.w >= 3));
    if (!p) return null;
    used.add(p.id);
    return { patternId, channel, fmt: "anticipate", pair: p };
  }
  if (channel === "recogText") {
    const c = mat.corrupts[salt % Math.max(1, mat.corrupts.length)];
    if (c && !used.has(c.id)) {
      used.add(c.id);
      return { patternId, channel, fmt: "sounds-right", corrupt: c, useBad: salt % 2 === 0 };
    }
    const p = fresh(pool);
    if (!p) return null;
    used.add(p.id);
    return { patternId, channel, fmt: "read-meaning", pair: p };
  }
  // recogAudio
  const p = fresh(pool.filter((x) => x.audio)) || fresh(pool);
  if (!p) return null;
  used.add(p.id);
  return { patternId, channel, fmt: p.audio ? "listen-meaning" : "read-meaning", pair: p };
}

/** Build the réactivation block: due (pattern, channel) pairs → items. */
export function buildReactBlock(
  cog: CogStore,
  metasById: Record<string, PatternMeta>,
  materials: Record<string, PatternMaterial>,
  max = 8
): Block {
  const due = dues(cog).filter((d) => materials[d.patternId]);
  const items: ReactItem[] = [];
  const used = new Set<number>();
  const perPattern: Record<string, number> = {};
  let salt = new Date().getDate();

  const pickList: Due[] = due.length
    ? due
    : Object.keys(materials).map((pid) => ({
        patternId: pid,
        channel: weakestChannel(skill(cog, pid)),
        overdueMs: 0,
        state: undefined as never,
      }));

  for (const d of pickList) {
    if (items.length >= max) break;
    if ((perPattern[d.patternId] ?? 0) >= 3) continue;
    const meta = metasById[d.patternId];
    const mat = materials[d.patternId];
    if (!meta || !mat) continue;
    const seen = new Set(skill(cog, d.patternId).seenIds);
    const item = itemFor(d.patternId, d.channel, meta, mat, used, seen, salt++);
    if (item) {
      items.push(item);
      perPattern[d.patternId] = (perPattern[d.patternId] ?? 0) + 1;
    }
  }
  // never two identical formats in a row when avoidable
  for (let i = 1; i < items.length; i++) {
    if (items[i].fmt === items[i - 1].fmt) {
      const j = items.findIndex((it, k) => k > i && it.fmt !== items[i - 1].fmt);
      if (j > i) [items[i], items[j]] = [items[j], items[i]];
    }
  }
  return { type: "react", items };
}

/** Build the génération block: produce channel on the strongest patterns. */
export function buildGenerateBlock(
  cog: CogStore,
  metasById: Record<string, PatternMeta>,
  materials: Record<string, PatternMaterial>,
  n = 3
): Block {
  const items: ReactItem[] = [];
  const used = new Set<number>();
  let salt = new Date().getDate() + 3;
  const pids = Object.keys(materials);
  for (const pid of pids) {
    if (items.length >= n - 1) break;
    const seen = new Set(skill(cog, pid).seenIds);
    const item = itemFor(pid, "produce", metasById[pid], materials[pid], used, seen, salt++);
    if (item) items.push(item);
  }
  // le sommet : production LIBRE (sa propre phrase, corrigée par Idir)
  if (pids.length) items.push({ patternId: pids[pids.length - 1], channel: "produce", fmt: "free-produce" });
  return { type: "generate", items };
}

/** Grade an auto-checked result (self-graded formats pass the grade through). */
export function autoGrade(ok: boolean, ms: number): 0 | 2 | 3 {
  if (!ok) return 0;
  return ms > 0 && ms < 7000 ? 3 : 2;
}
