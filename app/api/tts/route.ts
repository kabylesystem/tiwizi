import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fold } from "@/lib/normalize";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

// TTS à la demande pour les MOTS (cartes, fiches) · généré une fois, servi
// depuis public/tts ensuite. Le python tourne via systemd-run HORS du cgroup
// du service (torch ~2 Go dépasserait MemoryMax).
const inflight = new Map<string, Promise<void>>();

function genOnce(text: string, out: string): Promise<void> {
  const existing = inflight.get(out);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    execFile(
      "systemd-run",
      ["--user", "--scope", "--quiet", "/usr/bin/uv", "run", "--with", "transformers", "--with", "torch", "--with", "scipy",
       "python", path.join(process.cwd(), "scripts", "tts-one.py"), text, out],
      { timeout: 170_000, cwd: process.cwd() },
      (err) => (err ? reject(err) : resolve())
    );
  }).finally(() => inflight.delete(out));
  inflight.set(out, p);
  return p;
}

export async function GET(req: NextRequest) {
  const t = (req.nextUrl.searchParams.get("t") || "").trim();
  if (!t || t.length > 60 || !/^[\p{L}\p{N}\s'·,.!?-]+$/u.test(t))
    return NextResponse.json({ error: "bad text" }, { status: 400 });
  const key = fold(t).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  if (!key) return NextResponse.json({ error: "bad key" }, { status: 400 });
  const url = `/tts/w-${key}.mp3`;
  const file = path.join(process.cwd(), "public", "tts", `w-${key}.mp3`);
  if (!existsSync(file)) {
    try {
      await genOnce(t, file);
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ url });
}
