import { NextRequest, NextResponse } from "next/server";
import { searchDict, searchGrammar } from "@/lib/data";
import { fold } from "@/lib/normalize";

export const dynamic = "force-dynamic";

// Vérification multi-sources HUMAINES pour les cartes automatiques
// (demande de naly : pas que le Dallet). Une carte exige un SENS sourcé :
//  1. Dallet (12 510 entrées, forme exacte)
//  2. grammar-kb (les fiches de cours de naly : kabyle moderne, adverbes…)
// Un mot absent des deux ne peut PAS devenir une carte (c'est aussi le
// filtre anti-kabyle-inventé-par-LLM).
const tokens = (s: string) =>
  fold(s)
    .replace(/[^\p{L}'-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export async function GET(req: NextRequest) {
  const w = (req.nextUrl.searchParams.get("w") || "").trim();
  if (w.length < 2) return NextResponse.json(null);
  const fw = fold(w);

  // 1) Dallet · forme exacte (lemme ou forme fléchie répertoriée)
  for (const e of searchDict(w, 6)) {
    if (fold(e.w) === fw || (e.forms || []).some((f) => fold(f) === fw)) {
      return NextResponse.json({
        kab: e.w,
        fr: e.m[0]?.fr.slice(0, 3).join(" · ") ?? "",
        root: e.root || undefined,
        source: "Dallet",
      });
    }
  }

  // 2) grammaire de naly · le mot est le MOT-VEDETTE de la réponse d'une
  // fiche vocab (q = sens français). Filtres anti-glose-foireuse :
  // le mot doit OUVRIR la réponse, et q ne doit pas être une question.
  for (const g of searchGrammar(w, 10)) {
    const aToks = tokens(g.a);
    const q = g.q.replace(/\s*\(.*\)$/u, "").trim();
    if (aToks[0] === fw && !q.endsWith("?") && q.length <= 45) {
      return NextResponse.json({ kab: w, fr: q, source: "grammaire (cours)" });
    }
  }

  return NextResponse.json(null);
}
