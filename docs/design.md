# Tiwizi — design.md (source de vérité visuelle)

## Direction
Éditorial, chaleureux, ancré dans l'identité amazighe — l'inverse du « SaaS IA
générique ». Le **kabyle est le héros** : grand, en serif, mis en avant. Le reste
de l'UI s'efface (sans, calme, beaucoup de blanc chaud).

## Couleurs (tokens dans `app/globals.css`)
- Fond papier : `#faf6ee` / surface carte : `#ffffff`
- Encre : `#221c14` · texte secondaire : `#7c715f` · lignes : `#e8dfcd`
- **Azur amazigh** (primaire) : `#1f63b0`
- **Ocre** (accent) : `#cf8a16`
- Vert (succès) : `#2f7d5b` · Argile/rouge yaz (erreur) : `#c0492b`

## Typo
- **Inter** — UI / corps
- **Fraunces** — display (titres, chiffres, marque) → caractère éditorial
- **Noto Serif** — texte **kabyle** (`.kab`) : couvre ɣ ɛ ḥ ṣ ṭ ḍ ẓ č ǧ sans tofu

## Marque
Logo = **yaz (ⵣ)** dessiné en SVG (pas de police tifinagh requise), dans un carré azur.

## Principes
1. Le kabyle d'abord — taille, contraste, audio à portée de pouce.
2. Mobile = barre d'onglets en bas (pratique au pouce) ; desktop = nav haute.
3. Mouvement discret (`animate-pop`), respect de `prefers-reduced-motion`.
4. Chaque écran tient une intention ; pas de remplissage décoratif.

## Revue
Polish vérifié au screenshot (desktop 1280 + mobile 390) — accueil, /learn,
/browse, /dictionary. Caractères spéciaux confirmés à l'écran.

## Son
La voix (native/TTS) est le SEUL son de l'app. Zéro jingle de feedback
(réussite/échec/fin) : préférence permanente de naly (2026-07-16). Le feedback
est visuel, l'audio est réservé au kabyle.
