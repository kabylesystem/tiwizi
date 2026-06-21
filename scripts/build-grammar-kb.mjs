// Ingest naly's Kabyle Anki grammar decks into a knowledge base for the tutor.
// Source: his Anki CSVs (Front,Back) covering système verbal, présentatifs,
// prépositions, démonstratifs, comparatif, nombres, questions, etc.
// Output: data/grammar-kb.json  [{topic, q, a}]
import fs from "node:fs";
import path from "node:path";

const SRC = process.env.ANKI_DIR ||
  "/home/user/Downloads/mac os/mac for framework/anki/comptia network";
const OUT = path.join(process.cwd(), "data", "grammar-kb.json");

function parseCSV(text) {
  const rows = [];
  let i = 0, field = "", row = [], inq = false;
  while (i < text.length) {
    const c = text[i];
    if (inq) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inq = false; }
      else field += c;
    } else {
      if (c === '"') inq = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else field += c;
    }
    i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const topicFromName = (f) =>
  f.replace(/\.csv$/, "").replace(/_FR_front|_anki|_structure|kabyle_?/gi, "").replace(/[_-]+/g, " ").trim() || "grammaire";

const files = fs.readdirSync(SRC).filter((f) => /\.csv$/i.test(f) && (/kabyle/i.test(f) || /presentatif/i.test(f)));
const kb = [];
for (const f of files) {
  const topic = topicFromName(f);
  const rows = parseCSV(fs.readFileSync(path.join(SRC, f), "utf8"));
  for (let r = 0; r < rows.length; r++) {
    const [q, a] = rows[r];
    if (!q || !a) continue;
    if (/^front$/i.test(q.trim()) && /^back$/i.test((a || "").trim())) continue; // header
    kb.push({ topic, q: q.trim(), a: a.trim() });
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(kb));
const topics = [...new Set(kb.map((x) => x.topic))];
console.log(`grammar-kb: ${kb.length} fiches | ${topics.length} thèmes`);
console.log(topics.join(" · "));
