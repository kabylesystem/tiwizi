// Les verbes du quotidien avec leurs formes de personne, pour le drill de
// conjugaison des cartes. Chaque forme écrite ici n'entre dans verbs.json
// QUE si elle est attestée dans le corpus (vocab-freq) · rigueur habituelle.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "data");
const freq = JSON.parse(fs.readFileSync(path.join(OUT, "vocab-freq.json"), "utf8"));

const FOLD = { ɣ: "g", ɛ: "a", ḥ: "h", ṣ: "s", ṭ: "t", ḍ: "d", ẓ: "z", ṛ: "r", č: "c", ǧ: "g", ž: "j" };
const fold = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ɣɛḥṣṭḍẓṛčǧž]/g, (c) => FOLD[c] ?? c);
const attested = (w) => (freq[fold(w)] || 0) >= 2 || (freq[fold(w) + "-d"] || 0) >= 2;

const VERBS = [
  { kab: "bɣu", fr: "vouloir", forms: { je: "bɣiɣ", tu: "tebɣiḍ", il: "yebɣa", elle: "tebɣa", nous: "nebɣa", vous: "tebɣam", ils: "bɣan" } },
  { kab: "zmer", fr: "pouvoir", forms: { je: "zemreɣ", tu: "tzemreḍ", il: "yezmer", elle: "tezmer", nous: "nezmer", vous: "tzemrem", ils: "zemren" } },
  { kab: "ruḥ", fr: "aller, partir", forms: { je: "ruḥeɣ", tu: "truḥeḍ", il: "iruḥ", elle: "truḥ", nous: "nruḥ", vous: "truḥem", ils: "ruḥen" } },
  { kab: "ečč", fr: "manger", forms: { je: "ččiɣ", tu: "teččiḍ", il: "yečča", elle: "tečča", nous: "nečča", vous: "teččam", ils: "ččan" } },
  { kab: "sew", fr: "boire", forms: { je: "swiɣ", tu: "teswiḍ", il: "yeswa", elle: "teswa", nous: "neswa", vous: "teswam", ils: "swan" } },
  { kab: "ẓer", fr: "voir, savoir", forms: { je: "ẓriɣ", tu: "teẓriḍ", il: "yeẓra", elle: "teẓra", nous: "neẓra", vous: "teẓram", ils: "ẓran" } },
  { kab: "ini", fr: "dire", forms: { je: "nniɣ", tu: "tenniḍ", il: "yenna", elle: "tenna", nous: "nenna", vous: "tennam", ils: "nnan" } },
  { kab: "xdem", fr: "travailler, faire", forms: { je: "xedmeɣ", tu: "txedmeḍ", il: "yexdem", elle: "texdem", nous: "nexdem", vous: "txedmem", ils: "xedmen" } },
  { kab: "awi", fr: "porter, emmener", forms: { je: "wwiɣ", tu: "tewwiḍ", il: "yewwi", elle: "tewwi", nous: "newwi", vous: "tewwim", ils: "wwin" } },
  { kab: "ddu", fr: "aller, marcher", forms: { je: "dduɣ", tu: "tedduḍ", il: "yedda", elle: "tedda", nous: "nedda", vous: "teddam", ils: "ddan" } },
  { kab: "aru", fr: "écrire", forms: { je: "uriɣ", tu: "turiḍ", il: "yura", elle: "tura", nous: "nura", vous: "turam", ils: "uran" } },
  { kab: "ɣer", fr: "lire, étudier, appeler", forms: { je: "ɣriɣ", tu: "teɣriḍ", il: "yeɣra", elle: "teɣra", nous: "neɣra", vous: "teɣram", ils: "ɣran" } },
  { kab: "sel", fr: "entendre", forms: { je: "sliɣ", tu: "tesliḍ", il: "yesla", elle: "tesla", nous: "nesla", vous: "teslam", ils: "slan" } },
  { kab: "qqim", fr: "s'asseoir, rester", forms: { je: "qqimeɣ", tu: "teqqimeḍ", il: "yeqqim", elle: "teqqim", nous: "neqqim", vous: "teqqimem", ils: "qqimen" } },
  { kab: "kker", fr: "se lever", forms: { je: "kkreɣ", tu: "tekkreḍ", il: "yekker", elle: "tekker", nous: "nekker", vous: "tekkrem", ils: "kkren" } },
  { kab: "ffeɣ", fr: "sortir", forms: { je: "ffɣeɣ", tu: "teffɣeḍ", il: "yeffeɣ", elle: "teffeɣ", nous: "neffeɣ", vous: "teffɣem", ils: "ffɣen" } },
  { kab: "kcem", fr: "entrer", forms: { je: "kecmeɣ", tu: "tkecmeḍ", il: "yekcem", elle: "tekcem", nous: "nekcem", vous: "tkecmem", ils: "kecmen" } },
  { kab: "ils", fr: "être (yella)", forms: { je: "lliɣ", tu: "telliḍ", il: "yella", elle: "tella", nous: "nella", vous: "tellam", ils: "llan" } },
  { kab: "ṭṭes", fr: "dormir", forms: { je: "ṭṭseɣ", tu: "teṭṭseḍ", il: "yeṭṭes", elle: "teṭṭes", nous: "neṭṭes", vous: "teṭṭsem", ils: "ṭṭsen" } },
  { kab: "ldi", fr: "ouvrir", forms: { je: "ldiɣ", tu: "teldiḍ", il: "yeldi", elle: "teldi", nous: "neldi", vous: "teldim", ils: "ldin" } },
  { kab: "err", fr: "rendre, remettre", forms: { je: "rriɣ", tu: "terriḍ", il: "yerra", elle: "terra", nous: "nerra", vous: "terram", ils: "rran" } },
  { kab: "lmed", fr: "apprendre", forms: { je: "lemdeɣ", tu: "tlemdeḍ", il: "yelmed", elle: "telmed", nous: "nelmed", vous: "tlemdem", ils: "lemden" } },
  { kab: "ḥfeḍ", fr: "apprendre, retenir", forms: { je: "ḥefḍeɣ", tu: "tḥefḍeḍ", il: "yeḥfeḍ", elle: "teḥfeḍ", nous: "neḥfeḍ", vous: "tḥefḍem", ils: "ḥefḍen" } },
  { kab: "af", fr: "trouver", forms: { je: "ufiɣ", tu: "tufiḍ", il: "yufa", elle: "tufa", nous: "nufa", vous: "tufam", ils: "ufan" } },
  { kab: "as", fr: "venir", forms: { je: "usiɣ", tu: "tusiḍ", il: "yusa", elle: "tusa", nous: "nusa", vous: "tusam", ils: "usan" } },
];

const out = [];
for (const v of VERBS) {
  const forms = {};
  let kept = 0;
  for (const [p, f] of Object.entries(v.forms)) {
    if (attested(f)) {
      forms[p] = f;
      kept++;
    } else console.log(`  ✗ ${v.kab} · ${p} = ${f} NON attesté → retiré`);
  }
  if (kept >= 3) out.push({ kab: v.kab, fr: v.fr, forms });
  else console.log(`✗ verbe ${v.kab} écarté (${kept} formes attestées seulement)`);
}
fs.writeFileSync(path.join(OUT, "verbs.json"), JSON.stringify(out));
console.log(`verbs.json: ${out.length} verbes, formes 100% attestées corpus`);
