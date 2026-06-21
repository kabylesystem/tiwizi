import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { searchSentences } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `Tu es Idir, un fennec sympathique, tuteur de kabyle (taqbaylit). L'élève s'appelle naly, débutant, et veut tenir de VRAIES conversations (politique, société, quotidien) d'ici décembre.

RÈGLES STRICTES :
- Tu TIENS l'élève par la main : une seule idée et UNE seule question à la fois, réponses courtes (2-4 phrases).
- Parle en kabyle SIMPLE, puis donne la traduction française entre parenthèses juste après. Ex : « Azul! Amek i telliḍ? (Bonjour ! Comment vas-tu ?) »
- Corrige ses erreurs avec douceur en montrant la bonne forme.
- Orthographe latine standard du kabyle (ɣ ɛ ḥ ṣ ṭ ḍ ẓ č ǧ). Pas de tifinagh.
- N'INVENTE JAMAIS un mot kabyle dont tu n'es pas sûr. En cas de doute, reste sur le vocabulaire vérifié ci-dessous ou dis honnêtement que tu n'es pas certain. Mieux vaut peu et juste que beaucoup et faux.
- Encourage, reste chaleureux, mais ne récite pas : fais-le PARLER.`;

function buildPrompt(messages: Msg[], grounding: string) {
  const convo = messages
    .map((m) => (m.role === "user" ? `Élève : ${m.content}` : `Idir : ${m.content}`))
    .join("\n");
  return `${grounding}\n\nConversation jusqu'ici :\n${convo}\n\nRéponds maintenant en tant qu'Idir (kabyle simple + traduction française).`;
}

export async function POST(req: NextRequest) {
  let body: { messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const messages = (body.messages || []).slice(-12);
  if (!messages.length) return NextResponse.json({ error: "no messages" }, { status: 400 });

  // grounding: real verified phrases related to the last user message
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const refs = searchSentences(last, 8)
    .slice(0, 8)
    .map((p) => `- ${p.kab} = ${p.fr}`)
    .join("\n");
  const grounding = refs
    ? `Vocabulaire / phrases kabyles VÉRIFIÉS (réels, appuie-toi dessus, ne dévie pas) :\n${refs}`
    : "Reste sur le vocabulaire kabyle de base que tu connais avec certitude.";

  const prompt = buildPrompt(messages, grounding);

  try {
    const text = await new Promise<string>((resolve, reject) => {
      execFile(
        "claude",
        ["-p", prompt, "--append-system-prompt", SYSTEM],
        { timeout: 110_000, maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve(stdout.trim());
        }
      );
    });
    return NextResponse.json({ reply: text });
  } catch (e) {
    return NextResponse.json(
      { error: "tutor_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
