/**
 * Build a STRUCTURED, pedagogically-ordered Kabyle curriculum from real data.
 * Method (legos): pieces (frequency-ranked vocab + Dallet meanings) → patterns
 * (real grammatical structures) → construction (build/understand real sentences).
 * Everything is grounded in Tatoeba (sentences+audio) and Dallet (meanings).
 *
 * Output: lib/data/kabyle-content.ts  (typed `kabyleUnits`)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const pairs = JSON.parse(fs.readFileSync(path.join(ROOT, "data/pairs.json"), "utf8"));
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, "data/dict.json"), "utf8"));

// ---------- helpers ----------
const fold = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ɣ/g, "g").replace(/ɛ/g, "a").replace(/ḥ/g, "h").replace(/ṣ/g, "s")
    .replace(/ṭ/g, "t").replace(/ḍ/g, "d").replace(/ẓ/g, "z").replace(/ṛ/g, "r")
    .replace(/č/g, "c").replace(/ǧ/g, "g");

const tok = (s) =>
  s.toLowerCase().split(/[\s.,!?;:«»"()…]+/).map((w) => w.replace(/^[-']+|[-']+$/g, "")).filter(Boolean);

const STOP_NAMES = new Set(["tom","mary","marie","john","jean","bob","alice","ken","mike","tom's","boston","tatoeba"]);
const FUNCTION = new Set(["ad","d","i","ur","ara","n","deg","di","ɣer","s","ɣef","akken","kan","akk","ma","seg","am","mi","la","da","aya","akka","win","wa","wi","ay","a","ed","yer","ula","neɣ","neg","ne","g","t","tt","k","m","iw","ik","is","nneɣ"," that"]);

// ---------- Latin (Kabyle orthography) -> Tifinagh ----------
const TIF = {
  a:"ⴰ", b:"ⴱ", c:"ⵛ", "č":"ⵞ", d:"ⴷ", "ḍ":"ⴹ", e:"ⴻ", "ɛ":"ⵄ", f:"ⴼ", g:"ⴳ",
  "ǧ":"ⴵ", "ɣ":"ⵖ", h:"ⵀ", "ḥ":"ⵃ", i:"ⵉ", j:"ⵊ", k:"ⴽ", l:"ⵍ", m:"ⵎ", n:"ⵏ",
  o:"ⵄ", p:"ⵒ", q:"ⵇ", r:"ⵔ", "ṛ":"ⵕ", s:"ⵙ", "ṣ":"ⵚ", t:"ⵜ", "ṭ":"ⵟ", u:"ⵓ",
  v:"ⵠ", w:"ⵡ", x:"ⵅ", y:"ⵢ", z:"ⵣ", "ẓ":"ⵥ",
};
function tifinagh(latin) {
  return [...latin.toLowerCase()].map((ch) => TIF[ch] ?? (ch === " " ? " " : "")).join("");
}

// ---------- frequency ----------
const freq = new Map();
for (const r of pairs) for (const w of tok(r.kab)) freq.set(w, (freq.get(w) || 0) + 1);

// ---------- Dallet meaning lookup (folded form -> short FR) ----------
const meaning = new Map();
for (const e of dict) {
  const fr = e.m?.[0]?.fr?.[0];
  if (!fr) continue;
  let short = fr.replace(/^[*\s]+/, "").split(/[.;/?]/)[0].trim();
  if (short.length > 46) short = short.slice(0, 44).trim() + "…";
  for (const f of e.forms) {
    const k = fold(f);
    if (!meaning.has(k) && short) meaning.set(k, short);
  }
}

// best real example sentence per word — filled in ONE pass below (see buildExamples)
const BEST = new Map(); // folded word -> {kab, fr, audioId}
function example(word) {
  return BEST.get(fold(word)) || null;
}

// sentences matching a predicate (for patterns); audio preferred, short
function findSentences(pred, n) {
  const out = [];
  for (const r of pairs) {
    if (r.w < 2 || r.w > 8) continue;
    if (!r.audio) continue;
    if (pred(r.kab)) out.push(r);
    if (out.length > n * 6) break;
  }
  out.sort((a, b) => a.w - b.w);
  return out.slice(0, n).map((r) => ({ kab: r.kab, fr: r.fr, audioId: r.id }));
}

// ---------- question builders ----------
function mcWord(card, pool) {
  const distract = [];
  const seen = new Set([card.fr]);
  for (const c of pool) {
    if (distract.length >= 3) break;
    if (!seen.has(c.fr)) { distract.push(c.fr); seen.add(c.fr); }
  }
  const opts = shuffle([card.fr, ...distract]);
  return {
    type: "multiple-choice",
    prompt: card.kab,
    latin: card.kab,
    audioId: card.ex?.audioId ?? null,
    options: opts,
    correctAnswer: opts.indexOf(card.fr),
  };
}
function listening(ex, frPool) {
  const distract = [...new Set(frPool.filter((f) => f && f !== ex.fr))].slice(0, 3);
  const opts = shuffle([ex.fr, ...distract]);
  return {
    type: "listening",
    prompt: "Qu'entends-tu ?",
    latin: ex.kab,
    audioId: ex.audioId,
    options: opts,
    correctAnswer: opts.indexOf(ex.fr),
  };
}
function order(ex) {
  return { type: "order-words", prompt: ex.fr, latin: ex.kab, correctAnswer: ex.kab, audioId: ex.audioId };
}
// reverse MC: show French, pick the Kabyle word
function mcKab(card, kabPool) {
  const distract = [...new Set(kabPool.filter((k) => k !== card.kab))].slice(0, 3);
  const opts = shuffle([card.kab, ...distract]);
  return { type: "mc-kab", prompt: card.fr, options: opts, correctAnswer: opts.indexOf(card.kab) };
}
// cloze: a real sentence with the target word blanked
function fill(card, kabPool) {
  const ex = card.ex;
  if (!ex) return null;
  const toks = ex.kab.split(/\s+/);
  const idx = toks.findIndex((t) => fold(t.replace(/[.,!?;:«»]/g, "")) === fold(card.kab));
  if (idx < 0) return null;
  const display = toks.map((t, i) => (i === idx ? "____" : t)).join(" ");
  const distract = [...new Set(kabPool.filter((k) => k !== card.kab))].slice(0, 3);
  const opts = shuffle([card.kab, ...distract]);
  return { type: "fill", prompt: display, latin: ex.kab, fr: ex.fr, options: opts, correctAnswer: opts.indexOf(card.kab), audioId: ex.audioId };
}
// match pairs
function matchSet(cards) {
  return { type: "match", prompt: "Associe chaque mot à sa traduction", correctAnswer: 0, pairs: cards.map((c) => ({ kab: c.kab, fr: c.fr })) };
}
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(((i * 9301 + 49297) % 233280) / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- build vocab cards from a word list ----------
function cardsFor(words, limit) {
  const cards = [];
  for (const w of words) {
    if (cards.length >= limit) break;
    const fr = meaning.get(fold(w));
    if (!fr) continue;
    const ex = example(w);
    if (!ex) continue;
    cards.push({ kab: w, tifinagh: tifinagh(w), fr, ex });
  }
  return cards;
}

// frequency-ranked content words (exclude function words, names, require Dallet meaning)
const contentWords = [...freq.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([w]) => w)
  .filter((w) => w.length >= 2 && !FUNCTION.has(w) && !STOP_NAMES.has(w) && meaning.has(fold(w)));

// ---------- THEMES (curated kab keywords, matched against corpus + Dallet) ----------
const THEMES = [
  { id: "famille", title: "Famille", icon: "👪", color: "#C8963E",
    words: ["yemma","baba","gma","weltma","mmi","yelli","jeddi","setti","argaz","tameṭṭut","aqcic","taqcict","arrac","tarwa","axxam"] },
  { id: "quotidien", title: "Le quotidien", icon: "🌅", color: "#A67B2E",
    words: ["ass","iḍ","tameddit","ṣṣbeḥ","ad ruḥeɣ","aɣrum","aman","lqahwa","imensi","imekli","amkan","axxam","tikli","aẓru"] },
  { id: "nourriture", title: "Manger & boire", icon: "🫒", color: "#5B9A6F",
    words: ["aɣrum","aman","lqahwa","tibḥirt","zzit","aksum","lftat","tameṭṭut","seksu","aɣi","tament","aẓidan","leqhwa"] },
  { id: "sentiments", title: "Sentiments & avis", icon: "💛", color: "#D4735E",
    words: ["lferḥ","leḥzen","tayri","aɛeggu","ugadeɣ","bɣiɣ","ḥemmleɣ","ttxil","cukkeɣ","ɣileɣ","tidet","lekdeb","yelha"] },
  { id: "societe", title: "Société", icon: "🏘️", color: "#4A9ECF",
    words: ["taddart","tamurt","imdanen","agdud","amdan"," axxam","tajmaɛt","lxedma","idrimen","tilelli"," amɣar","tikli"] },
  { id: "politique", title: "Politique & débat", icon: "🗣️", color: "#8B7355",
    words: ["tamurt","tilelli","tasertit","agdud","azarug","amḍan","tugdut","tigduda","aɣref","amennuɣ","tidet","lḥeqq"," amkan"] },
];

// ---------- build best example per needed word (single pass) ----------
{
  const needed = new Set();
  for (const w of contentWords.slice(0, 200)) needed.add(fold(w));
  for (const th of THEMES) for (const w of th.words) needed.add(fold(w.trim()));
  const bestScore = new Map();
  for (const r of pairs) {
    if (r.w < 2 || r.w > 9) continue;
    const seen = new Set();
    for (const t of tok(r.kab)) {
      const f = fold(t);
      if (!needed.has(f) || seen.has(f)) continue;
      seen.add(f);
      const score = (r.audio ? 0 : 100) + r.w;
      if (!bestScore.has(f) || score < bestScore.get(f)) {
        bestScore.set(f, score);
        BEST.set(f, { kab: r.kab, fr: r.fr, audioId: r.audio ? r.id : null });
      }
    }
  }
}

// ---------- assemble units ----------
const units = [];
let order_i = 0;
const pad = (n) => String(n).padStart(2, "0");

function vocabLessonsFromCards(cardsAll, unitId, lessonSize) {
  const lessons = [];
  for (let i = 0; i < cardsAll.length; i += lessonSize) {
    const cards = cardsAll.slice(i, i + lessonSize);
    if (cards.length < 3) break;
    const li = lessons.length + 1;
    const frPool = cardsAll.map((c) => c.ex?.fr).filter(Boolean);
    const kabPool = cardsAll.map((c) => c.kab);
    // one bucket per FORMAT so each lesson uses the MAX variety of formats
    const buckets = [
      cards.map((c) => mcWord(c, cardsAll)),                              // KAB → FR
      cards.map((c) => mcKab(c, kabPool)),                               // FR → KAB
      cards.filter((c) => c.ex?.audioId).map((c) => listening(c.ex, frPool)), // écoute
      cards.map((c) => fill(c, kabPool)).filter(Boolean),               // texte à trou
      cards.map((c) => order(c.ex)),                                     // reconstruction
    ];
    // round-robin: alternate formats so every type appears, well distributed
    const questions = [];
    for (let k = 0; questions.length < 20; k++) {
      let any = false;
      for (const b of buckets) {
        if (b[k]) { questions.push(b[k]); any = true; }
      }
      if (!any) break;
    }
    questions.unshift(matchSet(cards.slice(0, Math.min(5, cards.length)))); // associations en ouverture
    lessons.push({
      id: `${unitId}-l${li}`,
      title: `Mots ${i + 1}–${i + cards.length}`,
      xpReward: 15,
      cards,
      questions,
    });
  }
  return lessons;
}

// UNIT 1-3: core frequency vocab ("les briques")
const CORE_TITLES = ["Les 1res briques", "Briques essentielles", "Briques courantes"];
const coreCards = cardsFor(contentWords, 72);
{
  const perUnit = 24;
  for (let u = 0; u < 3; u++) {
    const slice = coreCards.slice(u * perUnit, (u + 1) * perUnit);
    const id = `core${u + 1}`;
    units.push({
      id, order: pad(++order_i), kind: "vocab", icon: "🧩", color: "#C8963E",
      title: CORE_TITLES[u],
      tifinagh: tifinagh("awal"),
      description: "Les mots les plus fréquents du kabyle — ceux qui servent partout.",
      lessons: vocabLessonsFromCards(slice, id, 8),
    });
  }
}

// PATTERN units ("les patterns")
const PATTERNS = [
  { id: "p-d", title: "Pattern : « D… » = c'est", icon: "🔗", explain: "« D » relie : D + nom/pronom = « c'est… ». Ex. D argaz = C'est un homme.",
    pred: (s) => /^d\s/i.test(s) },
  { id: "p-neg", title: "Pattern : la négation « ur … ara »", icon: "🚫", explain: "On encadre le verbe : ur + verbe + ara = ne… pas. Ex. Ur ssineɣ ara = Je ne sais pas.",
    pred: (s) => /\bur\b/i.test(s) && /\bara\b/i.test(s) },
  { id: "p-fut", title: "Pattern : le futur « ad + verbe »", icon: "⏩", explain: "« ad » devant le verbe marque le futur/l'intention. Ex. Ad ruḥeɣ = Je vais partir.",
    pred: (s) => /^ad\s/i.test(s) },
  { id: "p-q", title: "Pattern : poser des questions", icon: "❓", explain: "Acu (quoi), Anwa (qui), Amek (comment), Ansi (d'où), Melmi (quand), Ayɣer (pourquoi).",
    pred: (s) => /^(acu|anwa|anta|amek|ansi|melmi|ayɣer|acḥal)\b/i.test(s) },
  { id: "p-want", title: "Pattern : vouloir / devoir", icon: "🎯", explain: "bɣiɣ ad… = je veux… · ilaq ad… = il faut… Ex. Bɣiɣ ad lemdeɣ = Je veux apprendre.",
    pred: (s) => /\b(bɣiɣ|ilaq|yebɣa|tebɣiḍ)\b/i.test(s) },
];
for (const p of PATTERNS) {
  const ex = findSentences(p.pred, 8);
  if (ex.length < 4) continue;
  const frPool = ex.map((e) => e.fr);
  const cardsP = ex.map((e) => ({ kab: e.kab, fr: e.fr, ex: e }));
  const kabPoolP = cardsP.map((c) => c.kab);
  const buckets = [
    cardsP.map((c) => mcWord(c, cardsP)),                          // phrase → sens
    cardsP.map((c) => mcKab(c, kabPoolP)),                         // sens → phrase
    ex.filter((e) => e.audioId).map((e) => listening(e, frPool)),  // écoute
    ex.map((e) => order(e)),                                       // reconstruction
  ];
  const questions = [];
  for (let k = 0; questions.length < 14; k++) {
    let any = false;
    for (const b of buckets) { if (b[k]) { questions.push(b[k]); any = true; } }
    if (!any) break;
  }
  units.push({
    id: p.id, order: pad(++order_i), kind: "pattern", icon: p.icon, color: "#4A9ECF",
    title: p.title, tifinagh: "", description: p.explain,
    lessons: [{
      id: `${p.id}-l1`, title: "Reconnaître le pattern", xpReward: 20,
      explain: p.explain,
      cards: ex.slice(0, 6).map((e) => ({ kab: e.kab, tifinagh: tifinagh(e.kab.split(" ")[0]), fr: e.fr, ex: e })),
      questions,
    }],
  });
}

// THEME units ("construction" par thème)
for (const th of THEMES) {
  const cards = cardsFor([...new Set(th.words)].filter((w) => !w.includes(" ")), 16);
  if (cards.length < 6) continue;
  units.push({
    id: th.id, order: pad(++order_i), kind: "theme", icon: th.icon, color: th.color,
    title: th.title, tifinagh: tifinagh(th.title.split(" ")[0].toLowerCase()),
    description: `Construis des phrases autour du thème : ${th.title.toLowerCase()}.`,
    lessons: vocabLessonsFromCards(cards, th.id, 8),
  });
}

// ---------- real Tamazight (tifinagh) icons instead of emojis ----------
const TIF_ICONS = ["ⴰ", "ⵣ", "ⵜ", "ⵉ", "ⵎ", "ⵏ", "ⵍ", "ⵔ", "ⴳ", "ⴷ", "ⵙ", "ⴽ", "ⵓ", "ⵇ"];
units.forEach((u, i) => {
  u.icon = TIF_ICONS[i % TIF_ICONS.length];
});

// ---------- write ----------
const header = `// AUTO-GENERATED by scripts/build-curriculum.mjs — do not edit by hand.
// Grounded in Tatoeba (sentences + native audio) and the Dallet dictionary.
export type QType = "multiple-choice" | "mc-kab" | "listening" | "order-words" | "fill" | "match";
export type Question = {
  type: QType; prompt: string; latin?: string; fr?: string; tifinagh?: string;
  options?: string[]; correctAnswer: number | string; acceptableAnswers?: string[];
  hint?: string; audioId?: number | null; pairs?: { kab: string; fr: string }[];
};
export type Card = { kab: string; tifinagh: string; fr: string; ex: { kab: string; fr: string; audioId: number | null } | null };
export type Lesson = { id: string; title: string; xpReward: number; explain?: string; cards: Card[]; questions: Question[] };
export type Unit = { id: string; order: string; kind: "vocab" | "pattern" | "theme"; icon: string; color: string; title: string; tifinagh: string; description: string; lessons: Lesson[] };

export const kabyleUnits: Unit[] = ${JSON.stringify(units, null, 1)};
`;
fs.mkdirSync(path.join(ROOT, "lib/data"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "lib/data/kabyle-content.ts"), header);

const lc = units.reduce((a, u) => a + u.lessons.length, 0);
const qc = units.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.questions.length, 0), 0);
console.log(`units: ${units.length} | lessons: ${lc} | questions: ${qc}`);
console.log(units.map((u) => `${u.order} ${u.title} (${u.lessons.length} leçons)`).join("\n"));
