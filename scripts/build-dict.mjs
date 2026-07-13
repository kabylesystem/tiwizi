// Flatten the DigitizedDallet dictionary into a flat, searchable JSON.
// Input (in WORK dir): dallet.json  (from github.com/sferhah/DigitizedDallet, MIT)
// Output (in data/): dict.json
import fs from "node:fs";
import path from "node:path";

const WORK = process.env.WORK || "/tmp/tiwizi-src";
const OUT = path.join(process.cwd(), "data");
const d = JSON.parse(fs.readFileSync(path.join(WORK, "dallet.json"), "utf8"));

const clean = (s) =>
  (s || "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\{\{([^}]*)\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const entries = [];
function pushArticle(a, root) {
  const forms = [a.name, ...(a.alternativeForms || []).map((f) => f.name)].filter(Boolean);
  const meanings = (a.meanings || [])
    .map((m) => ({
      fr: (m.translations || []).map(clean).filter(Boolean),
      note: clean(m.note),
      ex: (m.examples || [])
        .map((e) => ({ kab: (e.text || e.dalletText || "").trim(), fr: clean(e.translation) }))
        .filter((e) => e.kab && e.fr),
    }))
    .filter((m) => m.fr.length || m.ex.length);
  if (forms.length && meanings.length)
    entries.push({ w: a.name, forms: [...new Set(forms)], root, note: clean(a.note), m: meanings });
  (a.articles || []).forEach((sub) => pushArticle(sub, root));
}

for (const L of d.letters)
  for (const r of L.roots || []) (r.articles || []).forEach((a) => pushArticle(a, r.name));

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "dict.json"), JSON.stringify(entries));
console.log(`dict entries: ${entries.length}`);
