import { NextRequest, NextResponse } from "next/server";
import { deck } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const limit = Math.min(
    2000,
    Number(req.nextUrl.searchParams.get("limit") ?? 500)
  );
  return NextResponse.json(deck().slice(0, limit));
}
