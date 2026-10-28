# Plan jusqu'à la version alpha

Ce plan mène de l'app vide générée par `create-expo-app` à une **alpha installable sur de vrais téléphones**, avec un seul jeu : « Jusqu'à la mer ».

Maquettes de référence (privées, à partager depuis le menu Share si besoin) : https://claude.ai/artifact/9FRXJwXSpRVHLvCTeGWLZK — Accueil, Comment jouer, Partie en cours, Résultat.

## Ce que veut dire « alpha »

L'alpha est atteinte quand tout ceci est vrai :

- [ ] Le **défi du jour** et la **partie libre** (Facile / Moyen / Expert) se jouent de bout en bout sur Android et iOS.
- [ ] Le jeu repose sur un jeu de données réel d'au moins **200 rivières** sélectionnées, dont **50 chaînes vérifiées à la main** sans erreur.
- [ ] La **carte de fin** trace le vrai chemin, de la source jusqu'à la mer.
- [ ] Les **stats et la série de jours** sont enregistrées sur le téléphone et survivent à un redémarrage.
- [ ] Une build est **distribuée à 5 à 10 testeurs**, avec un moyen simple de remonter un retour.
- [ ] La CI (lint, typecheck, tests) est verte sur `main`.

**Hors alpha** : comptes, serveur, classements, autres mini-jeux, monétisation, traduction, mode sombre soigné.

## Architecture visée

```
src/
  app/                        # routes Expo Router (écrans uniquement)
    _layout.tsx
    index.tsx                 # Accueil de la plateforme
    stats.tsx  profil.tsx
    jeux/jusqua-la-mer/
      regles.tsx  partie.tsx  resultat.tsx
  platform/                   # commun à tous les mini-jeux
    games.ts                  # registre : un manifeste par jeu
    theme.ts                  # couleurs, typo, espacements (repris des maquettes)
    storage.ts  streak.ts  daily.ts  share.ts
    ui/                       # boutons, cartes, pastilles, icônes
  games/
    jusqua-la-mer/
      manifest.ts             # id, titre, description, routes, niveaux
      engine/                 # TypeScript pur, sans React : état, règles, score
      data/                   # chargement et index des données
      components/             # chaîne, saisie, choix de la mer, carte
assets/data/                  # JSON générés par le pipeline, versionnés
scripts/data/                 # pipeline Python (uv) qui fabrique assets/data
```

Pour ajouter un mini-jeu plus tard, il suffira de créer un dossier dans `src/games/`, ses routes, et de l'inscrire dans le registre. L'accueil, les stats et la série de jours n'auront pas à changer.

## Phase 0 — Fondations

Objectif : un projet propre qui démarre sur le téléphone avec l'identité visuelle des maquettes.

- [ ] Installer Node 24 sur la machine (voir README) et vérifier `npx expo start` + Expo Go sur un téléphone.
- [x] Retirer le contenu d'exemple du template (écrans, composants et images d'exemple).
- [x] Mettre en place l'arborescence ci-dessus avec des écrans vides.
- [x] `theme.ts` : couleurs (fond `#F3F6F8`, encre `#0F2537`, eau `#1665C1`, bleu nuit `#0B3A66`, erreur `#B13A0B`…), rayons, espacements.
- [x] Polices Bricolage Grotesque (titres) et DM Sans (texte) via `expo-font`.
- [x] Nom, icône provisoire et écran de démarrage dans `app.json`.
- [x] Lint + `tsc --noEmit` + tests unitaires (jest-expo) branchés dans `package.json`.
- [x] GitHub Actions : lint, typecheck et tests à chaque push.

**Démontrable** : l'app s'ouvre sur un accueil vide aux couleurs de Cartable.

## Phase 1 — Données hydrographiques (le cœur du jeu)

Objectif : un fichier qui donne, pour chaque rivière, la chaîne exacte jusqu'à la mer.

- [x] **Exploration d'abord** : d'où tirer, pour chaque rivière, le cours d'eau dans lequel elle se jette ? Résultat dans [`docs/donnees.md`](donnees.md) : Wikidata (P403) pour les chaînes, BD TOPO de l'IGN pour le contrôle et les géométries.
- [x] Vérifier la licence des données et la mention à afficher dans l'app (voir `docs/donnees.md`).
- [x] Trancher les trois décisions de `docs/donnees.md` : Gironde étape facultative, lac traversé transparent, Corse incluse.
- [x] Pipeline `scripts/data/build_rivers.py` (Python + uv) : extraction Wikidata (rivières ayant un code Sandre) → remontée des embouchures → table des points d'arrivée vers les 4 mers → `assets/data/rivers.json` et rapport de relecture `scripts/data/report.md`.
- [ ] Contrôle croisé des chaînes avec les confluences BD TOPO, et liste des écarts à revoir.
- [x] Noms : article (`le`, `la`, `l'`, `les`, tiré de Wikipédia) et forme d'affichage ; étapes facultatives (Gironde, Gaves réunis, lacs traversés).
- [x] Fichier de règles manuelles (`scripts/data/rules.yaml`) pour les cas particuliers :
  - estuaires partagés (Dordogne → Garonne ou Gironde) ;
  - rivières qui traversent un lac (Rhône et Léman) ;
  - fleuves qui finissent à l'étranger (Moselle → Rhin → mer du Nord, Meuse, Escaut) ;
  - rivières qui finissent dans un étang (Arc → étang de Berre → Méditerranée).
- [x] Niveau de difficulté calculé : nombre d'étapes, notoriété (sitelinks Wikidata) et passage par l'étranger. À affiner avec les pages vues de Wikipédia en français.
- [x] Sélection de 200 à 300 rivières jouables, avec leur niveau : 257 rivières (55 faciles, 121 moyennes, 81 difficiles), identifiées par leur QID Wikidata.
- [ ] Géométries simplifiées (contour de la France et tracés des cours d'eau sélectionnés, tronçons BD TOPO du réseau principal) pour la carte, en coordonnées déjà projetées.
- [x] Tests de non-régression sur des chaînes connues (`src/games/jusqua-la-mer/data/__tests__/rivers-test.ts`) : Loir → Sarthe → Maine → Loire → Atlantique ; Aisne → Oise → Seine → Manche ; Gartempe → Creuse → Vienne → Loire → Atlantique ; Vologne → Moselle → Rhin → mer du Nord ; Ognon → Saône → Rhône → Méditerranée.
- [ ] Revue manuelle de 50 chaînes tirées au hasard : la liste à cocher est dans `scripts/data/review.md`.

**Démontrable** : `assets/data/rivers.json` et `assets/data/geo.json`, plus un rapport des cas douteux.

## Phase 2 — Moteur de jeu (TypeScript pur, testé)

Objectif : toute la logique du jeu, sans interface.

- [x] État d'une partie : rivière de départ, chaîne attendue, réponses données, vies (3), indices utilisés, fin (gagnée ou perdue). Code dans `src/games/jusqua-la-mer/engine/game.ts`.
- [x] Vérification d'une réponse : majuscules, accents, tirets et articles ignorés ; étapes facultatives (plusieurs chemins valides). Une faute de frappe ou un cours d'eau déjà cité ne coûte pas de vie ; un cours d'eau plus loin sur le chemin est signalé « pas directement ».
- [x] Fin de chaîne : c'est le joueur qui choisit la mer. Donner une mer trop tôt compte comme une erreur.
- [x] Indice : révèle l'initiale de la prochaine étape obligatoire (ou de la mer), un par étape, 10 points.
- [ ] Indice plus riche : le département de la prochaine confluence. Il faut d'abord ajouter la position des confluences aux données (phase 1).
- [x] Autocomplétion sur **tous** les cours d'eau connus (4 648 noms, du plus au moins connu), pour ne jamais trahir la réponse.
- [x] Score sur 100 (−25 par erreur, −10 par indice) et grille de la partie (une case par bonne réponse, erreur ou indice).
- [x] Défi du jour : rivière tirée de façon déterministe à partir de la date locale, la même pour tout le monde. Il puise dans 125 rivières faciles et moyennes, sans répétition avant de les avoir toutes vues. Le n°1 est le 28/10/2026.
- [x] Partie libre : tirage au hasard selon le niveau, en évitant les rivières jouées récemment.
- [x] Tests unitaires sur tout ce qui précède, dont une partie complète avec les vraies données.

**Démontrable** : une partie complète jouée dans les tests.

## Phase 3 — Écrans du jeu

Objectif : reproduire les maquettes avec le moteur branché.

- [x] Accueil : carte du défi du jour (numéro et date), partie libre en 3 niveaux, « Bientôt », barre d'onglets. La série de jours viendra avec la phase 5.
- [x] Comment jouer : contenu des maquettes, affiché avant chaque défi du jour.
- [ ] Ne l'afficher qu'au premier lancement (il faut le stockage de la phase 5).
- [x] Partie : chaîne verticale (étapes trouvées, erreurs sous la bonne ligne, étapes à venir cachées), vies, saisie avec suggestions, choix de la mer, bouton indice.
- [x] Gestion du clavier : la saisie et les suggestions restent visibles ; clavier ouvert, les mers laissent place à un lien qui le ferme.
- [x] Retours : secousse et vibration sur une erreur (`expo-haptics`), apparition en fondu quand une étape est trouvée, messages explicites (« pas directement ! », « pas encore »).
- [x] Résultat : récapitulatif, chemin complet, grille, score, anecdote tirée des données, partage, partie libre, compte à rebours avant le prochain défi.
- [x] Écran de défaite qui montre la bonne chaîne.
- [ ] Tester sur un vrai téléphone (iOS et Android) : clavier, vibrations, polices. Testé jusqu'ici dans la version web de l'app.

**Démontrable** : le défi du jour se joue sur le téléphone, sans la carte.

## Phase 4 — Carte de fin

- [ ] Rendu SVG (`react-native-svg`) du contour de la France et des cours d'eau, à partir de `geo.json`.
- [ ] Cadrage automatique sur le trajet, avec la France entière en médaillon.
- [ ] Trajet surligné, source, confluences, embouchure, étiquettes sans chevauchement.
- [ ] Performance correcte sur un Android d'entrée de gamme.

## Phase 5 — Stats, série et partage

- [ ] Stockage local des parties, du résultat du jour et de la série (`expo-sqlite` en clé-valeur, ou AsyncStorage).
- [ ] Écran Stats : parties jouées, % de réussite, série actuelle et record, répartition des erreurs.
- [ ] Partage du résultat en texte (grille + lien) avec le partage natif.
- [ ] Notification locale facultative pour rappeler le défi du jour.

## Phase 6 — Finitions et distribution de l'alpha

- [ ] Icône et écran de démarrage définitifs.
- [ ] Accessibilité : libellés des boutons-icônes, contrastes, taille de texte système.
- [ ] Mention des sources de données dans Profil › À propos.
- [ ] EAS : profils `development` et `preview` dans `eas.json`.
- [ ] Android : APK de test via EAS (lien d'installation direct).
- [ ] iOS : TestFlight (nécessite un compte Apple Developer, 99 $/an), ou Expo Go pour les premiers testeurs.
- [ ] Formulaire ou canal de retours pour les testeurs.
- [ ] Remontée des plantages (facultatif pour l'alpha).

## Ordre et dépendances

```
Phase 0 ──► Phase 1 (données) ──► Phase 2 (moteur) ──► Phase 3 (écrans) ──► Phase 4 (carte)
                                                         └──────────────► Phase 5 (stats)
                                                                               └──► Phase 6
```

La phase 2 peut commencer avec un petit jeu de données écrit à la main (une vingtaine de rivières) pendant que la phase 1 avance. La phase 3 aussi : les écrans n'attendent pas les vraies données.

## Risques

| Risque | Parade |
|---|---|
| Erreurs ou modifications malveillantes dans Wikidata | Instantané figé dans le repo, contrôle croisé avec les confluences BD TOPO, revue manuelle des écarts |
| Chaînes ambiguës ou contestables | Variantes acceptées, plusieurs chemins valides, cas tordus exclus du défi du jour |
| Noms mal saisis sur mobile | Autocomplétion obligatoire et normalisation des réponses |
| Expo change d'API à chaque SDK | Suivre `AGENTS.md` : lire la doc de la version installée avant de coder |
| Distribution iOS | Compte Apple Developer à prévoir tôt, sinon alpha Android d'abord |
