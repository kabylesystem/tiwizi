// Build kab↔fr sentence pairs from Tatoeba exports.
// Inputs (in WORK dir): kab_sentences.tsv, fra_sentences.tsv, links.csv, sentences_with_audio.csv
// Outputs (in data/): pairs.json, deck.json
import fs from "node:fs";
import path from "node:path";

const WORK = process.env.WORK || "/tmp/awal-src";
const OUT = path.join(process.cwd(), "data");
const rl = (f) => fs.readFileSync(path.join(WORK, f), "utf8").split("\n");

const kab = new Map();
for (const line of rl("kab_sentences.tsv")) {
  const i = line.indexOf("\t");
  if (i < 0) continue;
  const rest = line.slice(i + 1);
  const j = rest.indexOf("\t");
  if (j < 0) continue;
  kab.set(line.slice(0, i), rest.slice(j + 1));
}

const fra = new Map();
for (const line of rl("fra_sentences.tsv")) {
  const i = line.indexOf("\t");
  if (i < 0) continue;
  const rest = line.slice(i + 1);
  const j = rest.indexOf("\t");
  if (j < 0) continue;
  fra.set(line.slice(0, i), rest.slice(j + 1));
}

const audio = new Set();
for (const line of rl("sentences_with_audio.csv")) {
  const i = line.indexOf("\t");
  if (i >= 0) audio.add(line.slice(0, i));
}

const pairs = new Map();
for (const line of rl("links.csv")) {
  const i = line.indexOf("\t");
  if (i < 0) continue;
  const a = line.slice(0, i);
  const b = line.slice(i + 1);
  if (kab.has(a) && fra.has(b) && !pairs.has(a)) pairs.set(a, b);
}

const seen = new Set();
const rows = [];
for (const [kid, fid] of pairs) {
  const kt = kab.get(kid).trim();
  if (!kt || seen.has(kt)) continue;
  seen.add(kt);
  rows.push({
    id: +kid,
    kab: kt,
    fr: fra.get(fid).trim(),
    audio: audio.has(kid),
    w: kt.split(/\s+/).length,
    c: kt.length,
  });
}
rows.sort((a, b) => b.audio - a.audio || a.w - b.w || a.c - b.c);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "pairs.json"), JSON.stringify(rows));

// graded deck: audio sentences, round-robin across lengths 2..8 so every
// session mixes short cards and longer ones (needed for reconstruct/dictation)
const buckets = {};
for (const r of rows)
  if (r.audio && r.w >= 2 && r.w <= 8) (buckets[r.w] ??= []).push(r);
const CAP = 280;
const deck = [];
for (let k = 0; k < CAP; k++)
  for (let w = 2; w <= 8; w++) if (buckets[w]?.[k]) deck.push(buckets[w][k]);
fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck));
console.log(`pairs: ${rows.length} | audio: ${rows.filter((r) => r.audio).length} | deck: ${deck.length}`);
