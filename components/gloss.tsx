"use client";

/**
 * Rendu LISIBLE des entrées du Dallet numérisé, sans perdre un mot du
 * contenu : les <br /> deviennent des paragraphes, les « -· » des puces,
 * les ''mots kabyles'' sont stylés, les ** et le cruft "root:…" disparaissent.
 */
export function Gloss({ text, className = "" }: { text: string; className?: string }) {
  const cleaned = (text || "")
    .replace(/\*\*/g, "")
    .replace(/,?\s*root:[^),]*/gi, "")
    .replace(/\bMm\.?\s*ss\.?/gi, "même sens que la fiche sœur (les exemples ci-dessous le montrent)")
    .trim();
  const blocks = cleaned.split(/<br\s*\/?>/gi).map((b) => b.trim()).filter(Boolean);

  const renderInline = (s: string) =>
    s.split(/(''[^']+?'')/g).map((seg, i) =>
      seg.startsWith("''") && seg.endsWith("''") ? (
        <span key={i} className="kab font-semibold not-italic text-ink">{seg.slice(2, -2)}</span>
      ) : (
        <span key={i}>{seg}</span>
      )
    );

  return (
    <span className={`block space-y-1.5 ${className}`}>
      {blocks.map((b, i) => {
        const bullet = /^[-–]?\s*·/.test(b);
        const body = b.replace(/^[-–]?\s*·\s*/, "");
        return (
          <span key={i} className={`block leading-relaxed ${bullet ? "pl-3" : ""}`}>
            {bullet && <span className="mr-1.5 font-bold" style={{ color: "#A67B2E" }}>•</span>}
            {renderInline(body)}
          </span>
        );
      })}
    </span>
  );
}
