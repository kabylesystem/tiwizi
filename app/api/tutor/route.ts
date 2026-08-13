import { NextRequest, NextResponse } from "next/server";
import { askClaude, askClaudeStream, prewarm } from "@/lib/claude-pool";
import { searchSentences, searchGrammar, searchAssimil, patternsIndex } from "@/lib/data";
import { PRONUNCIATION_REF, PRON_TRIGGER } from "@/lib/pronunciation";
import { fold } from "@/lib/normalize";
import type { CogSnapshot } from "@/lib/cognitive-model";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };

const COACH = `Tu es Idir, un fennec, tuteur de kabyle bienveillant. Réponds en 1 à 3 phrases MAX, clair, concret et encourageant, pour un débutant. Donne directement l'explication utile (PAS de question en retour). Kabyle en orthographe latine (ɣ ɛ ḥ ṣ ṭ ḍ ẓ). N'invente jamais un mot kabyle dont tu n'es pas sûr : appuie-toi sur le vocabulaire vérifié fourni, sinon reste prudent. Pour la prononciation, n'invente aucune transcription : donne une règle sûre et renvoie à l'écoute de l'audio natif.`;

const CORRECT = `Tu es Idir, correcteur de kabyle bienveillant et PRUDENT. L'élève débutant a écrit SA PROPRE phrase kabyle. Ta réponse, en 4 lignes MAX :
1. Verdict honnête : correcte / presque / à revoir.
2. La forme corrigée en kabyle (orthographe latine ɣ ɛ ḥ ṣ ṭ ḍ ẓ) · reste au PLUS PRÈS de sa phrase, corrige seulement ce qui est faux.
3. UNE phrase d'explication (la structure, pas un cours).
0. AVANT tout, ta TOUTE PREMIÈRE ligne doit être exactement « NIVEAU:x » où x est ton jugement de la phrase : 0 = à revoir entièrement · 1 = plusieurs fautes mais la structure est là · 2 = bien, une petite faute · 3 = parfaite. Rien d'autre sur cette ligne.
RÈGLES DURES : appuie-toi sur les phrases vérifiées du corpus fournies (elles montrent l'usage réel) ; si tu n'es pas SÛR d'un mot ou d'une forme, dis-le honnêtement (« je ne suis pas certain de X ») plutôt que d'inventer ; félicite ce qui est juste. JAMAIS de kabyle inventé exotique.`;

const SYSTEM = `Tu es Idir, un fennec sympathique, tuteur de kabyle (taqbaylit). L'élève s'appelle naly, débutant, et veut tenir de VRAIES conversations (politique, société, quotidien) d'ici décembre. Il te parle DEPUIS l'app Tiwizi : dans ce chat, il peut taper n'importe quel mot kabyle pour ouvrir sa fiche et l'écouter avec le bouton 🔊 (ne lui dis jamais qu'il n'a pas accès à l'audio).

RÈGLES STRICTES :
- L'élève est un VRAI DÉBUTANT. Tu TIENS l'élève par la main : une seule idée et UNE seule question à la fois, réponses courtes (2-4 phrases).
- MAXIMUM UNE phrase kabyle nouvelle par message, COURTE (3 à 6 mots), tirée des phrases vérifiées fournies quand c'est possible. Jamais deux phrases kabyles nouvelles d'affilée : il décroche.
- CHAQUE phrase ou expression kabyle que tu écris, SANS AUCUNE EXCEPTION, est immédiatement suivie de sa traduction française entre parenthèses. Ex : « Azul! Amek i telliḍ? (Bonjour ! Comment vas-tu ?) » Une phrase kabyle sans traduction = interdit, même en exemple, même en question finale.
- Corrige ses erreurs avec douceur en montrant la bonne forme.
- Orthographe latine standard du kabyle (ɣ ɛ ḥ ṣ ṭ ḍ ẓ č ǧ). Pas de tifinagh.
- N'INVENTE JAMAIS un mot kabyle dont tu n'es pas sûr. En cas de doute, reste sur le vocabulaire vérifié ci-dessous ou dis honnêtement que tu n'es pas certain. Mieux vaut peu et juste que beaucoup et faux.
- Chaque mot kabyle NOUVEAU que tu enseignes doit être PRÉSENT dans les phrases vérifiées, la grammaire ou le livre fournis dans ce message. S'il n'y est pas : ne l'enseigne pas, dis « je n'ai pas le mot vérifié pour X » et construis la leçon avec ce qui existe.
- PRONONCIATION : ne donne JAMAIS de transcription phonétique inventée (du genre « ça se dit X de Y »). Donne seulement des règles sûres et renvoie l'élève à l'écoute de l'audio natif dans l'app. Si des règles de prononciation vérifiées te sont fournies, utilise UNIQUEMENT celles-là.
- Si l'élève demande « comment on dit X » : cherche X dans les phrases vérifiées fournies et réponds avec CETTE forme. Si elle n'y est pas, dis-le franchement (« je n'ai pas la forme sûre pour X ») et donne la formulation vérifiée la plus proche. N'invente JAMAIS un verbe ni une conjugaison.
- Question MÉTA (prononciation, grammaire, « comment on dit », « c'est quoi ») : réponds en FRANÇAIS directement, sans phrase d'ouverture en kabyle. Le kabyle est réservé aux phrases cibles et aux exemples vérifiés.
- Si des RÈGLES DE PRONONCIATION te sont fournies et que l'élève demande la prononciation d'un mot : APPLIQUE-les concrètement à CE mot, lettre par lettre ou syllabe par syllabe (ce n'est pas une transcription inventée, c'est la règle vérifiée). Puis termine par : « tape le mot dans le chat, sa fiche s'ouvre avec un bouton 🔊 pour l'écouter ».
- Tu n'écris QUE l'alphabet kabyle latin (a-z + ɣ ɛ ḥ ṣ ṭ ḍ ẓ ṛ č ǧ) et le français. JAMAIS un caractère cyrillique, arabe, tifinagh ou autre.
- JAMAIS de tiret cadratin (—) dans tes réponses : utilise deux-points, virgule ou point médian.
- Encourage, reste chaleureux, mais ne récite pas : fais-le PARLER.`;

function analyzeTD(word: string): string | null {
  const letters = [...word.toLowerCase()];
  const parts: string[] = [];
  for (let i = 0; i < letters.length; i++) {
    const c = letters[i];
    if (c === "\u1e6d" || c === "\u1e0d") {
      parts.push(`${c} (position ${i + 1}) : emphatique, net et sombre`);
      continue;
    }
    if (c !== "t" && c !== "d") continue;
    const prev = letters[i - 1];
    if (prev === c) continue;
    const th = c === "t" ? "th SOURD de « thing »" : "th SONORE de « this »";
    if (letters[i + 1] === c) parts.push(`${c}${c} (position ${i + 1}) : géminée, occlusive nette et LONGUE`);
    else if (prev === "n" || prev === "l") parts.push(`${c} (position ${i + 1}, après ${prev}) : occlusif net`);
    else {
      const where = i === 0 ? "initial" : i === letters.length - 1 ? `final, après ${prev}` : `après ${prev}`;
      parts.push(`${c} (position ${i + 1}, ${where}) : spirant, ${th}`);
    }
  }
  if (!parts.length) return null;
  return `${word} = ${letters.join("\u00b7")} \u2192 ${parts.join(" ; ")}`;
}

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
  if (snap.learning) lines.push(`- Pattern EN COURS d'induction (exposé mais pas encore abstrait · ne pas expliquer la règle à sa place !) : ${name(snap.learning)}`);
  if (snap.due.length)
    lines.push(`- À RÉACTIVER aujourd'hui : ${snap.due.map((d) => `${name(d.id)} (${d.channels.map((c) => CHANNEL_FR[c] ?? c).join(", ")})`).join(" · ")}`);
  if (snap.weak.length)
    lines.push(`- Points FAIBLES mesurés : ${snap.weak.map((w) => `${name(w.id)} · ${CHANNEL_FR[w.channel] ?? w.channel} (${w.lapses} rechutes)`).join(" · ")}`);
  if (snap.confusions.length)
    lines.push(`- CONFUSIONS récurrentes : ${snap.confusions.map((c) => `${name(c.id)} ↔ ${name(c.with)} (${c.n}×)`).join(" · ")}`);
  if (!lines.length) lines.push("- Élève tout neuf : aucune session encore. Reste sur les bases.");
  return `\n\nPROFIL COGNITIF DE L'ÉLÈVE (mesuré par l'app · fiable, utilise-le) :\n${lines.join("\n")}\nCONSIGNE : glisse naturellement dans la conversation des occasions d'utiliser les patterns à réactiver/faibles (pose des questions dont la réponse naturelle les mobilise). Ne révèle JAMAIS la règle d'un pattern en cours d'induction · donne des exemples authentiques à la place.`;
}

export async function GET() {
  prewarm();
  return NextResponse.json({ warm: true });
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
  const messages = (body.messages || []).slice(-8);
  if (!coach && !correct && !messages.length) return NextResponse.json({ error: "no messages" }, { status: 400 });
  if ((coach || correct) && !body.ask) return NextResponse.json({ error: "no ask" }, { status: 400 });

  // grounding: real verified phrases related to the topic
  const last = coach || correct ? body.ask! : [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const refs = searchSentences(last, correct ? 8 : 5)
    .slice(0, correct ? 8 : 5)
    .map((p) => `- ${p.kab} = ${p.fr}`)
    .join("\n");
  const vocab = refs
    ? `Vocabulaire / phrases kabyles VÉRIFIÉS (réels, appuie-toi dessus, ne dévie pas) :\n${refs}`
    : "Reste sur le vocabulaire kabyle de base que tu connais avec certitude.";

  // grounded GRAMMAR (naly's Anki decks: système verbal, présentatifs, prépositions…)
  const gram = searchGrammar(last, correct ? 6 : 2)
    .map((g) => `- Q: ${g.q}\n  R: ${g.a}`)
    .join("\n");
  const gramGrounding = gram
    ? `\n\nGRAMMAIRE KABYLE VÉRIFIÉE (utilise ces explications/traductions EXACTES, ne les contredis pas) :\n${gram}`
    : "";

  // le livre Assimil : seulement pour la CORRECTION (chunks OCR lourds,
  // le chat doit rester rapide : premier mot < 3 s)
  const book = (correct ? searchAssimil(last, 4) : [])
    .map((c) => `[${c.title}] ${c.text}`)
    .join("\n---\n");
  const bookGrounding = book
    ? `\n\nEXTRAITS DU LIVRE ASSIMIL « LE KABYLE DE POCHE » (référence faisant autorité, appuie-toi dessus) :\n${book}`
    : "";

  // pronunciation rules only when relevant (keeps prompts lean) ·
  // fenêtre des 3 derniers messages élève : résiste aux typos (« ornonce »)
  const pronWindow = coach || correct
    ? last
    : messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join(" ");
  const pron = PRON_TRIGGER.test(pronWindow) ? `\n\n${PRONUNCIATION_REF}` : "";

  // l'analyse t/d est DÉTERMINISTE → calculée par le code, pas par le LLM
  // (un LLM ne sait pas épeler : « t après n » inventé, th sourd/sonore confondus)
  let pronCalc = "";
  if (pron) {
    const lastAssistant = messages.filter((m) => m.role === "assistant").slice(-2).map((m) => m.content).join(" ");
    const seen = new Set<string>();
    const cand = (pronWindow + " " + lastAssistant)
      .toLowerCase()
      .replace(/[^\p{L}'-]+/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && /[td\u1e6d\u1e0d]/.test(t) && !seen.has(t) && (seen.add(t), true))
      .filter((t) => /[\u0263\u025b\u1e25\u1e63\u1e6d\u1e0d\u1e93\u1e5b\u010d\u01e7]/.test(t) || searchSentences(t, 3).some((p) => fold(p.kab).includes(fold(t))))
      .slice(0, 6);
    const lines = cand.map(analyzeTD).filter(Boolean) as string[];
    if (lines.length)
      pronCalc = `\n\nANALYSE MÉCANIQUE DES T/D (calculée par l'app en appliquant les règles vérifiées ci-dessus · FIABLE · si l'élève demande la prononciation d'un de ces mots, recopie l'analyse du mot concerné TELLE QUELLE, en français, sans la recalculer) :\n${lines.map((l) => `- ${l}`).join("\n")}`;
  }

  const grounding = vocab + bookGrounding + gramGrounding + pron + pronCalc + cogGrounding(body.cogState);
  const prompt =
    coach || correct ? `${grounding}\n\nDemande : ${body.ask}` : buildPrompt(messages, grounding);
  const system = correct ? CORRECT : coach ? COACH : SYSTEM;

  // le CHAT streame : les mots d'Idir arrivent au fil de l'eau
  if (!coach && !correct) {
    const encoder = new TextEncoder();
    const full = `${system}\n\n---\n\n${prompt}`;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        try {
          const reply = await askClaudeStream(full, "sonnet", (t) => send({ d: t.replaceAll("\u2014", "\u00b7") }));
          send({ done: reply.replaceAll("\u2014", "\u00b7") });
        } catch (e) {
          send({ error: e instanceof Error ? e.message : String(e) });
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  try {
    // coach = micro-explications → haiku (rapide) · correction → sonnet
    const text = await askClaude(`${system}\n\n---\n\n${prompt}`, coach ? "haiku" : "sonnet");
    return NextResponse.json({ reply: text });
  } catch (e) {
    return NextResponse.json(
      { error: "tutor_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
