import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// Vraie sauvegarde : la progression (modèle cognitif + jeu) est répliquée sur
// disque · elle survit à un nettoyage du navigateur / changement de navigateur.
// data/progress.json est gitignoré ; un backup du jour précédent est conservé.
const FILE = path.join(process.cwd(), "data", "progress.json");
const BAK = path.join(process.cwd(), "data", "progress.bak.json");

type Saved = { savedAt: number; state: Record<string, string> };

export async function GET() {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, "utf8")) as Saved;
    return NextResponse.json(d);
  } catch {
    return NextResponse.json({ savedAt: 0, state: {} });
  }
}

export async function PUT(req: NextRequest) {
  let body: Saved;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (typeof body?.savedAt !== "number" || typeof body?.state !== "object" || !body.state)
    return NextResponse.json({ error: "bad shape" }, { status: 400 });

  try {
    // backup du jour précédent avant d'écraser
    if (fs.existsSync(FILE)) {
      const prev = JSON.parse(fs.readFileSync(FILE, "utf8")) as Saved;
      const day = (t: number) => new Date(t).toISOString().slice(0, 10);
      if (prev.savedAt && day(prev.savedAt) !== day(body.savedAt)) fs.copyFileSync(FILE, BAK);
    }
    fs.writeFileSync(FILE, JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
