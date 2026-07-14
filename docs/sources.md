# Tiwizi · sources.md (registre de provenance)

> Règle backend (complément de `pedagogie.md`) : tout contenu kabyle affiché a
> une source humaine traçable listée ICI. Pas de citation dans l'UI pendant
> l'entraînement (choix de naly, 2026-07-14) : la garantie est structurelle,
> pas décorative. Un LLM n'écrit JAMAIS le kabyle montré ; quand un LLM écrit
> À PROPOS du kabyle (notes de patterns, Idir), c'est vérifié contre ce registre.

## Intégré (dans `data/`)

| Source | Contenu dans l'app | Licence | Fiabilité |
|---|---|---|---|
| Tatoeba (exports officiels) | 208 292 phrases kab↔fr, phrases des patterns, jumeaux | CC-BY 2.0 FR | phrases écrites par des contributeurs natifs ; qualité communautaire, très bonne sur le kabyle (communauté active) |
| Audio Tatoeba (CDN) | 22 621 voix NATIVES (licence vérifiée, sinon 403) | CC (par audio) | natif |
| Dallet, *Dictionnaire kabyle-français* (1982), via DigitizedDallet | dico 12 510 entrées, fiches tap-sur-mot | MIT (numérisation) | LA référence lexicographique du kabyle |
| Assimil « Le Kabyle de poche » (OCR des 112 pages du livre de naly) | grounding d'Idir, prononciation | usage perso | éditorial, révisé |
| Boulifa, *Une première année de langue kabyle* (pp. 12-15) | règles de prononciation (`lib/pronunciation.ts`) | domaine public | académique (1897/1910) |
| Decks Anki de naly (grammaire compilée de ses cours) | `grammar-kb.json` (761 fiches), grounding Idir | perso | compilé de sources de cours réelles |
| Meta MMS `facebook/mms-tts-kab` | voix SYNTHÉTIQUE des phrases sans audio natif (bouton azur) | CC-BY-NC 4.0 | entraîné sur du kabyle réel ; approuvé à l'écoute par naly (2026-07-14) ; ne remplace jamais une voix native disponible |

## Contenu autoré (le seul écrit "de tête") et sa vérification

Les 13 définitions de patterns (`scripts/build-patterns.mjs` : schémas, notes,
probes, corruptions) sont écrites par l'assistant puis **vérifiées par
croisement** contre grammar-kb + Assimil + Dallet (audit du 2026-07-14 :
chaque note retrouvée dans les sources, zéro contradiction ; ex. « ɣur-i
axxam = j'ai une maison », « bɣiɣ ad ruḥeɣ », indice « -ɣ » du je, « -aɣ » =
nous exclu du détecteur). Toute nouvelle note de pattern DOIT passer le même
audit avant d'entrer dans l'app.

## Candidats vérifiés (vivants, à intégrer en phase 2+)

| Source | Ce que ça apporterait | Note |
|---|---|---|
| [amyag.com](https://www.amyag.com/) (Naït-Zerrad, *Manuel de conjugaison kabyle*, 6000 verbes / 176 classes) | conjugueur : valider les formes verbales des exercices de transformation, futurs patterns de conjugaison | LA référence conjugaison ; déjà notée dans session.md |
| Mozilla Common Voice kab (~571 h, CC0) | variation massive de voix natives, sprints d'écoute, ASR un jour | dataset énorme, licence idéale |
| [Glosbe kab-fr](https://fr.glosbe.com/kab/fr) | dico communautaire + phrases alignées | ⚠️ corpus parallèles hétérogènes : à n'utiliser QUE comme recoupement, jamais source primaire |
| [dictionnaire-kabyle.com](https://www.dictionnaire-kabyle.com/) (DIKAB) | dico avec exemples de son propre corpus | recoupement du Dallet (mots récents) |
| [Lexilogos kabyle](https://www.lexilogos.com/kabyle_dictionnaire.htm) | hub de dictionnaires/grammaires académiques numérisés | porte d'entrée vers les PDF académiques |
| Centre de Recherche Berbère (INALCO) | grammaires/notices académiques PDF | académique |
| Mammeri, *Tajeṛṛumt n tmaziɣt* + Amawal | grammaire de référence, néologismes | livres à sourcer |
| Recueils d'inzan (proverbes) | idiomes/expressions avec attestation | à sourcer proprement (édition papier numérisée) |

## Règles d'intégration d'une nouvelle source
1. Provenance identifiable (auteur/éditeur/communauté) + licence notée ici.
2. Le kabyle entre tel quel (jamais « corrigé » par un LLM).
3. Les sources communautaires (Glosbe…) ne servent qu'au recoupement.
4. Une ligne dans ce tableau AVANT le code.
