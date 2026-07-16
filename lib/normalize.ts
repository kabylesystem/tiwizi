/**
 * Fold Kabyle / French text for forgiving search:
 * lowercase, strip combining diacritics (dot-below, caron, accents),
 * and map the Latin-Berber special letters to plain ASCII so a user can
 * type "ghef" and match "ɣef", or "tameṭṭut" by typing "tamettut".
 */
const MAP: Record<string, string> = {
  ɣ: "g",
  ɛ: "a",
  ḥ: "h",
  ṣ: "s",
  ṭ: "t",
  ḍ: "d",
  ẓ: "z",
  ṛ: "r",
  č: "c",
  ǧ: "g",
  ž: "j",
  ɵ: "t",
};

export function fold(s: string): string {
  let out = (s || "").toLowerCase().normalize("NFD");
  // remove combining marks (U+0300–U+036F)
  out = out.replace(/[̀-ͯ]/g, "");
  out = out.replace(/[ɣɛḥṣṭḍẓṛčǧžɵ]/g, (ch) => MAP[ch] ?? ch);
  return out;
}

/**
 * Nettoie une glose du Dallet numérisé pour un affichage COMPACT (1 ligne) :
 * <br /> → séparateur, ** retirés, ''mot'' → mot, cruft "root:…" retiré.
 */
export function cleanGloss(s: string): string {
  return (s || "")
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/\*\*/g, "")
    .replace(/,?\s*root:[^),]*/gi, "")
    .replace(/''/g, "'")
    .replace(/\s*·\s*(·\s*)+/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
}
