import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  let v = "dev";
  try {
    v = fs.readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {}
  let data = 0;
  try {
    for (const f of ["patterns.json", "scenes.json", "pairs.json"]) {
      const st = fs.statSync(path.join(process.cwd(), "data", f));
      data = Math.max(data, Math.floor(st.mtimeMs));
    }
  } catch {}
  return NextResponse.json({ v: `${v}-${data}` });
}
