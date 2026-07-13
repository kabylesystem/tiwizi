import { NextResponse } from "next/server";
import { patternsIndex } from "@/lib/data";

export const dynamic = "force-dynamic";

// The pattern graph, metadata only (instances come from /api/pattern-material).
export async function GET() {
  const { built, patterns } = patternsIndex();
  const metas = patterns.map((p) => ({
    id: p.id,
    order: p.order,
    family: p.family,
    name: p.name,
    schema: p.schema,
    note: p.note,
    probe: p.probe,
    contrastsWith: p.contrastsWith,
    requires: p.requires,
    mask: p.mask,
    maskFlags: p.maskFlags,
    counts: p.counts,
  }));
  return NextResponse.json({ built, patterns: metas });
}
