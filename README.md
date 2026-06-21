# Awal — apprendre le kabyle (taqbaylit) pour de vrai

> *Awal* = « la parole, le mot » en kabyle.

La meilleure façon d'apprendre le kabyle, bâtie sur **du contenu humain vérifié**
plutôt que sur un kabyle approximatif inventé par une IA.

## Le principe

Les LLM sont mauvais en kabyle (langue à faibles ressources). Donc Awal ne leur
fait pas confiance : tout le contenu vient de **vraies sources humaines**.

- **Input compréhensible** — 208 000 phrases kabyle↔français ([Tatoeba](https://tatoeba.org), CC-BY),
  dont 23 000 avec **audio de voix natives** (streamé depuis le CDN Tatoeba).
- **Répétition espacée** — un moteur SM-2 planifie tes révisions (progression locale, `localStorage`).
- **Dictionnaire** — le **Dallet** numérisé ([DigitizedDallet](https://github.com/sferhah/DigitizedDallet), MIT) :
  12 500 entrées, sens, racines, exemples.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4. Données servies
en local depuis `data/*.json`, recherche côté serveur (routes API).

## Lancer

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

> En sandbox/inotify limité : `WATCHPACK_POLLING=true pnpm exec next dev`.

## Reconstruire les données

Les JSON sont versionnés dans `data/`. Pour les régénérer depuis les sources :

```bash
bash scripts/build-data.sh
```

## Structure

```
app/            pages (accueil, /learn, /browse, /dictionary) + routes API
components/     nav, onglets mobile, bouton audio, logo (yaz ⵣ), carte du jour
lib/            data (chargement+recherche), srs (SM-2), normalize (recherche tolérante)
data/           deck.json · pairs.json · dict.json
scripts/        pipeline de données reproductible
```

## Sources & licences

| Source | Contenu | Licence |
|--------|---------|---------|
| Tatoeba | phrases + audio | CC-BY 2.0 FR |
| DigitizedDallet | dictionnaire | MIT |

## Suite

Voir [`docs/session.md`](docs/session.md). Prochaine grande étape : un **tuteur IA
ancré** sur ce corpus (et tournant sur les crédits du plan, pas l'API).
