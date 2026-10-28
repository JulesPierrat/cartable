# Distribuer l'alpha

Les builds de test se font avec EAS (les serveurs d'Expo), sans Xcode ni Android Studio. La configuration est dans `eas.json` :

- `preview` : build de test à distribuer aux testeurs (APK pour Android) ;
- `production` : build pour les stores (TestFlight, Play Store), numéro de version incrémenté automatiquement.

Identifiant de l'app sur les deux plateformes : `com.julespierrat.cartable` (dans `app.json`). Il ne change plus une fois l'app publiée sur un store : à modifier maintenant si besoin.

## Une fois pour toutes

1. Créer un compte Expo gratuit sur https://expo.dev/signup.
2. Se connecter dans le terminal, puis relier le projet à ce compte. `eas init` ajoute l'identifiant du projet dans `app.json` : committer ce changement.

```bash
npx eas-cli@latest login
```

```bash
cd ~/dev2/cartable && npx eas-cli@latest init
```

## Android : un lien d'installation

```bash
cd ~/dev2/cartable && npx eas-cli@latest build --platform android --profile preview
```

À la fin, EAS donne un lien (et un QR code) vers l'APK. Les testeurs l'ouvrent sur leur téléphone et acceptent l'installation d'une app hors du Play Store. Gratuit, sans limite de testeurs.

## iOS : deux possibilités

Les deux demandent un compte Apple Developer (99 $/an, https://developer.apple.com/programs/).

**Installation directe (ad hoc)**, jusqu'à 100 iPhone par an : chaque testeur enregistre son appareil grâce à un lien que génère la première commande, puis on lance le build.

```bash
cd ~/dev2/cartable && npx eas-cli@latest device:create
```

```bash
cd ~/dev2/cartable && npx eas-cli@latest build --platform ios --profile preview
```

**TestFlight**, plus simple pour les testeurs (une invitation par e-mail) : build de production puis envoi à App Store Connect, où l'on invite les testeurs.

```bash
cd ~/dev2/cartable && npx eas-cli@latest build --platform ios --profile production --auto-submit
```

## Avant d'envoyer aux testeurs

- [ ] Partie jouée de bout en bout sur un vrai iPhone et un vrai Android (clavier, vibrations, cartes).
- [ ] Les 50 chaînes de `scripts/data/review.md` relues.
- [ ] Un moyen de remonter les retours (à décider : formulaire, e-mail, groupe de discussion…).
- [ ] Icône définitive.
