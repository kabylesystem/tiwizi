# Tiwizi — pedagogie.md (PRINCIPE DIRECTEUR ABSOLU)

> Ce document prime sur tout le reste. Aucune feature ne rentre dans le produit
> sans répondre à : **« Quel mécanisme cognitif précis cette interaction
> cherche-t-elle à provoquer ? »** Si la réponse est « engagement », «
> gamification » ou « tester si l'utilisateur connaît la bonne réponse », on
> repense la feature. Interdit : Duolingo-like (QCM de traduction, mots à
> deviner, phrases à trous décoratives, cœurs punitifs).

## 0. La thèse

Le cerveau n'apprend pas une langue en mémorisant des traductions ni des
règles : il **extrait le système caché** de la langue à partir d'une exposition
organisée — fréquences, co-occurrences, structures stables sous des surfaces
qui varient. Le moteur de Tiwizi est un **architecte de l'input** : il contrôle
ce que le cerveau voit, entend, prédit, produit, oublie puis retrouve.

Contrainte fondatrice (inchangée) : les LLM sont mauvais en kabyle → **tout le
kabyle montré vient de sources humaines** (Tatoeba 208k paires / 23k audio
natifs multi-locuteurs, Dallet, Assimil OCR). Le moteur organise ce corpus ;
il n'invente jamais de kabyle. Quand une mécanique exige du kabyle « déformé »
(jugements de grammaticalité), la déformation est **mécanique et traçable**
(retirer `ara` d'une négation, permuter un ordre de mots), jamais générée par
un LLM.

## 1. Étiquettes d'honnêteté

Chaque mécanisme est marqué :
- **[SOLIDE]** — effet répliqué massivement (retrieval practice, spacing,
  generation effect, statistical learning en labo).
- **[RAISONNABLE]** — bien étayé mais transfert app réelle moins direct
  (prediction-error learning, interleaving/contraste, desirable difficulties,
  fading des supports).
- **[HYPOTHÈSE]** — design pari, pas de preuve directe (jugement de
  grammaticalité comme *entraînement*, diagnostic automatique de la *cause*
  d'une erreur, dosage exact des floods).

## 2. Le PATTERN comme unité atomique (pas le mot, pas la leçon)

Un pattern = une structure latente + ce qui y varie + ce qui y reste stable.

```ts
type Pattern = {
  id: string;                 // "neg-ur-ara"
  family: string;             // "négation", "TAM", "possession", "interrogation"…
  schema: string;             // "ur + VERBE + ara"  (le squelette stable)
  slots: string[];            // ce qui varie : ["VERBE", "sujet", "objet"]
  detect: string;             // regex (kabyle brut) qui matche les instances corpus
  corrupt?: string[];         // transformations mécaniques → version agrammaticale
  contrastsWith: string[];    // concurrents confondables ("neg-ur-ara" vs "ur" seul…)
  contains: string[];         // sous-structures ("fut-ad" contient l'aoriste)
  requiresExposure: string[]; // prérequis implicites (pas des "niveaux" — des dépendances)
  note: string;               // micro-explication EXPLICITE — révélée APRÈS induction seulement
};
```

Le **pattern graph** (contrastsWith/contains/requires) remplace la liste
linéaire de leçons. Il est versionné dans `data/patterns.json`, construit par
un script offline qui indexe les 208k phrases : `patternId → instances triées`
(longueur, audio, locuteur, fréquence du vocabulaire).

Mining offline complémentaire :
- **Jumeaux de transformation** : paires de phrases du corpus qui ne diffèrent
  que par un pattern (`Yeswa aman` / `Ur yeswi ara aman`) — détectées par
  distance d'édition sur tokens foldés. C'est l'or du système : des
  transformations 100% humaines, jamais inventées.
- **Table de fréquence du vocabulaire** (pour choisir du vocab *jamais vu avec
  ce pattern* lors des probes d'abstraction, et des distracteurs plausibles).
- **Locuteurs** : `sentences_with_audio.csv` porte le nom du contributeur →
  variation réelle de voix/débit/accent, par métadonnée, pas par simulation.

## 3. Modèle cognitif par utilisateur (pas un score XP)

Par pattern × **canal**, des états séparés — parce que comprendre à l'écrit,
reconnaître dans un audio rapide, anticiper, et produire spontanément sont des
états cognitifs différents :

```ts
type ChannelState = {
  strength: number;   // planification type SM-2 par canal (spacing) [SOLIDE]
  due: number;
  reps: number; lapses: number;
  meanMs: number;     // vitesse de traitement (proxy d'automatisation) [RAISONNABLE]
  hintLevel: number;  // niveau d'indice encore nécessaire (fading) [RAISONNABLE]
};
type PatternSkill = {
  exposure: number;                          // combien d'instances rencontrées
  channels: {
    recogText: ChannelState;                 // reconnaître/comprendre à l'écrit
    recogAudio: ChannelState;                // idem audio seul (sans texte)
    predict: ChannelState;                   // anticiper la forme avant révélation
    produce: ChannelState;                   // générer (banque de mots → tapé → oral)
  };
  confusions: Record<string, number>;        // patternId concurrent → occurrences
  abstracted: boolean;                       // a réussi ≥N probes sur vocab jamais vu
  noteShown: boolean;                        // l'explication explicite a été révélée
};
```

L'erreur n'est pas rouge/verte : chaque réponse fausse est **classée** —
concurrent appliqué (→ `confusions`), échec audio mais réussite texte (→
dépendance au texte, on augmente la part audio-seul), lenteur correcte (→
sprints de vitesse), échec de récupération pure (→ resserrer le spacing).
Le diagnostic *cause profonde* reste heuristique **[HYPOTHÈSE]** ; ce qui est
mesurable et fiable : quel canal casse, quel concurrent est choisi, à quelle
vitesse.

## 4. Le cycle de vie d'un pattern (la boucle adaptative)

1. **INDUCTION — flood à surface variable** [SOLIDE en labo / RAISONNABLE en app]
   4-6 instances corpus du même schéma, vocabulaire/locuteur/longueur
   différents, présentées en compréhension rapide (audio+texte → audio seul).
   AUCUNE règle affichée. Le cerveau détecte B sous A1…A4.
2. **PROBE D'ABSTRACTION** — a-t-il extrait B ou mémorisé A1-A4 ?
   Instance nouvelle + vocab jamais rencontré avec ce pattern ; transformation
   (jumeau corpus) ; version corrompue mécaniquement (« ça sonne juste ? »).
   Réussite ≥N → `abstracted: true`.
3. **RÉVÉLATION EXPLICITE (après, jamais avant)** — la micro-note `note`
   apparaît une fois l'induction réussie. (L'instruction explicite aide, mais
   en *consolidation* du remarqué, pas en préambule.) [RAISONNABLE]
4. **CONSOLIDATION multi-canal** — retrieval espacé par canal [SOLIDE],
   génération/transformation [SOLIDE], prédiction-avant-révélation
   [RAISONNABLE] : l'audio ou le texte s'arrête au seuil de la structure
   attendue, le cerveau anticipe, la vraie forme est révélée, l'écart nourrit
   la planification.
5. **CONTRASTE** — si `confusions[X]` monte : sessions qui juxtaposent les deux
   structures en paires minimales (jumeaux corpus) pour reconstruire la
   frontière. [RAISONNABLE — interleaving/discrimination]
6. **AUTOMATISATION** — réduire : temps, indices, support écrit, prévisibilité ;
   augmenter : débit naturel, spontanéité, production en temps réel. Un pattern
   acquis doit survivre à ça. Mesure = vitesse + réussite sous contrainte.
   [RAISONNABLE — proxy honnête, pas une mesure directe d'automatisation]

## 5. Formats d'interaction (chaque format = un mécanisme)

| Format | Mécanisme visé | Étiquette |
|---|---|---|
| **Flood** — rafale d'instances à surface variable, audio d'abord | statistical learning, extraction de régularités | SOLIDE/RAISONNABLE |
| **Ça sonne juste ?** — phrase corpus vs corruption mécanique | intuition grammaticale implicite, frontières | HYPOTHÈSE (entraînement) |
| **Anticipation** — contexte + début, l'audio/texte s'arrête avant la structure attendue, prédire → révéler | predictive processing, prediction error | RAISONNABLE |
| **Transformation** — « mets-la au négatif/futur » sur jumeaux corpus | génération, manipulation de structure | SOLIDE (generation) |
| **Situation → production** — intention en contexte (pas une consigne de traduction), produire (banque → tapé → oral) ; le moteur attend un pattern dû | retrieval spontané en contexte | SOLIDE (retrieval) |
| **Sprint d'écoute** — audio débit naturel, fenêtre de réponse qui rétrécit, jugement de sens oui/non | vitesse de traitement, sevrage du texte | RAISONNABLE |
| **Contraste** — deux structures confondues côte à côte, décision rapide | discrimination, resserrage de frontière | RAISONNABLE |
| **Shadowing** — parler par-dessus la voix native, auto-évaluation vs audio | boucle phonologique, automatisation orale | RAISONNABLE |
| **Dialogues Assimil** — vraies conversations (OCR humain) comme input narratif | variation contextuelle, langue située | SOLIDE (input) |
| **Idir dirigé par le modèle cognitif** — le tuteur pose une question dont la réponse naturelle mobilise un pattern dû, et observe | récupération spontanée en conversation | RAISONNABLE |

Chaque pattern est mesuré séparément par canal : reconnaître ≠ comprendre ≠
anticiper ≠ produire. La dépendance à un indice unique (ne reconnaît qu'à
l'écrit) est détectée et attaquée par re-pondération de l'input.

## 6. La session quotidienne (15 min minimum, sans excuse)

Un seul bouton. Le moteur compose la session du jour depuis le modèle cognitif :

1. **Réactivation** — retrievals dus, canaux mélangés (le canal le plus faible
   du pattern passe en premier).
2. **Induction ou consolidation** — 1-2 patterns selon le graphe (prérequis
   d'exposition satisfaits, contraste dû, etc.).
3. **Contraste** — si des confusions sont en attente.
4. **Sprint** — bloc d'automatisation court, temps contraint.
5. **Génération libre** — situation→production ou échange Idir ciblé.

Chrono 15:00 visible. À 15:00 la session se termine à la fin du bloc en cours
(recap : patterns travaillés, canaux renforcés, ce qui revient demain) — et
propose un bloc bonus si naly veut continuer. Pas de cœurs, pas de game-over :
l'erreur est un signal qui replanifie.

## 7. Ce qu'on ne prétend PAS (limites assumées)

- **Pas d'ASR kabyle fiable intégré aujourd'hui** → la production orale est
  auto-évaluée contre l'audio natif (+ feedback texte d'Idir en option).
  Piste v2 : modèles STT entraînés sur Common Voice kab (~571 h CC0) — à
  évaluer sérieusement avant d'y croire.
- **Pas de timestamps mot-à-mot** sur l'audio Tatoeba → l'« arrêt avant la
  structure » est d'abord textuel (révélation progressive) et audio-approximatif
  (coupure proportionnelle). Piste v2 : alignement forcé offline. [HYPOTHÈSE]
- **Le diagnostic de cause d'erreur** est une heuristique par canal +
  confusions, pas de la lecture de pensée.
- **Common Voice kab, chansons, Wikipédia kab** : sources d'input v2 pour la
  variation massive de voix — pas encore branchées.

## 7 bis. Provenance (garantie backend, pas décoration UI)

Chaque contenu kabyle a une source humaine traçable, consignée dans
**`docs/sources.md`** (registre : intégré / candidats / règles d'entrée).
Pas de citations dans l'UI pendant l'entraînement (choix de naly) : la
garantie est STRUCTURELLE. Le seul contenu « de tête » (notes de patterns,
schémas, probes) est audité par croisement contre grammar-kb + Assimil +
Dallet avant d'entrer dans l'app. Les sources communautaires non éditorées
(Glosbe…) ne servent qu'au recoupement, jamais de source primaire.

## 8. Données & fichiers (cible)

```
data/patterns.json        graphe de patterns + index d'instances (script offline)
data/twins.json           paires de transformation minées du corpus
data/vocab-freq.json      fréquences lexicales corpus
lib/patterns.ts           types + accès au graphe
lib/cognitive-model.ts    PatternSkill/ChannelState, MàJ sur événement, persist local
lib/session-engine.ts     composition adaptative de la session du jour
app/session/              le runner (un bouton, blocs, chrono 15 min, recap)
components/exercises/     un composant par FORMAT (pas par "type de question")
scripts/build-patterns.mjs  indexation corpus → patterns.json/twins.json/vocab-freq.json
```

La progression reste **locale** (localStorage) ; le moteur reste **statique +
routes API locales** ; Idir reste sur **crédits du plan** (claude CLI).
