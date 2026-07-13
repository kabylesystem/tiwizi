import { NextRequest, NextResponse } from "next/server";
import { patternsIndex } from "@/lib/data";

export const dynamic = "force-dynamic";

// Seeded daily rotation: same day → same material (stable within a session),
// new day → different surface forms of the same deep structure
// (contextual variation, docs/pedagogie.md §5).
function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rotate<T>(arr: T[], seed: number, n: number): T[] {
  if (!arr.length) return [];
  const out: T[] = [];
  const taken = new Set<number>();
  const start = seed % arr.length;
  for (let k = 0; out.length < Math.min(n, arr.length) && k < arr.length; k++) {
    const i = (start + k * 7) % arr.length;
    if (taken.has(i)) continue;
    taken.add(i);
    out.push(arr[i]);
  }
  // stride 7 can cycle early on multiples of 7 · top up linearly
  for (let i = 0; out.length < Math.min(n, arr.length); i = (i + 1) % arr.length) {
    if (!taken.has(i)) {
      taken.add(i);
      out.push(arr[i]);
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("p") || "";
  const seed = req.nextUrl.searchParams.get("seed") || new Date().toISOString().slice(0, 10);
  const entry = patternsIndex().patterns.find((p) => p.id === id);
  if (!entry) return NextResponse.json({ error: "unknown_pattern" }, { status: 404 });
  const h = hash(seed + ":" + id);
  return NextResponse.json({
    id: entry.id,
    flood: rotate(entry.flood, h, 8),
    probes: rotate(entry.probes, h >> 3, 6),
    extra: rotate(entry.extra, h >> 5, 12),
    corrupts: rotate(entry.corrupts, h >> 7, 6),
    twins: rotate(entry.twins, h >> 9, 8),
  });
}
