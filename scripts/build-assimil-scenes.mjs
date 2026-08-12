// « La scène du jour » : la PROGRESSION situationnelle du livre Assimil
// (Le Kabyle de poche · thèmes dans l'ordre du livre) habillée de phrases
// 100% NATIVES du corpus (l'OCR du livre abîme l'orthographe kabyle ·
// on n'affiche JAMAIS ce kabyle-là, cf. docs/pedagogie.md).
// Sortie : data/scenes.json
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "data");
const pairs = JSON.parse(fs.readFileSync(path.join(OUT, "pairs.json"), "utf8"));

// Thèmes du livre, DANS L'ORDRE DU LIVRE, avec leurs mots-clés français
const THEMES = [
  { id: "salutations", title: "Saluer et se présenter", book: "LES SALUTATIONS / SALUER ET RÉPONDRE", kw: /(bonjour|salut|bonne nuit|bonsoir|bienvenue|au revoir|comment (vas|allez)|ça va|enchanté|je m'appelle|merci|s'il (te|vous) plaît)/i },
  { id: "politesses", title: "Politesses et locutions utiles", book: "QUELQUES LOCUTIONS UTILES / CONVERSATION", kw: /(merci|pardon|excuse|s'il (te|vous) plaît|de rien|d'accord|bien sûr|avec plaisir|volontiers|désolé)/i },
  { id: "route", title: "Sur la route", book: "SUR LA ROUTE", kw: /(route|chemin|taxi|bus|gare|voiture|conduire|voyage|aller à|loin|près de|tourner|tout droit|station)/i },
  { id: "nature", title: "La nature", book: "LA NATURE", kw: /(montagne|rivière|arbre|forêt|soleil|pluie|neige|ciel|fleur|oiseau|mer|champ|jardin)/i },
  { id: "village", title: "Le village", book: "LE VILLAGE KABYLE", kw: /(village|maison|voisin|rue|place|mosquée|fontaine|champ|colline)/i },
  { id: "famille", title: "La famille", book: "LA FAMILLE ET LES LIENS FAMILIAUX", kw: /(père|mère|frère|sœur|fils|fille|famille|grand-mère|grand-père|oncle|tante|cousin|mari|femme|enfant|parents)/i },
  { id: "cafe", title: "Au café", book: "AU CAFÉ", kw: /(café|thé|boire|tasse|verre|sucre|garçon|serveur|addition|table)/i },
  { id: "repas", title: "Autour des repas", book: "AUTOUR DES REPAS", kw: /(manger|repas|couscous|pain|viande|légume|faim|soif|cuisine|déjeuner|dîner|plat|délicieux)/i },
  { id: "epicerie", title: "À l'épicerie et au marché", book: "À L'ÉPICERIE / AU MARCHÉ", kw: /(acheter|vendre|marché|magasin|prix|cher|combien|payer|argent|monnaie|épicerie|kilo)/i },
  { id: "sante", title: "Être malade", book: "ÊTRE MALADE", kw: /(malade|médecin|docteur|mal à|douleur|fièvre|médicament|hôpital|guérir|santé)/i },
  { id: "corps", title: "Le corps", book: "LE CORPS ET L'HYGIÈNE", kw: /(tête|main|pied|œil|yeux|oreille|bouche|cœur|dos|cheveux|dent|visage|bras|jambe)/i },
  { id: "temps", title: "Le temps qu'il fait, le temps qui passe", book: "LES ADVERBES / AUTOUR DES NOMBRES", kw: /(aujourd'hui|demain|hier|matin|soir|nuit|heure|semaine|mois|année|froid|chaud|pleut|beau temps)/i },
];

// variété gloutonne (mêmes règles que build-patterns : court, varié, audio)
const FOLD = { ɣ: "g", ɛ: "a", ḥ: "h", ṣ: "s", ṭ: "t", ḍ: "d", ẓ: "z", ṛ: "r", č: "c", ǧ: "g", ž: "j" };
const fold = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ɣɛḥṣṭḍẓṛčǧž]/g, (c) => FOLD[c] ?? c);
const tokens = (s) => fold(s).replace(/[^\p{L}\p{N}'-]+/gu, " ").trim().split(/\s+/).filter(Boolean);

function pickVaried(instances, n) {
  const chosen = [];
  const seen = new Set();
  const cands = [...instances];
  while (chosen.length < n && cands.length) {
    let best = 0, bestScore = -1;
    for (let i = 0; i < cands.length; i++) {
      const toks = tokens(cands[i].kab);
      const fresh = toks.filter((t) => !seen.has(t)).length;
      const score = fresh - 0.4 * toks.length;
      if (score > bestScore) { bestScore = score; best = i; }
    }
    const pick = cands.splice(best, 1)[0];
    chosen.push(pick);
    for (const t of tokens(pick.kab)) seen.add(t);
  }
  return chosen;
}

const lite = (p) => ({ id: p.id, kab: p.kab, fr: p.fr, audio: p.audio, w: p.w });
const pool = pairs.filter((p) => p.audio && p.w >= 2 && p.w <= 9);

// fréquences corpus pour le score de difficulté
const freq = new Map();
for (const p of pairs) for (const t of tokens(p.kab)) freq.set(t, (freq.get(t) || 0) + 1);
const difficulty = (p) => {
  const toks = tokens(p.kab);
  const rare = toks.filter((t) => (freq.get(t) || 0) < 15).length;
  return toks.length + rare * 2;
};

const scenes = [];
for (const t of THEMES) {
  const hits = pool.filter((p) => t.kw.test(p.fr));
  // triées du plus SIMPLE au plus dur : la 1re passe d'un thème reste douce,
  // les passes suivantes montent en difficulté (retour naly 2026-08-13)
  const lines = pickVaried(hits, 30)
    .sort((a, b) => difficulty(a) - difficulty(b))
    .map(lite);
  scenes.push({ id: t.id, title: t.title, book: t.book, lines });
  console.log(`${t.id.padEnd(12)} ${String(hits.length).padStart(5)} phrases natives · gardées: ${lines.length}`);
}
fs.writeFileSync(path.join(OUT, "scenes.json"), JSON.stringify({ built: new Date().toISOString().slice(0, 10), scenes }));
console.log(`scenes.json: ${scenes.length} scènes (ordre du livre)`);
