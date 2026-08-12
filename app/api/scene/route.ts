import { NextRequest, NextResponse } from "next/server";
import { scenesIndex } from "@/lib/data";

export const dynamic = "force-dynamic";

// La scène du jour : le thème suit la PROGRESSION DU LIVRE (n = scènes déjà
// vécues), les répliques tournent avec le jour (30 natives, ordre varié).
function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export async function GET(req: NextRequest) {
  const { scenes } = scenesIndex();
  const n = Math.max(0, Number(req.nextUrl.searchParams.get("n") || 0));
  const seed = req.nextUrl.searchParams.get("seed") || new Date().toISOString().slice(0, 10);
  const scene = scenes[n % scenes.length];
  // les lignes sont triées simple → dur : la tranche montée dépend du nombre
  // de passages déjà faits dans ce thème (1er passage = le plus doux)
  const pass = Math.floor(n / scenes.length) % Math.max(1, Math.floor(scene.lines.length / 7));
  const h = hash(seed + ":" + scene.id);
  const start = pass * 7 + (h % 3); // léger jitter dans la tranche
  const lines = Array.from({ length: 7 }, (_, k) => scene.lines[Math.min(start + k, scene.lines.length - 1)]);
  const dedup = [...new Map(lines.map((l) => [l.id, l])).values()];
  return NextResponse.json({ id: scene.id, title: scene.title, book: scene.book, lines: dedup });
}
