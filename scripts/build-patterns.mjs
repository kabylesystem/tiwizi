// Build the pattern graph + corpus index for the cognitive engine.
// Reads data/pairs.json, writes data/patterns.json (graph + instances +
// corruptions + transformation twins) and data/vocab-freq.json.
// Authored pattern definitions live here · the app only reads the output.
// Rule (docs/pedagogie.md): every Kabyle sentence shown is human corpus;
// "corrupted" variants are MECHANICAL, traceable edits (drop/displace a
// particle), never generated text.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "data");
const pairs = JSON.parse(fs.readFileSync(path.join(OUT, "pairs.json"), "utf8"));

// --- fold (mirror of lib/normalize.ts) ---
const FOLD = { ɣ: "g", ɛ: "a", ḥ: "h", ṣ: "s", ṭ: "t", ḍ: "d", ẓ: "z", ṛ: "r", č: "c", ǧ: "g", ž: "j", ɵ: "t" };
const fold = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ɣɛḥṣṭḍẓṛčǧžɵ]/g, (ch) => FOLD[ch] ?? ch);
const tokens = (s) => fold(s).replace(/[^\p{L}\p{N}'-]+/gu, " ").trim().split(/\s+/).filter(Boolean);

// JS \b is ASCII-only: Berber letters (ɣ ḥ ṛ…) are "non-word" and create fake
// boundaries INSIDE words ("tɣer" would match \bɣer\b). Real word boundaries:
const wb = (alt) => `(?<!\\p{L})(?:${alt})(?!\\p{L})`;
const re = (src, flags = "iu") => new RegExp(src, flags);

/**
 * Pattern definitions (the authored graph).
 * detect: regex on RAW kab text (case-insensitive, real Berber letters).
 * probe: structural-meaning question · tests whether the STRUCTURE's
 *        contribution is understood on fresh vocabulary (abstraction), not
 *        whether the user memorised a translation.
 * corrupt: mechanical ill-forming ops, only where reliably wrong:
 *        ["drop:<word>"] / ["displace:<word>:end"].
 * mask: what Anticipate hides (prediction before revelation).
 */
const DEFS = [
  {
    id: "neg-ur-ara", order: 1, family: "négation",
    name: "La négation ur … ara",
    schema: "ur + VERBE + ara",
    frHint: /(\bne\b|\bn'|\bpas\b|jamais|\brien\b|personne|aucun)/i,
    detect: re(`${wb("ur")}[^.!?]{0,40}${wb("ara")}`),
    mask: re(wb("ur|ara"), "giu"),
    corrupt: ["drop:ara", "displace:ara:end"],
    contrastsWith: [],
    requires: [],
    foilFrom: null, foilAnswer: 0,
    note: "La négation kabyle encadre le verbe en deux morceaux : « ur » avant, « ara » après · ur zriɣ ara = je ne sais pas. Le verbe change souvent de voyelle au négatif : yeswa → ur yeswi ara.",
    probe: { q: "D'après la structure, l'action…", options: ["s'est faite", "ne s'est PAS faite"], answer: 1 },
  },
  {
    id: "fut-ad", order: 2, family: "temps & mode",
    name: "ad + verbe · le non-réalisé",
    schema: "ad + VERBE (aoriste)",
    frHint: /(rai\b|ras\b|ra\b|rons\b|rez\b|ront\b|\bvais\b|\bva\b|\bvas\b|allons|\bvont\b|demain|veu[xt]|voudr|il faut|\bdois\b|devr|que je|qu'il|qu'elle|espère|laisse[z-]|puisse)/i,
    detect: re(`(^|[\\s«"(-])ad\\s+\\S`),
    mask: re(wb("ad"), "giu"),
    corrupt: ["displace:ad:end"],
    contrastsWith: [],
    requires: [],
    foilFrom: null, foilAnswer: 0,
    note: "« ad » projette l'action dans le non-réalisé : futur, intention, souhait · ad ruḥeɣ = je partirai / que je parte. C'est la particule la plus fréquente du kabyle.",
    probe: { q: "D'après la structure, l'action est…", options: ["déjà faite", "à venir / voulue"], answer: 1 },
  },
  {
    id: "have-ghur", order: 3, family: "possession",
    name: "ɣur-i · avoir, c'est « chez-moi »",
    schema: "ɣur- + pronom",
    frHint: /(\b(ai|as|a|avons|avez|ont) (un|une|des|d'|de la|du|le|la|les|mon|ma|mes|ton|ta|tes|son|sa|ses|beaucoup|assez|plein|raison|tort|besoin|peur|faim|soif|froid|chaud|sommeil|l'air|mal)\b|possèd|appartien)/i,
    detect: re(`${wb("ɣur-(?:i|ek|em|es|s|k|m|neɣ|wen|kent|sen|sent)")}`),
    mask: re("ɣur-\\p{L}+", "giu"),
    corrupt: [],
    contrastsWith: ["prep-gher"],
    requires: [],
    foilFrom: "prep-gher", foilAnswer: 1,
    note: "Le kabyle n'a pas de verbe « avoir » : on dit « chez-moi » · ɣur-i aqcic = j'ai un garçon (litt. « chez-moi un garçon »). ɣur-ek (chez-toi), ɣur-es (chez-lui/elle)…",
    probe: { q: "La phrase parle de…", options: ["possession (avoir)", "déplacement (aller)"], answer: 0 },
  },
  {
    id: "exist-yella", order: 4, family: "existence",
    name: "yella / tella · être là",
    schema: "yella (m.) / tella (f.) / llan (pl.)",
    frHint: /(il y a|il y avait|y a-t-il|y avait-il|se trouv|existe|était|étaient|est là|sont là|reste|présent)/i,
    detect: re(wb("yella|tella|llan|llant")),
    mask: re(wb("yella|tella|llan|llant"), "giu"),
    corrupt: [],
    contrastsWith: ["exist-ulac"],
    requires: [],
    foilFrom: "exist-ulac", foilAnswer: 1,
    note: "« yella » (masculin), « tella » (féminin), « llan/llant » (pluriel) : exister, se trouver, il y a. Son contraire absolu tient en un mot : « ulac ».",
    probe: { q: "D'après la structure, ça…", options: ["existe / est là", "n'existe pas"], answer: 0 },
  },
  {
    id: "exist-ulac", order: 5, family: "existence",
    name: "ulac · il n'y a pas",
    schema: "ulac + NOM",
    frHint: /(pas de|n'y a|n'est pas|aucun|rien|absent|manque|sans)/i,
    detect: re(wb("ulac")),
    mask: re(wb("ulac"), "giu"),
    corrupt: [],
    contrastsWith: ["exist-yella"],
    requires: ["exist-yella"],
    foilFrom: "exist-yella", foilAnswer: 0,
    note: "« ulac » nie l'existence en un seul mot : ulac aman = il n'y a pas d'eau. Ulac aɣilif = pas de souci !",
    probe: { q: "D'après la structure, ça…", options: ["existe / est là", "n'existe pas"], answer: 1 },
  },
  {
    id: "cop-d", order: 6, family: "phrase nominale",
    name: "d + nom · c'est…",
    schema: "D + NOM",
    frHint: /(c'est|ce sont|c'était|est un|est une|est le|est la|est mon|est ma)/i,
    detect: /^[«"(]?D\s+\p{L}{2,}/u,
    mask: /^D\b/gu,
    corrupt: [],
    contrastsWith: [],
    requires: [],
    foilFrom: null, foilAnswer: 1,
    note: "« d » devant un nom, c'est le verbe « être » du présent : D argaz = c'est un homme. D tidet = c'est vrai. (Ailleurs, le même « d » peut vouloir dire « et/avec ».)",
    probe: { q: "La phrase…", options: ["dit ce que c'est (identité)", "raconte une action"], answer: 0 },
  },
  {
    id: "q-acu", order: 7, family: "interrogation",
    name: "acu · quoi ?",
    schema: "(d) acu (…) ?",
    frHint: /(quoi|qu'est-ce|^qu[e']|\bquel(le)?\b|que (fai|dis|veu|pens|s'est))/i,
    detect: re(wb("acu")),
    mask: re(`(?:${wb("d")}\\s+)?${wb("acu")}`, "giu"),
    corrupt: [],
    contrastsWith: ["q-anda", "q-amek"],
    requires: [],
    foilFrom: "q-anda", foilAnswer: 1,
    note: "« acu » demande « quoi » · souvent « d acu » (c'est quoi ?). Avec le futur : acu ara txedmeḍ ? = que vas-tu faire ?",
    probe: { q: "On demande…", options: ["quoi", "où", "comment"], answer: 0 },
  },
  {
    id: "q-anda", order: 8, family: "interrogation",
    name: "anda · où ?",
    schema: "anda (…) ?",
    frHint: /(\boù\b|d'où|quelque part|nulle part|n'importe où|partout|endroit|laquelle|lequel)/i,
    detect: re(wb("anda")),
    mask: re(wb("anda"), "giu"),
    corrupt: [],
    contrastsWith: ["q-acu", "q-amek"],
    requires: [],
    foilFrom: "q-acu", foilAnswer: 0,
    note: "« anda » = où : anda telliḍ ? = où es-tu ? (Et « ansi » = d'où.)",
    probe: { q: "On demande…", options: ["quoi", "où", "comment"], answer: 1 },
  },
  {
    id: "q-amek", order: 9, family: "interrogation",
    name: "amek · comment ?",
    schema: "amek (…) ?",
    frHint: /(comment)/i,
    detect: re(wb("amek")),
    mask: re(wb("amek"), "giu"),
    corrupt: [],
    contrastsWith: ["q-acu", "q-anda"],
    requires: [],
    foilFrom: "q-acu", foilAnswer: 0,
    note: "« amek » = comment : amek telliḍ ? = comment vas-tu ? La question kabyle ne change pas l'ordre des mots · le mot interrogatif se pose devant.",
    probe: { q: "On demande…", options: ["quoi", "où", "comment"], answer: 2 },
  },
  {
    id: "want-bgh", order: 10, family: "volonté",
    name: "bɣiɣ / yebɣa · vouloir",
    schema: "BƔ + (ad + VERBE)",
    frHint: /(veu[xt]|voul|envie|aimerais?|souhait|tiens à)/i,
    detect: re(wb("bɣiɣ|tebɣiḍ|yebɣa|tebɣa|nebɣa|tebɣam|tebɣamt|bɣan|bɣant")),
    mask: re(wb("bɣiɣ|tebɣiḍ|yebɣa|tebɣa|nebɣa|tebɣam|tebɣamt|bɣan|bɣant"), "giu"),
    corrupt: [],
    contrastsWith: [],
    requires: ["fut-ad"],
    foilFrom: null, foilAnswer: 1,
    note: "La racine BƔ = vouloir : bɣiɣ (je veux), yebɣa (il veut), tebɣa (elle veut)… Ce qu'on veut FAIRE passe par « ad » : bɣiɣ ad ruḥeɣ = je veux partir.",
    probe: { q: "La phrase exprime…", options: ["un désir / une volonté", "un fait accompli"], answer: 0 },
  },
  {
    id: "p1sg-gh", order: 11, family: "conjugaison",
    name: "-ɣ final · c'est « je »",
    schema: "VERBE + -ɣ",
    // 1sg verb endings -eɣ/-iɣ/-uɣ/-aɣ ; (?<!n)eɣ excludes possessive -nneɣ
    frHint: /(\bje\b|\bj'|\bmoi\b|\bme\b|\bm')/i,
    detect: re("\\p{L}{2,}(?:(?<!n)eɣ|iɣ|uɣ)(?!\\p{L})"),
    mask: re("(?<=\\p{L}{2})(?:eɣ|iɣ|uɣ)(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: [],
    requires: [],
    foilFrom: null, foilAnswer: 1,
    note: "Un verbe qui finit par « -ɣ », c'est « je » : zriɣ = je sais, bɣiɣ = je veux, ruḥeɣ = je suis parti. Une seule lettre porte toute la personne.",
    probe: { q: "Qui fait l'action ?", options: ["moi (je)", "quelqu'un d'autre"], answer: 0 },
  },
  {
    id: "prep-gher", order: 12, family: "prépositions",
    name: "ɣer · vers, mouvement",
    schema: "ɣer + LIEU",
    frHint: /(\bvers\b|\bchez\b|\bau\b|\baux\b|à la |à l'|jusqu')/i,
    detect: re(wb("ɣer")),
    mask: re(wb("ɣer"), "giu"),
    corrupt: [],
    contrastsWith: ["prep-deg", "have-ghur"],
    requires: [],
    foilFrom: "prep-deg", foilAnswer: 1,
    note: "« ɣer » marque la direction : ɣer uxxam = vers la maison. À distinguer de « ɣur- » (chez → possession) et de « deg » (dans → position).",
    probe: { q: "« ɣer » indique…", options: ["un mouvement vers", "une position dans"], answer: 0 },
  },
  {
    id: "prep-deg", order: 13, family: "prépositions",
    name: "deg · dans",
    schema: "deg + LIEU",
    frHint: /(\bdans\b|dedans|à l'intérieur)/i,
    detect: re(wb("deg")),
    mask: re(wb("deg"), "giu"),
    corrupt: [],
    contrastsWith: ["prep-gher"],
    requires: [],
    foilFrom: "prep-gher", foilAnswer: 0,
    note: "« deg » situe à l'intérieur : deg uxxam = dans la maison. (À l'oral il se réduit souvent à « g ».)",
    probe: { q: "« deg » indique…", options: ["un mouvement vers", "une position dans"], answer: 1 },
  },
  {
    id: "p2sg-t-d", order: 14, family: "conjugaison",
    name: "t-…-ḍ · c'est « tu »",
    schema: "t + VERBE + ḍ",
    frHint: /(\btu\b|\bt'|\btoi\b)/i,
    detect: re("(?<!\\p{L})t\\p{L}{2,}ḍ(?!\\p{L})"),
    mask: re("(?<!\\p{L})t\\p{L}{2,}ḍ(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["p3sg-y", "p1sg-gh"],
    requires: ["p1sg-gh"],
    foilFrom: "p3sg-y", foilAnswer: 1,
    note: "Le « tu » kabyle encercle le verbe : t- devant, -ḍ derrière · txedmeḍ = tu travailles, telliḍ = tu es, tebɣiḍ = tu veux. (Même forme au masculin et au féminin.)",
    probe: { q: "Qui fait l'action ?", options: ["toi (tu)", "lui / elle"], answer: 0 },
  },
  {
    id: "p3sg-y", order: 15, family: "conjugaison",
    name: "y- / i- · c'est « il »",
    schema: "y(e)- + VERBE",
    frHint: /(\bil\b|\blui\b)/i,
    detect: re("(?<!\\p{L})ye(?!mma|lli|ssi)\\p{L}{2,}(?!\\p{L})"),
    mask: re("(?<!\\p{L})ye(?!mma|lli|ssi)\\p{L}{2,}(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["p2sg-t-d", "p1sg-gh"],
    requires: ["p1sg-gh"],
    foilFrom: "p1sg-gh", foilAnswer: 1,
    note: "« Il » se marque devant le verbe : ye-/i- · yexdem (ou ixdem) = il travaille, yebɣa = il veut, yella = il est. Pour « elle », le préfixe devient t- : texdem.",
    probe: { q: "Qui fait l'action ?", options: ["lui (il)", "moi (je)"], answer: 0 },
  },
  {
    id: "p1pl-n", order: 16, family: "conjugaison",
    name: "n- · c'est « nous »",
    schema: "n(e)- + VERBE",
    frHint: /\bnous\b/i,
    detect: re("(?<!\\p{L})ne(?!kk|tta|nn)\\p{L}{2,}(?!\\p{L})"),
    mask: re("(?<!\\p{L})ne(?!kk|tta|nn)\\p{L}{2,}(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["p1sg-gh"],
    requires: ["p1sg-gh"],
    foilFrom: null, foilAnswer: 1,
    note: "« Nous » se marque devant le verbe : n(e)- · nexdem = nous travaillons, nruḥ = nous partons, nečča = nous avons mangé. Tu l'as déjà croisé dans « ad nini » (disons).",
    probe: { q: "Qui fait l'action ?", options: ["nous", "quelqu'un d'autre"], answer: 0 },
  },
  {
    id: "annex-n", order: 17, family: "liaison des noms",
    name: "n + annexion · le « de » kabyle",
    schema: "NOM + n + w/t/y-NOM",
    frHint: /( de | du | des | d')/i,
    detect: re(`${wb("n")}\\s+(?:w|t|y)\\p{L}{2,}`),
    mask: re(`${wb("n")}\\s+(?:w|t|y)\\p{L}{2,}`, "giu"),
    corrupt: [],
    contrastsWith: [],
    requires: [],
    foilFrom: null, foilAnswer: 1,
    note: "Le « de » kabyle : n + nom, et le nom passe à l'ÉTAT D'ANNEXION (sa première voyelle se transforme) · aman → n waman (de l'eau), tamurt → n tmurt (du pays), aṭas n yimdanen = beaucoup de gens.",
    probe: { q: "La phrase contient-elle un lien « X de Y » ?", options: ["oui", "non"], answer: 0 },
  },
  {
    id: "poss-suffix", order: 18, family: "possession",
    name: "-iw / -ik / -is · mon, ton, son",
    schema: "NOM + -iw/-ik/-im/-is/-nneɣ…",
    frHint: /(\bmon\b|\bma\b|\bmes\b|\bton\b|\bta\b|\btes\b|\bson\b|\bsa\b|\bses\b|notre|votre|\bleurs?\b)/i,
    detect: re("\\p{L}{2,}-(?:iw|inu|ik|inek|im|inem|is|ines|nneɣ|nwen|nkent|nsen|nsent)(?!\\p{L})"),
    mask: re("-(?:iw|inu|ik|inek|im|inem|is|ines|nneɣ|nwen|nkent|nsen|nsent)(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["have-ghur"],
    requires: [],
    foilFrom: null, foilAnswer: 1,
    note: "La possession se colle au nom : axxam-iw (ma maison), axxam-ik (ta maison, à toi h.), axxam-im (à toi f.), axxam-is (sa maison), axxam-nneɣ (notre). Détail : les noms de parenté s'en passent · « baba » tout seul = MON père.",
    probe: { q: "La phrase dit-elle à qui appartient quelque chose ?", options: ["oui (possessif)", "non"], answer: 0 },
  },
  {
    id: "neg-maci", order: 19, family: "négation",
    name: "mačči · « ce n'est pas »",
    schema: "mačči + d + NOM",
    frHint: /(n'est pas|ne sont pas|pas (un|une|le|la|les|du|de|ça|moi|toi|lui|à))/i,
    detect: re(wb("mačči|macci")),
    mask: re(wb("mačči|macci"), "giu"),
    corrupt: [],
    contrastsWith: ["neg-ur-ara", "cop-d"],
    requires: ["cop-d"],
    foilFrom: "neg-ur-ara", foilAnswer: 1,
    note: "Deux négations, deux mondes : « ur … ara » nie un VERBE, « mačči » nie une IDENTITÉ · Mačči d nekk = ce n'est pas moi, Mačči d ayla-k = ce n'est pas à toi.",
    probe: { q: "Cette négation porte sur…", options: ["ce que c'est (identité)", "une action (verbe)"], answer: 0 },
  },
  {
    id: "prep-ghef", order: 20, family: "prépositions",
    name: "ɣef · sur, à propos de",
    schema: "ɣef + NOM",
    frHint: /(\bsur\b|à propos|au sujet|pourquoi)/i,
    detect: re(wb("ɣef")),
    mask: re(wb("ɣef"), "giu"),
    corrupt: [],
    contrastsWith: ["prep-gher", "prep-deg"],
    requires: [],
    foilFrom: "prep-gher", foilAnswer: 1,
    note: "« ɣef » = sur (ɣef tṭabla = sur la table) et « à propos de » (au figuré). Avec pronom, il devient fell- : fell-as = sur lui / à son sujet.",
    probe: { q: "« ɣef » indique…", options: ["sur / à propos de", "vers (un mouvement)"], answer: 0 },
  },
  {
    id: "prep-s", order: 21, family: "prépositions",
    name: "s · avec (le moyen)",
    schema: "s + NOM",
    frHint: /(\bavec\b|en (voiture|taxi|camion|train|bus|avion|vélo)|\bpar\b|au moyen)/i,
    detect: re(`${wb("s")}\\s+(?:u|w|t|y)\\p{L}{2,}`),
    mask: re(`(?<!\\p{L})s(?=\\s)`, "giu"),
    corrupt: [],
    contrastsWith: ["prep-gher"],
    requires: [],
    foilFrom: "exist-yella", foilAnswer: 1,
    note: "« s » = avec, au moyen de · Iruḥ s ukamyun = il est parti en camion, s wawal = avec le mot. (Le même « s » peut aussi dire « vers » · dans ce sens le nom reste à l'état libre.)",
    probe: { q: "« s » exprime ici…", options: ["le moyen (avec / en)", "l'existence (il y a)"], answer: 0 },
  },
  {
    id: "prep-pron", order: 22, family: "prépositions",
    name: "fell-as, yid-i · la préposition porte le pronom",
    schema: "PRÉP + -pronom",
    frHint: /(avec (moi|toi|lui|elle|nous|vous|eux|elles)|sur (moi|toi|lui|elle|nous|vous|eux)|entre (nous|vous|eux)|dedans|dessus|de (lui|moi|toi))/i,
    detect: re("(?<!\\p{L})(?:fell|yid|yis|deg|seg|gar)-\\p{L}{1,5}(?!\\p{L})"),
    mask: re("(?<!\\p{L})(?:fell|yid|yis|deg|seg|gar)-\\p{L}{1,5}(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["have-ghur"],
    requires: ["prep-deg"],
    foilFrom: null, foilAnswer: 1,
    note: "Quand la préposition rencontre un pronom, ils fusionnent : fell-as (sur lui), yid-i (avec moi), deg-s (dedans / en lui), gar-aneɣ (entre nous). Tu connais déjà ɣur-i : c'est la même mécanique.",
    probe: { q: "Une préposition porte-t-elle un pronom (avec-moi, sur-lui…) ?", options: ["oui", "non"], answer: 0 },
  },
  {
    id: "dem-nni", order: 23, family: "démonstratifs",
    name: "-agi / -nni · ce…-ci, ce…-là",
    schema: "NOM + -agi (proche) / -nni (évoqué)",
    frHint: /(-ci|-là|\bce\b|\bcette\b|\bces\b|celui|celle|\bça\b|\bcela\b)/i,
    detect: re("\\p{L}{2,}-(?:agi|nni|ihin)(?!\\p{L})"),
    mask: re("-(?:agi|nni|ihin)(?!\\p{L})", "giu"),
    corrupt: [],
    contrastsWith: ["poss-suffix"],
    requires: [],
    foilFrom: null, foilAnswer: 1,
    note: "Le démonstratif se colle au nom : argaz-agi = cet homme-CI (présent), argaz-nni = cet homme-LÀ (dont on a déjà parlé · -nni sert à référencer sans redécrire).",
    probe: { q: "Quelque chose est-il montré / désigné (ce, cette, -là) ?", options: ["oui", "non"], answer: 0 },
  },
  {
    id: "cleft-i", order: 24, family: "mise en relief",
    name: "d … i · « c'est X qui… »",
    schema: "d + X + i + VERBE",
    frHint: /(c'est .{1,28} qu[i'e])/i,
    detect: re(`(?<!\\p{L})d\\s+\\p{L}+\\s+i\\s+\\p{L}`),
    mask: re(`${wb("i")}`, "giu"),
    corrupt: [],
    contrastsWith: ["cop-d"],
    requires: ["cop-d"],
    foilFrom: null, foilAnswer: 1,
    note: "Pour insister sur QUI fait, le kabyle sort l'élément devant avec « d » et le relie par « i » : D Xuxa i iḥercen = c'est Xuxa qui est intelligente. Structure ultra-fréquente.",
    probe: { q: "La phrase insiste-t-elle sur QUI/QUOI (« c'est X qui… ») ?", options: ["oui", "non"], answer: 0 },
  },
  {
    id: "ara-rel", order: 25, family: "temps & mode",
    name: "ara + verbe · le futur des relatives",
    schema: "acu/wi/ayen… + ara + VERBE",
    frHint: /(rai\b|ras\b|ra\b|rons\b|rez\b|ront\b|\bvais\b|\bva\b|\bvont\b|qui va|que (je|tu|nous|vous) v)/i,
    detect: re(`${wb("ara")}\\s+(?:a|t|y|n|d|i)\\p{L}{2,}`),
    exclude: re(wb("ur")),
    mask: re(wb("ara"), "giu"),
    corrupt: [],
    contrastsWith: ["neg-ur-ara", "fut-ad"],
    requires: ["fut-ad", "neg-ur-ara"],
    foilFrom: "neg-ur-ara", foilAnswer: 1,
    note: "Le MÊME mot « ara » a deux vies : après « ur », il nie · mais après un mot comme acu/ayen/wi, il projette au futur : acu ara txedmeḍ ? = que FERAS-tu ?, Wukud ara truḥeḍ ? = avec qui partiras-tu ? (c'est le « ad » des phrases relatives).",
    probe: { q: "Ici, « ara » sert à…", options: ["projeter au futur (relative)", "nier l'action (ur … ara)"], answer: 0 },
  },
  {
    id: "cond-ma", order: 26, family: "condition",
    name: "ma · « si »",
    schema: "ma + VERBE, …",
    frHint: /(\bsi\b|\bquand\b|lorsque|au cas où)/i,
    detect: re(`${wb("ma")}\\s+\\p{L}{2,}`),
    mask: re(wb("ma"), "giu"),
    corrupt: [],
    contrastsWith: ["q-acu"],
    requires: [],
    foilFrom: "q-acu", foilAnswer: 1,
    note: "« ma » ouvre une condition : ma yella = s'il y a / si c'est le cas, ma tebɣiḍ = si tu veux. (Pour l'irréel, on trouve aussi « lukan » = si j'avais….)",
    probe: { q: "La phrase pose-t-elle…", options: ["une condition (si…)", "une question (quoi ?)"], answer: 0 },
  },
];

// --- candidate pool: short sentences, audio first ---
const pool = pairs.filter((p) => p.w >= 2 && p.w <= 9);

// --- vocab frequency over the whole corpus (folded tokens) ---
const freq = new Map();
for (const p of pairs) for (const t of tokens(p.kab)) freq.set(t, (freq.get(t) || 0) + 1);

// --- mechanical corruption ops ---
function corruptSentence(kab, ops) {
  for (const op of ops) {
    const [kind, word, where] = op.split(":");
    const re = new RegExp(`(^|\\s)${word}(\\s|$)`, "iu");
    if (!re.test(kab)) continue;
    if (kind === "drop") {
      const bad = kab.replace(re, "$1").replace(/\s{2,}/g, " ").trim();
      if (bad !== kab) return { bad, op };
    }
    if (kind === "displace") {
      const stripped = kab.replace(re, "$1").replace(/\s{2,}/g, " ").trim();
      const m = stripped.match(/^(.*?)([.!?…]*)$/su);
      let bad = `${m[1].trim()} ${word.toLowerCase()}${m[2]}`;
      bad = bad.charAt(0).toUpperCase() + bad.slice(1);
      if (where === "end" && bad !== kab) return { bad, op };
    }
  }
  return null;
}

// greedy pick maximising fresh content vocabulary (surface variation) while
// staying COMPREHENSIBLE: short sentences, frequent (familiar) vocabulary
function pickVaried(instances, n, seenTokens) {
  const chosen = [];
  const cands = [...instances];
  while (chosen.length < n && cands.length) {
    let best = 0, bestScore = -1;
    for (let i = 0; i < cands.length; i++) {
      const toks = tokens(cands[i].kab);
      const freshCount = toks.filter((t) => !seenTokens.has(t)).length;
      const familiar = toks.filter((t) => (freq.get(t) || 0) >= 80).length / toks.length;
      const score = freshCount - 0.6 * toks.length + 2 * familiar + (cands[i].audio ? 0.5 : 0);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    const pick = cands.splice(best, 1)[0];
    chosen.push(pick);
    for (const t of tokens(pick.kab)) seenTokens.add(t);
  }
  return chosen;
}

const lite = (p) => ({ id: p.id, kab: p.kab, fr: p.fr, audio: p.audio, w: p.w });

// --- twin mining: pairs differing only by a particle set + ≤1 changed token ---
// (negation changes the verb vowel: "Yeswa aman" / "Ur yeswi ara aman")
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function mineTwins(patternRe, particles, max = 400) {
  const strip = (toks) => toks.filter((t) => !particles.includes(t));
  // index plain sentences by "tokens minus one" key
  // les impératifs (« Ffeɣ ! ») changent de personne dans la transformation → exclus
  const plain = pool.filter((p) => !patternRe.test(p.kab) && p.w >= 2 && p.w <= 8 && !/!\s*$/.test(p.kab) && !/!\s*$/.test(p.fr));
  const byKey = new Map();
  for (const p of plain) {
    const toks = tokens(p.kab);
    if (toks.length < 2) continue;
    for (let i = 0; i < toks.length; i++) {
      const key = toks.filter((_, j) => j !== i).sort().join(" ");
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      const arr = byKey.get(key);
      if (arr.length < 6) arr.push({ p, missing: toks[i] });
    }
  }
  // the changed token must keep the person prefix (yeswa→yeswi ✔, ruḥ→nruḥ ✘)
  // and stay VERY close (lev ≤1) : lev 2 laissait passer des verbes différents
  // (cemteɣ « laid » vs ceɣleɣ « occupé », bug du 2026-06-30)
  const closeEnough = (a, b) => {
    if (a[0] !== b[0] || lev(a, b) > 1) return false;
    if (a.length === b.length) {
      let d = -1;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { d = i; break; }
      // substitution sur la DERNIÈRE lettre = suffixe de personne (ruḥen⇄ruḥeɣ)
      // sauf alternance de voyelle du prétérit négatif (yeswa⇄yeswi)
      if (d === a.length - 1) {
        const vowels = new Set(["a", "i", "u", "e"]);
        if (!(vowels.has(a[d]) && vowels.has(b[d]))) return false;
      }
    }
    return true;
  };
  // …et les TRADUCTIONS doivent partager du contenu (même événement décrit)
  const frToks = (fr) => new Set(fr.toLowerCase().replace(/[^\p{L}]+/gu, " ").split(" ").filter((t) => t.length >= 4));
  const frClose = (a, b) => {
    const A = frToks(a), B = frToks(b);
    let shared = 0;
    for (const t of A) if (B.has(t)) shared++;
    return shared >= 2 || (shared >= 1 && Math.min(A.size, B.size) <= 3);
  };
  const twins = [];
  const usedPlain = new Set();
  const marked = pool.filter((p) => patternRe.test(p.kab) && p.w <= 9);
  marked.sort((a, b) => (b.audio ? 1 : 0) - (a.audio ? 1 : 0)); // voix native d'abord
  for (const m of marked) {
    if (twins.length >= max) break;
    const toks = strip(tokens(m.kab));
    if (toks.length < 2) continue;
    for (let i = 0; i < toks.length; i++) {
      const key = toks.filter((_, j) => j !== i).sort().join(" ");
      if (!key) continue;
      let found = false;
      for (const cand of byKey.get(key) || []) {
        if (cand.p.id !== m.id && !usedPlain.has(cand.p.id) && closeEnough(toks[i], cand.missing) && frClose(cand.p.fr, m.fr)) {
          twins.push({ plain: lite(cand.p), marked: lite(m) });
          usedPlain.add(cand.p.id);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }
  return twins;
}

// sentences matching NO pattern at all: neutral foils (affirmative, simple)
const neutralPool = pool.filter((p) => p.audio && p.w <= 7 && DEFS.every((d) => !d.detect.test(p.kab)));

// --- build each pattern's index ---
const out = [];
for (const d of DEFS) {
  const instances = pool.filter((p) => d.detect.test(p.kab) && !(d.exclude && d.exclude.test(p.kab)));
  instances.sort((a, b) => (b.audio ? 1 : 0) - (a.audio ? 1 : 0) || a.w - b.w || a.c - b.c);

  const seen = new Set();
  const shortAudio = instances.filter((p) => p.audio && p.w <= 6);
  let floodPool = shortAudio.length >= 60 ? shortAudio : instances.filter((p) => p.audio);
  // patterns opaques en traduction (yella → "il pleut" ne montre rien) :
  // l'induction préfère les phrases dont le FRANÇAIS montre le pattern
  if (d.frHint) {
    // vivier élargi : tout l'audio (w<=9), la transparence prime sur la brièveté
    const wide = instances.filter((p) => p.audio);
    const transparent = wide.filter((p) => d.frHint.test(p.fr));
    if (transparent.length >= 12) floodPool = transparent;
    else console.log(`  ⚠ ${d.id}: seulement ${transparent.length} phrases transparentes, flood NON filtré`);
  }
  const flood = pickVaried(floodPool.slice(0, 600), 40, seen);
  const floodIds = new Set(flood.map((p) => p.id));
  // probes: fresh vocabulary relative to the flood set (abstraction test).
  // Audio d'abord partout : la voix native EST le produit.
  const probePool = instances.filter((p) => !floodIds.has(p.id) && p.w <= 7);
  const probeAudio = probePool.filter((p) => p.audio);
  const probe = pickVaried((probeAudio.length >= 18 ? probeAudio : probePool).slice(0, 1200), 24, new Set(seen));
  const probeIds = new Set(probe.map((p) => p.id));
  const extraPool = instances.filter((p) => !floodIds.has(p.id) && !probeIds.has(p.id));
  const extraAudio = extraPool.filter((p) => p.audio);
  const extra = pickVaried((extraAudio.length >= 45 ? extraAudio : extraPool).slice(0, 2000), 60, new Set());

  const corrupts = [];
  if (d.corrupt.length) {
    for (const p of [...flood, ...extra]) {
      const c = corruptSentence(p.kab, d.corrupt);
      if (c) corrupts.push({ id: p.id, good: p.kab, bad: c.bad, fr: p.fr, audio: p.audio, op: c.op });
      if (corrupts.length >= 40) break;
    }
  }

  // probe foils: sentences where the RIGHT answer is the other option
  let foilCands;
  if (d.foilFrom) {
    const src = DEFS.find((x) => x.id === d.foilFrom);
    foilCands = pool.filter((p) => p.audio && p.w <= 7 && src.detect.test(p.kab) && !d.detect.test(p.kab));
  } else {
    foilCands = neutralPool.filter((p) => !d.detect.test(p.kab));
  }
  const foils = pickVaried(foilCands.slice(0, 800), 12, new Set());

  const twins = d.id === "neg-ur-ara" ? mineTwins(d.detect, ["ur", "ara"])
    : d.id === "fut-ad" ? mineTwins(d.detect, ["ad"])
    : [];

  out.push({
    id: d.id, order: d.order, family: d.family, name: d.name, schema: d.schema,
    note: d.note, probe: d.probe, contrastsWith: d.contrastsWith, requires: d.requires,
    mask: d.mask.source, maskFlags: d.mask.flags, foilAnswer: d.foilAnswer,
    counts: { total: instances.length, audio: instances.filter((p) => p.audio).length, twins: twins.length, corrupts: corrupts.length },
    flood: flood.map(lite), probes: probe.map(lite), extra: extra.map(lite),
    foils: foils.map(lite), corrupts, twins,
  });
  console.log(
    `${d.id.padEnd(12)} total=${String(instances.length).padStart(6)} audio=${String(instances.filter((p) => p.audio).length).padStart(6)} twins=${String(twins.length).padStart(4)} corrupts=${corrupts.length} foils=${foils.length}`
  );
  for (const s of flood.slice(0, 3)) console.log(`   · ${s.kab}  ·  ${s.fr}`);
}

fs.writeFileSync(path.join(OUT, "patterns.json"), JSON.stringify({ built: new Date().toISOString().slice(0, 10), patterns: out }));
const freqObj = Object.fromEntries([...freq.entries()].filter(([, n]) => n >= 3));
fs.writeFileSync(path.join(OUT, "vocab-freq.json"), JSON.stringify(freqObj));
console.log(`\npatterns.json: ${out.length} patterns | vocab-freq.json: ${Object.keys(freqObj).length} tokens`);
