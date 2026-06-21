# Awal — session.md

## Objectif
Le meilleur système pour que **naly** devienne fluent en kabyle. Pratique
quotidienne ~20 min (plus les bons jours), **multi-format**, contenu humain vérifié.

## Décision d'architecture clé
Les LLM sont faibles en kabyle → on **ancre tout sur des sources humaines**
(Tatoeba, Dallet). Un tuteur IA viendra *par-dessus* ce corpus, jamais à sa place.

## Données (versionnées dans `data/`)
- `pairs.json` — 208 292 paires kab↔fr (Tatoeba, CC-BY)
- `deck.json` — 2 000 phrases débutant (audio, 2–9 mots), triées par difficulté
- `dict.json` — 12 510 entrées Dallet (MIT)
- 23 171 phrases ont de l'audio natif (CDN `audio.tatoeba.org`)
- Pipeline reproductible : `scripts/build-data.sh`

## Construit (v1)
- **/learn** — flashcards SRS (SM-2), audio auto, clavier (espace + 1-4), progression locale
- **/browse** — recherche du corpus, audio, mode « FR caché »
- **/dictionary** — recherche Dallet, classée (mot kabyle avant les sens)
- Accueil avec carte « aujourd'hui » (série, à réviser, nouvelles)
- Design system posé (voir design.md), polish desktop + mobile fait

## Roadmap → fluidité (multi-format)
Pour viser la production orale, pas seulement la reconnaissance :
1. **Session quotidienne guidée** (~20 min) qui enchaîne plusieurs formats.
2. **Formats d'exercice** : écoute→sens · reconstruire la phrase (banque de mots) ·
   fr→kab (production écrite) · dictée audio · QCM rapide.
3. **Tuteur IA ancré** (conversation kab, correction) — sur **crédits du plan**, pas l'API.
4. **Grammaire essentielle** (état d'annexion, conjugaison : aoriste/prétérit/intensif).
5. Objectifs/streak, choix du volume quotidien.

## Note honnête sur « fluent en 3-4 mois »
20 min/jour pendant 3-4 mois ≈ 30-40 h. C'est assez pour une **base solide**
(comprendre, lire, tenir une conversation simple), pas pour une fluidité totale.
La fluidité réelle demande de la **production parlée** régulière — d'où le tuteur IA
+ idéalement parler avec des natifs. L'app maximise le rythme ; le reste, c'est l'oral.

## Sources non encore exploitées (recherche interrompue)
Common Voice kab (~571 h audio CC0), conjugaison Naït-Zerrad (176 classes, amyag.com),
chansons avec paroles, Wikipédia kab. À intégrer plus tard.
