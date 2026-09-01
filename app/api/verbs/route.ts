import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "verbs.json"), "utf8"));
    return NextResponse.json({ verbs: v });
  } catch {
    return NextResponse.json({ verbs: [] });
  }
}
