import { NextRequest, NextResponse } from "next/server";
import { searchSentences } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(searchSentences(q));
}
