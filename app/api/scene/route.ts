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
  const h = hash(seed + ":" + scene.id);
  const start = h % scene.lines.length;
  const lines = Array.from({ length: Math.min(7, scene.lines.length) }, (_, k) => scene.lines[(start + k * 7) % scene.lines.length]);
  const dedup = [...new Map(lines.map((l) => [l.id, l])).values()];
  return NextResponse.json({ id: scene.id, title: scene.title, book: scene.book, lines: dedup });
}
