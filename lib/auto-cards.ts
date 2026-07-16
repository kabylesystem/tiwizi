"use client";

/**
 * Cartes AUTOMATIQUES depuis les réponses d'Idir (demande de naly) :
 * on extrait les segments kabyles (**gras**, convention d'Idir), et chaque
 * mot qui matche une fiche Dallet par sa FORME EXACTE devient une carte.
 * Double effet du filtre provenance : le kabyle improvisé/inventé par le
 * LLM (absent du Dallet) ne peut PAS devenir une carte.
 */
import { addCardRaw, hasCard } from "./cards";

export async function autoCardsFromReply(text: string): Promise<number> {
  const bolds = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
  const words = new Set<string>();
  for (const b of bolds)
    for (const raw of b.split(/[^\p{L}'-]+/u)) {
      const w = raw.replace(/^[-']+|[-']+$/g, "");
      if (w.length >= 2) words.add(w);
    }

  let added = 0;
  for (const w of [...words].slice(0, 10)) {
    if (hasCard(w)) continue;
    try {
      const r = await fetch(`/api/card-lookup?w=${encodeURIComponent(w)}`);
      const hit = (await r.json()) as { kab: string; fr: string; root?: string; source?: string } | null;
      if (hit && !hasCard(hit.kab) && addCardRaw(hit)) added++;
    } catch {
      /* offline : tant pis pour ce mot */
    }
  }
  return added;
}
