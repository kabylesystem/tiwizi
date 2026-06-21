#!/usr/bin/env bash
# Reproducible data pipeline for Awal.
# Downloads the human-made Kabyle sources, then builds data/*.json.
set -euo pipefail

WORK="${WORK:-/tmp/awal-src}"
mkdir -p "$WORK"
cd "$WORK"

echo "→ Tatoeba exports…"
curl -sL -o kab.bz2  "https://downloads.tatoeba.org/exports/per_language/kab/kab_sentences.tsv.bz2"
curl -sL -o fra.bz2  "https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2"
curl -sL -o links.tar.bz2 "https://downloads.tatoeba.org/exports/links.tar.bz2"
curl -sL -o audio.tar.bz2 "https://downloads.tatoeba.org/exports/sentences_with_audio.tar.bz2"
bunzip2 -kf kab.bz2 && mv kab kab_sentences.tsv 2>/dev/null || bunzip2 -kf kab.bz2
bunzip2 -kf fra.bz2 && mv fra fra_sentences.tsv 2>/dev/null || bunzip2 -kf fra.bz2
# the per_language exports already carry the right names once unpacked:
[ -f kab_sentences.tsv ] || mv kab kab_sentences.tsv
[ -f fra_sentences.tsv ] || mv fra fra_sentences.tsv
tar xjf links.tar.bz2
tar xjf audio.tar.bz2

echo "→ Dallet dictionary (MIT)…"
curl -sL -o dallet.json "https://raw.githubusercontent.com/sferhah/DigitizedDallet/master/DigitizedDallet/wwwroot/dictionary.json"

echo "→ Building data/*.json…"
cd - >/dev/null
WORK="$WORK" node scripts/build-sentences.mjs
WORK="$WORK" node scripts/build-dict.mjs
echo "✓ Done. See data/."
