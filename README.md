# Cartable

Plateforme mobile de mini-jeux de géographie, en React Native + Expo.

Premier jeu : **Jusqu'à la mer**. On te donne une rivière française ; tu cites le cours d'eau dans lequel elle se jette, puis le suivant, et ainsi de suite jusqu'à la mer ou l'océan.

> Exemple : le Loir → la Sarthe → la Maine → la Loire → océan Atlantique.

**État** : pré-alpha. Le plan jusqu'à l'alpha est dans [`docs/plan-alpha.md`](docs/plan-alpha.md).

## Lancer le projet

Il faut Node 24 (voir `.nvmrc`) et l'app **Expo Go** sur le téléphone, connecté au même Wi-Fi que l'ordinateur.

```bash
npm install
npx expo start
```

Scanne ensuite le QR code affiché avec Expo Go (Android) ou l'appareil photo (iOS).

Autres commandes :

```bash
npx expo lint        # lint
npx tsc --noEmit     # vérification des types
npx expo-doctor      # diagnostic des dépendances
```

Pour ajouter une dépendance, utilise toujours `npx expo install <paquet>` : il choisit la version compatible avec le SDK.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app/` | écrans et navigation (Expo Router) |
| `src/platform/` | ce qui est commun à tous les mini-jeux : registre des jeux, thème, stockage, série de jours |
| `src/games/<jeu>/` | un dossier par mini-jeu : moteur, données, composants |
| `assets/data/` | données générées par le pipeline (versionnées) |
| `scripts/data/` | pipeline de préparation des données hydrographiques |
| `docs/` | plan et documentation |

Cette organisation est la cible décrite dans le plan ; le code actuel est encore celui du template Expo.

## Données

Les données hydrographiques viendront de sources ouvertes françaises (BD TOPAGE de l'IGN et de l'OFB, référentiel SANDRE). La licence et la mention d'attribution sont à confirmer pendant la phase 1 du plan.
