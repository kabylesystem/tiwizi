# Tiwizi — session.md

## Objectif
Le meilleur système pour que **naly** devienne fluent en kabyle. Minimum **15 min/jour**
(sans excuse — il en fera souvent plus). La vision pédagogique complète et NON-NÉGOCIABLE
est dans **`docs/pedagogie.md`** : moteur cognitif pattern-based, anti-Duolingo.

## Décisions d'architecture clés
- Les LLM sont faibles en kabyle → **tout le kabyle vient de sources humaines**
  (Tatoeba, Dallet, Assimil). Le tuteur IA vient *par-dessus* ce corpus, jamais à sa place.
- **Le pattern est l'unité atomique** (graphe, pas leçons linéaires) ; modèle cognitif
  par pattern × canal (lecture / oreille / anticipation / production) ; induction avant
  explication ; l'erreur replanifie l'input. La rétention vit DANS l'app (spacing SM-2
  par canal) — pas d'export Anki.

## Données (versionnées dans `data/`)
- `pairs.json` — 208 292 paires kab↔fr (Tatoeba, CC-BY) ; 23 171 avec audio natif
- `patterns.json` — **graphe de 13 patterns** (négation, ad+verbe, ɣur-, yella/ulac,
  copule d, acu/anda/amek, bɣ-, -ɣ du je, ɣer/deg) + instances indexées + **jumeaux de
  transformation minés** (400×2 : « Ččiɣ ṛṛuẓ ⇄ Ur ččiɣ ara rruẓ ») + corruptions
  mécaniques traçables — `scripts/build-patterns.mjs`
- `vocab-freq.json` — fréquences lexicales corpus
- `deck.json` / `dict.json` (Dallet 12 510) / `grammar-kb.json` / `assimil-kb.json`

## Construit (v10 — phase 1 du moteur cognitif, 2026-07-13)
- **/session** — LA colonne vertébrale : un bouton, 15 min chrono, composition adaptative
  réactivation → induction/consolidation → génération, en boucle. Zéro cœurs.
- `lib/cognitive-model.ts` — état par pattern × canal (SM-2/canal, vitesse EMA, hintLevel,
  confusions, abstracted), localStorage `tiwizi.cog.v1`
- `lib/session-engine.ts` — planification des blocs + choix du format par canal
- Formats (`components/formats/`) : **Induction** (flood à surface variable → probes
  structurels sur vocab frais → note explicite APRÈS), **ListenMeaning** (récupération
  oreille/lecture, auto-évaluation), **SoundsRight** (jugement de grammaticalité sur
  corruption mécanique), **Anticipate** (prédiction avant révélation, masque du pattern),
  **Generate** (transformation par jumeaux corpus / production banque de mots)
- APIs : `/api/patterns` (graphe), `/api/pattern-material` (rotation quotidienne seedée)
- Accueil : CTA « Session du jour — 15 min » ; l'ancien parcours reste accessible
- Legacy conservé : /lesson (parcours), /practice, /dictionary, /tutor (Idir, crédits du plan)
- Vérifié : build vert, session déroulée au navigateur (desktop 1280 + mobile 390,
  0 erreur console), chemins « abstrait » et « pattern mûrit » testés

### Raffinements issus du premier vrai test de naly (2026-07-13 soir)
- **Input enhancement** : la partie stable du pattern est SURLIGNÉE pendant le
  flood (jamais dans les probes) — « ad » ne se noie plus dans la phrase
- **Traduction jamais forcée** : « voir le sens » optionnel, « Suivant » direct
- **Induction adaptative** : « J'ai capté — teste-moi » dès la 3ᵉ phrase ;
  `floodLen` (3..8) s'ajuste à la vitesse réelle (skip réussi → plus court)
- **Flood compréhensible** : le mineur privilégie le vocabulaire fréquent du corpus
- **Audio réparé** : les audios Tatoeba SANS licence renvoient 403 → re-filtrage
  par licence (`scripts/fix-audio-licenses.mjs`) + fallback bouton audio
- **Idir branché sur le modèle cognitif** : chaque appel (chat + coach) envoie
  `cogSnapshot` (extraits, en-cours, dûs, faibles, confusions) ; la route le
  formate en profil, avec consigne de mobiliser les patterns dus et de ne JAMAIS
  révéler la règle d'un pattern en induction. Bouton « Pourquoi ? Demande à
  Idir » sur les échecs de jugement/production.

### v11-v17 (nuit du 14 au 16/07 · durcissement + écosystème quotidien)
- **Mes cartes** : deck personnel à SRS propre, alimenté AUTOMATIQUEMENT par les
  convs Idir (mots kabyles vérifiés multi-sources : Dallet + grammaire de naly ;
  mot inventé par le LLM = rejeté). Tap sur n'importe quel mot → fiche → carte.
- **Session quotidienne complète** : réactivation → Mes cartes (dues) →
  induction → génération finissant par l'écriture « À toi » (avec SES mots).
- **Rédaction** (page) : consignes = pattern dû + cartes dues, corrigées par Idir.
- **Reprise après crash** : snapshot continu, écran « On reprend ? ».
- **Fiabilité** : service Restart=always + plafond RAM (searchSentences allégé
  ~500 Mo), earlyoom n'exécute plus Brave, seed de rotation corrigé (bug daté),
  garde anti-navigateurs-de-test sur la sync (incident données restauré depuis
  backup), conv Idir persistante, zéro bruitage (design.md), TTS partout
  (natif doré / synthétique azur, y compris variantes « ça sonne juste ? »).
- **SRS vérifié E2E dans l'app** : Bien → intervalle 1j→3j ; Perdu → rechute,
  facilité 2.5→2.3, retour en session. (Test Playwright, 0 erreur console.)
- Idir : profil cognitif injecté, correcteur prudent, latence ≈ démarrage CLI
  (~15 s, incompressible sans daemon/streaming · piste phase 3).

### Vague 2 du graphe (2026-07-16) · 13 → 26 patterns
Conjugaison tu/il/nous (t-…-ḍ, y-/i-, n-), état d'annexion (n + w/t/y),
possessifs (-iw/-is…), mačči (vs ur…ara), ɣef, s (instrumental), prépositions
à pronom (fell-as, yid-i), démonstratifs (-agi/-nni), cleft (d…i…), ara relatif
(vs ara de négation · foil dédié), ma (si). Chaque note ancrée dans grammar-kb/
Assimil, chaque flood relu à la main (kab + fr transparents), 100% audio.
Support `exclude` ajouté au mineur (ara-rel exclut ur).

### La scène du jour (2026-07-16) · l'Assimil exploité
Le programme quotidien se termine par une SCÈNE : thème suivant la progression
du livre (salutations → route → café → marché… 12 scènes en boucle), répliques
100% natives du corpus (l'OCR du livre abîme le kabyle → jamais affiché brut).
Input narratif pur : audio natif, mots tappables, sens optionnel, zéro test.
`scripts/build-assimil-scenes.mjs` → `data/scenes.json` · `/api/scene` ·
dev : `/session?demo=scene`.

## Phase 2 (prochaines briques, dans l'ordre de valeur)
1. **Contraste** — quand `confusions[X]` monte : paires minimales côte à côte
   (yella⇄ulac, ɣer⇄deg⇄ɣur- sont déjà encodés dans le graphe)
2. **Sprint d'automatisation** — fenêtre de réponse qui rétrécit, sevrage du texte
3. **Idir dirigé par le modèle cognitif** — questions dont la réponse naturelle mobilise
   un pattern dû + probes d'attribution des confusions
4. **Production tapée** (hintLevel 0-1 — le fading est déjà dans le modèle) + shadowing
5. **Dialogues Assimil comme input narratif** ; Common Voice kab (~571 h CC0) pour la
   variation massive de voix ; alignement forcé pour l'anticipation audio réelle
6. Micro-notes de contraste dans le dico (ɣer/ɣur…)
7. ~~Vocab explicite~~ ✅ FAIT (v13) : tap sur un mot → fiche Dallet inline
   (immersion + révisions), lexique personnel `tiwizi.vocab.v1` synchronisé
8. ~~Production libre~~ ✅ FAIT (v13) : bloc « À toi » en fin de génération —
   situation par pattern, l'élève écrit SA phrase, Idir (mode `correct`,
   ancré corpus + profil) corrige avec prudence, auto-évaluation → canal produce

## Note honnête sur le rythme
15 min/jour ≈ 91 h/an : base solide + conversation simple, pas fluidité totale. Le vrai
levier = empiler du passif (musique kabyle, écoute) + de l'oral réel (famille, Idir).
L'app maximise la rétention par minute ; le reste, c'est l'exposition et l'oral.
