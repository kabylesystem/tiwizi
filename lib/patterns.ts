// Shared types for the pattern graph (data/patterns.json) + pure helpers.
// Client-safe: no fs here.

export type PatternProbe = { q: string; options: string[]; answer: number };

export type PatternMeta = {
  id: string;
  order: number;
  family: string;
  name: string;
  schema: string;
  note: string;
  probe: PatternProbe;
  contrastsWith: string[];
  requires: string[];
  mask: string; // regex source (unicode word boundaries)
  maskFlags: string;
  /** bonne réponse du probe pour une phrase PIÈGE (pattern concurrent / neutre) */
  foilAnswer: number;
  counts: { total: number; audio: number; twins: number; corrupts: number };
};

/** Un item de probe : phrase réelle ou piège, avec SA bonne réponse. */
export type ProbeItem = { pair: Lite; answer: number; foil: boolean };

export type Lite = { id: number; kab: string; fr: string; audio: boolean; w: number };
export type Corrupt = { id: number; good: string; bad: string; fr: string; audio: boolean; op: string };
export type Twin = { plain: Lite; marked: Lite };

export type PatternMaterial = {
  flood: Lite[];
  probes: Lite[];
  extra: Lite[];
  foils: Lite[];
  corrupts: Corrupt[];
  twins: Twin[];
};

/** Split a sentence into visible/hidden segments for Anticipate. */
export function maskSegments(
  kab: string,
  maskSrc: string,
  maskFlags: string
): { text: string; hidden: boolean }[] {
  let re: RegExp;
  try {
    re = new RegExp(maskSrc, maskFlags.includes("g") ? maskFlags : maskFlags + "g");
  } catch {
    return [{ text: kab, hidden: false }];
  }
  const out: { text: string; hidden: boolean }[] = [];
  let last = 0;
  for (const m of kab.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: kab.slice(last, i), hidden: false });
    out.push({ text: m[0], hidden: true });
    last = i + m[0].length;
  }
  if (last < kab.length) out.push({ text: kab.slice(last), hidden: false });
  return out.some((s) => s.hidden) ? out : [{ text: kab, hidden: false }];
}

/** Transform instruction shown to the user, per pattern. */
export const TRANSFORM_LABEL: Record<string, string> = {
  "neg-ur-ara": "Passe-la à la forme négative",
  "fut-ad": "Projette-la dans le futur (avec « ad »)",
};
