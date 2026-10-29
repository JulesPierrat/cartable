# Cartable : règles pour Claude

Plateforme mobile de mini-jeux de géographie (React Native + Expo). Un seul jeu pour l'instant : « Jusqu'à la mer » (retrouver la chaîne des cours d'eau d'une rivière française jusqu'à la mer). Réponds toujours en français.

Les règles Expo du template s'appliquent, en particulier « ne te fie pas à ta mémoire, lis la doc de la version installée » :

@AGENTS.md

## Où on en est

- Le plan jusqu'à l'alpha est dans `docs/plan-alpha.md`. Coche les cases quand une tâche est finie, dans le même commit.
- Les maquettes de référence sont liées en tête du plan. En cas de doute sur un écran, ce sont elles qui font foi.

## Stack

- Expo SDK 58, Expo Router (routes dans `src/app/`), TypeScript strict, React Compiler activé.
- Node 24 (`.nvmrc`).
- Données : pipeline Python dans `scripts/data/` (lancé avec `uv`), sorties JSON versionnées dans `assets/data/`.

## Commandes

- `npm run lint`, `npm run typecheck`, `npm test` : les trois doivent passer, c'est ce que vérifie la CI.
- Node 24 est installé avec nvm : dans un shell non interactif, commence par `source ~/.nvm/nvm.sh`.
- Pour vérifier un écran sans téléphone : `npx expo start --web`, puis le navigateur intégré en taille mobile. Le premier chargement est lent (polices). Les vibrations et le clavier, eux, ne se vérifient que sur un vrai téléphone.

## Navigation

- `src/app/(tabs)/` : les onglets Jouer, Stats et Profil. `_layout.tsx` utilise la barre native (`expo-router/native-tabs` : Liquid Glass sur iOS 26+, Material sur Android, icônes SF Symbols et Material Symbols) ; `_layout.web.tsx` garde une barre JavaScript pour le web. La barre native flotte sur le contenu : un écran d'onglet laisse `tabBarInset` en bas de son défilement.
- `src/app/jeux/<jeu>/` : les écrans d'un jeu, empilés par-dessus les onglets ; chaque écran est déclaré dans `src/app/_layout.tsx`.
- Outils partagés par tous les jeux dans `src/platform/` : `text.ts` (normalisation des noms pour comparer une réponse), `autocomplete.ts`, `daily.ts` (date locale et tirage déterministe du défi du jour).
- Moteur de « Jusqu'à la mer » dans `src/games/jusqua-la-mer/engine/` : `game.ts` (état et actions, des fonctions pures qui renvoient un nouvel état), `challenges.ts` (défi du jour, partie libre).
- Stockage dans `src/platform/storage.ts` : tout est chargé en mémoire au démarrage puis lu sans attendre. Dans un composant, lire une valeur avec `useStored` (jamais `storage.get` directement : le React Compiler mémoriserait la valeur). Historique des parties et série de jours dans `src/platform/records.ts` ; sauvegarde du défi du jour dans `src/games/jusqua-la-mer/progress.ts`.
- Composants d'interface partagés dans `src/platform/ui/` : `Screen`, `AppText` (variantes typographiques du thème), `Button`, `IconButton`, `Icon` (icônes SVG au trait des maquettes), `Logo`.

## Conventions

- Identifiants et noms de fichiers en anglais ; textes de l'interface, docs et messages de commit en français.
- Le dossier d'un jeu est en kebab-case français (`src/games/jusqua-la-mer/`).
- Le moteur d'un jeu (`engine/`) est du TypeScript pur : pas d'import React ni Expo, et des tests unitaires pour chaque règle.
- Ce qui sert à plusieurs jeux va dans `src/platform/`, jamais dans le dossier d'un jeu.
- Les couleurs, polices et espacements viennent de `src/platform/theme.ts`, pas de valeurs en dur dans les écrans.
- Avant de dire qu'une tâche est finie : `npx expo lint`, `npx tsc --noEmit` et les tests passent.
- Ne push pas et ne merge pas sur `main` sans qu'on te le demande.

## Données

- `assets/data/*.json` sont générés par `uv run scripts/data/build_rivers.py` puis `uv run scripts/data/build_geometries.py` (tracés IGN dans `geo.json`) : ne jamais les modifier à la main. `uv run scripts/data/check_chains.py` contrôle ensuite les chaînes avec la BD TOPO (`scripts/data/crosscheck.md`). Une chaîne fausse se corrige par une règle dans `scripts/data/rules.yaml`, puis on relance le pipeline et les tests.
- Les rivières et les étapes sont identifiées par leur QID Wikidata. La vérification d'une réponse, elle, compare des noms normalisés.
- Les règles de jeu sur les données (Gironde facultative, lacs transparents, Corse incluse) sont dans `docs/donnees.md`.

## Règles de jeu décidées

- **Indices** (deux par étape, chacun coûte une vie, refusés à la dernière vie) sur une carte vierge de la France (contour seul, sans limite administrative) : le 1er montre uniquement les rivières découvertes (la rivière de départ et les étapes trouvées) ; le 2e les rivières découvertes plus la rivière à trouver. Pour la mer, un seul indice : les rivières découvertes jusqu'à la côte. Rien d'autre sur la carte.
- **Épaisseur des rivières** sur les cartes : selon leur rang (longueur), un fleuve plus épais qu'un affluent.
- **Données** : Gironde et Gaves réunis facultatifs, lacs traversés transparents, Corse incluse (voir `docs/donnees.md`).

## Pièges du domaine

- Une rivière se jette dans un cours d'eau, pas forcément dans un fleuve : le Loir rejoint la Sarthe, pas la Loire.
- Cas ambigus à traiter dans les données, jamais en dur dans le code : estuaires partagés (Dordogne et Garonne / Gironde), lacs traversés (Rhône et Léman), fleuves qui finissent à l'étranger (Moselle → Rhin → mer du Nord), rivières qui finissent dans un étang (Arc → étang de Berre).
- Les noms ont un article (`le`, `la`, `l'`) : il sert à l'affichage et est ignoré pour vérifier une réponse.
- L'autocomplétion doit chercher dans tous les cours d'eau connus, sinon elle trahit la réponse.
