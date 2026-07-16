"use client";

/**
 * Rendu partagé des textes d'Idir : **gras** = kabyle (convention du tuteur)
 * → stylé ET tappable (fiche Dallet, « + ma carte »).
 */
import { KabTapInline } from "@/components/kab-tap";

export function IdirText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <IdirKab key={i} text={p.slice(2, -2)} />
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

function IdirKab({ text }: { text: string }) {
  return <KabTapInline text={text} />;
}
