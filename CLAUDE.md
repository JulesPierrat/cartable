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

## Conventions

- Identifiants et noms de fichiers en anglais ; textes de l'interface, docs et messages de commit en français.
- Le dossier d'un jeu est en kebab-case français (`src/games/jusqua-la-mer/`).
- Le moteur d'un jeu (`engine/`) est du TypeScript pur : pas d'import React ni Expo, et des tests unitaires pour chaque règle.
- Ce qui sert à plusieurs jeux va dans `src/platform/`, jamais dans le dossier d'un jeu.
- Les couleurs, polices et espacements viennent de `src/platform/theme.ts`, pas de valeurs en dur dans les écrans.
- Avant de dire qu'une tâche est finie : `npx expo lint`, `npx tsc --noEmit` et les tests passent.
- Ne push pas et ne merge pas sur `main` sans qu'on te le demande.

## Pièges du domaine

- Une rivière se jette dans un cours d'eau, pas forcément dans un fleuve : le Loir rejoint la Sarthe, pas la Loire.
- Cas ambigus à traiter dans les données, jamais en dur dans le code : estuaires partagés (Dordogne et Garonne / Gironde), lacs traversés (Rhône et Léman), fleuves qui finissent à l'étranger (Moselle → Rhin → mer du Nord), rivières qui finissent dans un étang (Arc → étang de Berre).
- Les noms ont un article (`le`, `la`, `l'`) : il sert à l'affichage et est ignoré pour vérifier une réponse.
- L'autocomplétion doit chercher dans tous les cours d'eau connus, sinon elle trahit la réponse.
