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

- [ ] **Exploration d'abord** : vérifier si la BD TOPAGE (IGN/OFB) ou le référentiel SANDRE donnent directement le cours d'eau dans lequel chaque rivière se jette. Sinon, le déduire en suivant les tronçons vers l'aval. C'est le principal risque du projet : à trancher avant tout le reste.
- [ ] Vérifier la licence des données et la mention à afficher dans l'app.
- [ ] Pipeline `scripts/data/` (Python + uv) : téléchargement → graphe « rivière → cours d'eau receveur » → chaîne jusqu'à l'exutoire → mer d'arrivée (Manche, mer du Nord, Atlantique, Méditerranée).
- [ ] Noms : article (`le`, `la`, `l'`), forme d'affichage, variantes acceptées (`Gironde` pour la Garonne, etc.).
- [ ] Fichier de corrections manuelles (`corrections.yaml`) pour les cas particuliers :
  - estuaires partagés (Dordogne → Garonne ou Gironde) ;
  - rivières qui traversent un lac (Rhône et Léman) ;
  - fleuves qui finissent à l'étranger (Moselle → Rhin → mer du Nord, Meuse, Escaut) ;
  - rivières qui finissent dans un étang (Arc → étang de Berre) : à exclure ou à traiter à part.
- [ ] Niveau de difficulté calculé : longueur de la chaîne, longueur et notoriété du cours d'eau.
- [ ] Sélection de 200 à 300 rivières jouables, avec leur niveau.
- [ ] Géométries simplifiées (contour de la France et tracés des cours d'eau sélectionnés) pour la carte, en coordonnées déjà projetées.
- [ ] Tests de non-régression sur des chaînes connues : Loir → Sarthe → Maine → Loire → Atlantique ; Aisne → Oise → Seine → Manche ; Gartempe → Creuse → Vienne → Loire → Atlantique ; Vologne → Moselle → Rhin → mer du Nord ; Ognon → Saône → Rhône → Méditerranée.
- [ ] Revue manuelle de 50 chaînes tirées au hasard.

**Démontrable** : `assets/data/rivers.json` et `assets/data/geo.json`, plus un rapport des cas douteux.

## Phase 2 — Moteur de jeu (TypeScript pur, testé)

Objectif : toute la logique du jeu, sans interface.

- [ ] État d'une partie : rivière de départ, chaîne attendue, réponses données, vies (3), indices utilisés, fin (gagnée ou perdue).
- [ ] Vérification d'une réponse : majuscules, accents, tirets et articles ignorés ; variantes acceptées ; plusieurs chemins valides possibles.
- [ ] Fin de chaîne : c'est le joueur qui choisit la mer. Donner une mer trop tôt compte comme une erreur.
- [ ] Indice : révèle le département de la prochaine confluence (et coûte des points).
- [ ] Autocomplétion sur **tous** les cours d'eau connus, pour ne jamais trahir la réponse.
- [ ] Score et grille de partage (une case par tentative).
- [ ] Défi du jour : rivière tirée de façon déterministe à partir de la date, la même pour tout le monde, sans répétition sur une longue période.
- [ ] Partie libre : tirage au hasard selon le niveau.
- [ ] Tests unitaires sur tout ce qui précède.

**Démontrable** : une partie complète jouée dans les tests.

## Phase 3 — Écrans du jeu

Objectif : reproduire les maquettes avec le moteur branché.

- [ ] Accueil : carte du défi du jour, partie libre en 3 niveaux, « Bientôt », série de jours, barre d'onglets.
- [ ] Comment jouer : affiché au premier lancement, puis accessible depuis la partie.
- [ ] Partie : chaîne verticale, vies, saisie avec suggestions, choix de la mer, bouton indice.
- [ ] Gestion du clavier : la saisie et les suggestions restent visibles ; le choix de la mer passe dans une feuille quand le clavier est ouvert.
- [ ] Retours : secousse et vibration sur une erreur (`expo-haptics`), animation quand une étape est trouvée.
- [ ] Résultat : récapitulatif, grille, série, anecdote, partager, rejouer, compte à rebours avant le prochain défi.
- [ ] Écran de défaite qui montre la bonne chaîne.

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
| Les données ne donnent pas directement le cours d'eau receveur | Phase 1 commence par une exploration ; plan B : topologie des tronçons + corrections manuelles |
| Chaînes ambiguës ou contestables | Variantes acceptées, plusieurs chemins valides, cas tordus exclus du défi du jour |
| Noms mal saisis sur mobile | Autocomplétion obligatoire et normalisation des réponses |
| Expo change d'API à chaque SDK | Suivre `AGENTS.md` : lire la doc de la version installée avant de coder |
| Distribution iOS | Compte Apple Developer à prévoir tôt, sinon alpha Android d'abord |
