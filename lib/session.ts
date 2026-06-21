import type { Grade, Store } from "./srs";

export type Card = {
  id: number;
  kab: string;
  fr: string;
  audio: boolean;
  w: number;
  c: number;
};

export type StepKind = "flash" | "reconstruct" | "dictation";
export type Step = { kind: StepKind; card: Card };

export function tokens(kab: string): string[] {
  return kab.trim().split(/\s+/);
}

/** Reconstruct/dictation need enough movable pieces to be meaningful. */
function buildable(c: Card): boolean {
  const n = tokens(c.kab).length;
  return n >= 3 && n <= 8;
}

/**
 * A ~20-minute mixed session:
 *  - new cards are introduced as a flashcard, then re-tested as "reconstruct"
 *  - due review cards become dictation (if audio + buildable) / reconstruct / flash
 */
export function buildSession(
  cards: Card[],
  store: Store,
  newLimit: number,
  target = 22
): Step[] {
  const now = Date.now();
  const due = cards.filter((c) => store.cards[c.id] && store.cards[c.id].due <= now);
  const fresh = cards.filter((c) => !store.cards[c.id]).slice(0, newLimit);

  const intro: Step[] = [];
  const apply: Step[] = [];
  for (const c of fresh) {
    intro.push({ kind: "flash", card: c });
    if (buildable(c)) apply.push({ kind: "reconstruct", card: c });
  }

  const reviews: Step[] = due.map((c) => {
    const reps = store.cards[c.id]?.reps ?? 0;
    if (c.audio && buildable(c) && reps >= 2) return { kind: "dictation", card: c };
    if (buildable(c) && reps >= 1) return { kind: "reconstruct", card: c };
    return { kind: "flash", card: c };
  });

  // interleave: introductions up front, then apply-steps woven with reviews
  const tail: Step[] = [];
  let a = 0;
  let r = 0;
  while (a < apply.length || r < reviews.length) {
    if (r < reviews.length) tail.push(reviews[r++]);
    if (a < apply.length) tail.push(apply[a++]);
  }

  return [...intro, ...tail].slice(0, target);
}

/** Map an exercise outcome to an SRS grade. */
export function outcomeGrade(correct: boolean, usedHelp: boolean): Grade {
  if (!correct) return 0;
  return usedHelp ? 1 : 2;
}
