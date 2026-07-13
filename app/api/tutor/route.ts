import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { searchSentences, searchGrammar, searchAssimil, patternsIndex } from "@/lib/data";
import { PRONUNCIATION_REF, PRON_TRIGGER } from "@/lib/pronunciation";
import type { CogSnapshot } from "@/lib/cognitive-model";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };

const COACH = `Tu es Idir, un fennec, tuteur de kabyle bienveillant. Réponds en 1 à 3 phrases MAX, clair, concret et encourageant, pour un débutant. Donne directement l'explication utile (PAS de question en retour). Kabyle en orthographe latine (ɣ ɛ ḥ ṣ ṭ ḍ ẓ). N'invente jamais un mot kabyle dont tu n'es pas sûr : appuie-toi sur le vocabulaire vérifié fourni, sinon reste prudent. Pour la prononciation, n'invente aucune transcription : donne une règle sûre et renvoie à l'écoute de l'audio natif.`;

const CORRECT = `Tu es Idir, correcteur de kabyle bienveillant et PRUDENT. L'élève débutant a écrit SA PROPRE phrase kabyle. Ta réponse, en 4 lignes MAX :
1. Verdict honnête : correcte / presque / à revoir.
2. La forme corrigée en kabyle (orthographe latine ɣ ɛ ḥ ṣ ṭ ḍ ẓ) — reste au PLUS PRÈS de sa phrase, corrige seulement ce qui est faux.
3. UNE phrase d'explication (la structure, pas un cours).
RÈGLES DURES : appuie-toi sur les phrases vérifiées du corpus fournies (elles montrent l'usage réel) ; si tu n'es pas SÛR d'un mot ou d'une forme, dis-le honnêtement (« je ne suis pas certain de X ») plutôt que d'inventer ; félicite ce qui est juste. JAMAIS de kabyle inventé exotique.`;

const SYSTEM = `Tu es Idir, un fennec sympathique, tuteur de kabyle (taqbaylit). L'élève s'appelle naly, débutant, et veut tenir de VRAIES conversations (politique, société, quotidien) d'ici décembre.

RÈGLES STRICTES :
- Tu TIENS l'élève par la main : une seule idée et UNE seule question à la fois, réponses courtes (2-4 phrases).
- Parle en kabyle SIMPLE, puis donne la traduction française entre parenthèses juste après. Ex : « Azul! Amek i telliḍ? (Bonjour ! Comment vas-tu ?) »
- Corrige ses erreurs avec douceur en montrant la bonne forme.
- Orthographe latine standard du kabyle (ɣ ɛ ḥ ṣ ṭ ḍ ẓ č ǧ). Pas de tifinagh.
- N'INVENTE JAMAIS un mot kabyle dont tu n'es pas sûr. En cas de doute, reste sur le vocabulaire vérifié ci-dessous ou dis honnêtement que tu n'es pas certain. Mieux vaut peu et juste que beaucoup et faux.
- PRONONCIATION : ne donne JAMAIS de transcription phonétique inventée (du genre « ça se dit X de Y »). Donne seulement des règles sûres et renvoie l'élève à l'écoute de l'audio natif dans l'app. Si des règles de prononciation vérifiées te sont fournies, utilise UNIQUEMENT celles-là.
- Encourage, reste chaleureux, mais ne récite pas : fais-le PARLER.`;

function buildPrompt(messages: Msg[], grounding: string) {
  const convo = messages
    .map((m) => (m.role === "user" ? `Élève : ${m.content}` : `Idir : ${m.content}`))
    .join("\n");
  return `${grounding}\n\nConversation jusqu'ici :\n${convo}\n\nRéponds maintenant en tant qu'Idir (kabyle simple + traduction française).`;
}

const CHANNEL_FR: Record<string, string> = {
  recogText: "reconnaître à l'écrit",
  recogAudio: "comprendre à l'oreille",
  predict: "anticiper la forme",
  produce: "produire",
};

/** Le profil cognitif mesuré par l'app, formaté pour Idir. */
function cogGrounding(snap: CogSnapshot | undefined): string {
  if (!snap) return "";
  const byId = Object.fromEntries(patternsIndex().patterns.map((p) => [p.id, p]));
  const name = (id: string) => byId[id]?.name ?? id;
  const lines: string[] = [];
  if (snap.abstracted.length) lines.push(`- Patterns déjà EXTRAITS (il les a induits lui-même) : ${snap.abstracted.map(name).join(" · ")}`);
  if (snap.learning) lines.push(`- Pattern EN COURS d'induction (exposé mais pas encore abstrait — ne pas expliquer la règle à sa place !) : ${name(snap.learning)}`);
  if (snap.due.length)
    lines.push(`- À RÉACTIVER aujourd'hui : ${snap.due.map((d) => `${name(d.id)} (${d.channels.map((c) => CHANNEL_FR[c] ?? c).join(", ")})`).join(" · ")}`);
  if (snap.weak.length)
    lines.push(`- Points FAIBLES mesurés : ${snap.weak.map((w) => `${name(w.id)} — ${CHANNEL_FR[w.channel] ?? w.channel} (${w.lapses} rechutes)`).join(" · ")}`);
  if (snap.confusions.length)
    lines.push(`- CONFUSIONS récurrentes : ${snap.confusions.map((c) => `${name(c.id)} ↔ ${name(c.with)} (${c.n}×)`).join(" · ")}`);
  if (!lines.length) lines.push("- Élève tout neuf : aucune session encore. Reste sur les bases.");
  return `\n\nPROFIL COGNITIF DE L'ÉLÈVE (mesuré par l'app — fiable, utilise-le) :\n${lines.join("\n")}\nCONSIGNE : glisse naturellement dans la conversation des occasions d'utiliser les patterns à réactiver/faibles (pose des questions dont la réponse naturelle les mobilise). Ne révèle JAMAIS la règle d'un pattern en cours d'induction — donne des exemples authentiques à la place.`;
}

export async function POST(req: NextRequest) {
  let body: { messages?: Msg[]; mode?: string; ask?: string; cogState?: CogSnapshot };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const coach = body.mode === "coach";
  const correct = body.mode === "correct";
  const messages = (body.messages || []).slice(-12);
  if (!coach && !correct && !messages.length) return NextResponse.json({ error: "no messages" }, { status: 400 });
  if ((coach || correct) && !body.ask) return NextResponse.json({ error: "no ask" }, { status: 400 });

  // grounding: real verified phrases related to the topic
  const last = coach || correct ? body.ask! : [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const refs = searchSentences(last, 8)
    .slice(0, 8)
    .map((p) => `- ${p.kab} = ${p.fr}`)
    .join("\n");
  const vocab = refs
    ? `Vocabulaire / phrases kabyles VÉRIFIÉS (réels, appuie-toi dessus, ne dévie pas) :\n${refs}`
    : "Reste sur le vocabulaire kabyle de base que tu connais avec certitude.";

  // grounded GRAMMAR (naly's Anki decks: système verbal, présentatifs, prépositions…)
  const gram = searchGrammar(last, 6)
    .map((g) => `- Q: ${g.q}\n  R: ${g.a}`)
    .join("\n");
  const gramGrounding = gram
    ? `\n\nGRAMMAIRE KABYLE VÉRIFIÉE (utilise ces explications/traductions EXACTES, ne les contredis pas) :\n${gram}`
    : "";

  // the Assimil "Le Kabyle de poche" book itself (OCR), retrieved per query
  const book = searchAssimil(last, 4)
    .map((c) => `[${c.title}] ${c.text}`)
    .join("\n---\n");
  const bookGrounding = book
    ? `\n\nEXTRAITS DU LIVRE ASSIMIL « LE KABYLE DE POCHE » (référence faisant autorité, appuie-toi dessus) :\n${book}`
    : "";

  // pronunciation rules only when relevant (keeps prompts lean)
  const pron = PRON_TRIGGER.test(last) ? `\n\n${PRONUNCIATION_REF}` : "";

  const grounding = vocab + bookGrounding + gramGrounding + pron + cogGrounding(body.cogState);
  const prompt =
    coach || correct ? `${grounding}\n\nDemande : ${body.ask}` : buildPrompt(messages, grounding);
  const system = correct ? CORRECT : coach ? COACH : SYSTEM;

  try {
    const text = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        "claude",
        ["-p", prompt, "--append-system-prompt", system, "--model", "sonnet", "--max-turns", "1"],
        { timeout: 110_000, maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) reject(new Error(stderr || err.message));
          else resolve(stdout.trim());
        }
      );
      child.stdin?.end(); // le CLI attend sinon un stdin pendant 3s
    });
    return NextResponse.json({ reply: text });
  } catch (e) {
    return NextResponse.json(
      { error: "tutor_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
