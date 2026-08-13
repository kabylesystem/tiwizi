import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const INBOX = path.join(process.cwd(), "data", "tg-inbox.json");

export async function GET() {
  try {
    const cards = JSON.parse(fs.readFileSync(INBOX, "utf8"));
    return NextResponse.json({ cards: Array.isArray(cards) ? cards : [] });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}

export async function DELETE() {
  try {
    fs.writeFileSync(INBOX, "[]");
  } catch {}
  return NextResponse.json({ ok: true });
}
