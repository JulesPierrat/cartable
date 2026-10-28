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
npm run lint         # lint
npm run typecheck    # vérification des types
npm test             # tests unitaires (npm run test:watch pour le mode continu)
npx expo-doctor      # diagnostic des dépendances
```

Pour ajouter une dépendance, utilise toujours `npx expo install <paquet>` : il choisit la version compatible avec le SDK.

Sans Node sur la machine, les commandes qui ne lancent pas le serveur de dev passent par Docker :

```bash
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD:/app" -w /app node:24-alpine npm test
```

La CI GitHub Actions (`.github/workflows/ci.yml`) lance lint, types, tests et la vérification des versions à chaque push sur `main` et sur chaque pull request.

Les icônes et l'écran de démarrage provisoires sont générés par `python3 scripts/generate-icons.py` (Pillow).

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app/` | écrans et navigation (Expo Router) |
| `src/platform/` | ce qui est commun à tous les mini-jeux : registre des jeux, thème, stockage, série de jours |
| `src/games/<jeu>/` | un dossier par mini-jeu : moteur, données, composants |
| `assets/data/` | données générées par le pipeline (versionnées) |
| `scripts/data/` | pipeline de préparation des données hydrographiques |
| `docs/` | plan et documentation |

Les écrans du jeu sont pour l'instant des coquilles qui annoncent la phase du plan qui les remplira. Pour ajouter un mini-jeu : un dossier dans `src/games/`, ses écrans dans `src/app/jeux/<jeu>/`, et une ligne dans `src/platform/games.ts`.

## Données

Les chaînes de cours d'eau viennent de Wikidata (CC0). La BD TOPO de l'IGN (Licence Ouverte 2.0) servira au contrôle et aux tracés de la carte. Les sources, les règles du jeu et les licences sont détaillées dans [`docs/donnees.md`](docs/donnees.md).

```bash
uv run scripts/data/build_rivers.py   # régénère assets/data/ à partir de Wikidata
```

Les cas particuliers se corrigent dans `scripts/data/rules.yaml`, jamais dans les JSON.
