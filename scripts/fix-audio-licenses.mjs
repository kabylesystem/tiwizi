// Repair pass: Tatoeba serves audio ONLY when the audio has a license
// (empty/\N license → 403 on audio.tatoeba.org). Re-flag pairs.json,
// rebuild deck.json, then re-run build-patterns.mjs.
// Input: /tmp/tiwizi-src/sentences_with_audio.csv (downloads.tatoeba.org export)
import fs from "node:fs";
import path from "node:path";

const WORK = process.env.WORK || "/tmp/tiwizi-src";
const OUT = path.join(process.cwd(), "data");

const licensed = new Set();
for (const line of fs.readFileSync(path.join(WORK, "sentences_with_audio.csv"), "utf8").split("\n")) {
  const c = line.split("\t");
  if (c.length >= 4 && c[3] && c[3] !== "\\N") licensed.add(c[0]);
}
console.log(`audios sous licence distribuable: ${licensed.size}`);

const pairs = JSON.parse(fs.readFileSync(path.join(OUT, "pairs.json"), "utf8"));
let dropped = 0;
for (const p of pairs) {
  const ok = licensed.has(String(p.id));
  if (p.audio && !ok) dropped++;
  p.audio = ok;
}
pairs.sort((a, b) => b.audio - a.audio || a.w - b.w || a.c - b.c);
fs.writeFileSync(path.join(OUT, "pairs.json"), JSON.stringify(pairs));
console.log(`pairs.json: ${pairs.filter((p) => p.audio).length} avec audio (retirés: ${dropped})`);

// graded deck (same shape as build-sentences.mjs)
const buckets = {};
for (const r of pairs) if (r.audio && r.w >= 2 && r.w <= 8) (buckets[r.w] ??= []).push(r);
const CAP = 280;
const deck = [];
for (let k = 0; k < CAP; k++) for (let w = 2; w <= 8; w++) if (buckets[w]?.[k]) deck.push(buckets[w][k]);
fs.writeFileSync(path.join(OUT, "deck.json"), JSON.stringify(deck));
console.log(`deck.json: ${deck.length}`);
