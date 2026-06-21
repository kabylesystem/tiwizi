// Kabyle Latin orthography → Tifinagh (for decorative display).
const MAP: Record<string, string> = {
  a:"ⴰ", b:"ⴱ", c:"ⵛ", "č":"ⵞ", d:"ⴷ", "ḍ":"ⴹ", e:"ⴻ", "ɛ":"ⵄ", f:"ⴼ", g:"ⴳ",
  "ǧ":"ⴵ", "ɣ":"ⵖ", h:"ⵀ", "ḥ":"ⵃ", i:"ⵉ", j:"ⵊ", k:"ⴽ", l:"ⵍ", m:"ⵎ", n:"ⵏ",
  o:"ⵄ", p:"ⵒ", q:"ⵇ", r:"ⵔ", "ṛ":"ⵕ", s:"ⵙ", "ṣ":"ⵚ", t:"ⵜ", "ṭ":"ⵟ", u:"ⵓ",
  v:"ⵠ", w:"ⵡ", x:"ⵅ", y:"ⵢ", z:"ⵣ", "ẓ":"ⵥ",
};

export function tifinagh(latin: string): string {
  return [...(latin || "").toLowerCase()]
    .map((ch) => MAP[ch] ?? (ch === " " ? " " : ""))
    .join("");
}
