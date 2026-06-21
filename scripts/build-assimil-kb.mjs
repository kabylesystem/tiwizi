// Split the OCR'd Assimil "Le Kabyle de poche" into a retrievable knowledge base
// for the tutor. Source: data/assimil_full.txt (OCR via tesseract, 112 pages).
// Output: data/assimil-kb.json  [{title, text}] (line-chunked to keep kab=fr pairs).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "data", "assimil_full.txt");
const OUT = path.join(ROOT, "data", "assimil-kb.json");

const lines = fs.readFileSync(SRC, "utf8").split("\n");

const BAD = /BLABLA|ASSIMIL|^FRANCE$|SOMMAI|CHOSE|^LA MÉTHODE|EDITIONS|^E$|CEDEX/;
const isHeading = (l) => {
  const t = l.trim();
  return t.length >= 6 && t.length <= 44 && /^[A-ZÉÈÀÇÏÎ'’ -]+$/.test(t) && !BAD.test(t);
};

const sections = [];
let cur = { title: "Introduction", lines: [] };
for (const l of lines) {
  if (isHeading(l)) {
    if (cur.lines.length) sections.push(cur);
    cur = { title: l.trim(), lines: [] };
  } else {
    cur.lines.push(l);
  }
}
if (cur.lines.length) sections.push(cur);

const clean = (s) => s.replace(/[ \t]+/g, " ").trim();
const kb = [];
for (const sec of sections) {
  const L = sec.lines.map(clean).filter((l) => l.length > 1 && !BAD.test(l));
  if (L.join(" ").split(/\s+/).length < 10) continue;
  for (let i = 0; i < L.length; i += 12) {
    const chunk = L.slice(i, i + 15).join("\n").trim();
    if (chunk.split(/\s+/).length >= 6) kb.push({ title: sec.title, text: chunk });
  }
}

fs.writeFileSync(OUT, JSON.stringify(kb));
const titles = [...new Set(kb.map((x) => x.title))];
console.log(`assimil-kb: ${kb.length} passages | ${titles.length} sections`);
console.log(titles.slice(0, 40).join(" · "));
