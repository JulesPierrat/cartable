# Données hydrographiques : exploration (octobre 2026)

Résultat de l'exploration qui ouvre la phase 1 du plan. Question posée : peut-on obtenir, pour chaque rivière, la chaîne fiable des cours d'eau jusqu'à la mer ?

**Réponse : oui, en croisant deux sources, plus une petite table de règles écrite à la main.**

| Rôle | Source | Pourquoi |
|---|---|---|
| Chaînes, noms, notoriété | **Wikidata** (propriété P403 « embouchure ») | Les 5 chaînes de test sortent complètes jusqu'à la mer, y compris celles qui passent par l'étranger (Moselle → Rhin → mer du Nord). |
| Contrôle des chaînes | **BD TOPO V3** (IGN) | Les nœuds de confluence donnent directement les cours d'eau amont et aval. |
| Géométries pour la carte | **BD TOPO V3** ou **BD CARTO V5** (IGN) | Les tronçons du réseau principal, fusionnés puis simplifiés. |

Le code hydrographique Sandre (ex. `M1--0160` pour le Loir) **n'est pas hiérarchique** : il décrit la zone qui contient le cours d'eau, pas son receveur. Il sert seulement de clé de jointure entre Wikidata (propriété P1717) et l'IGN.

## Ce que donne chaque source

### Wikidata

- 5 812 éléments ont un code Sandre (P1717). Parmi eux, 5 514 ont une embouchure (P403), 5 508 une longueur (P2043) et 4 205 un article Wikipédia en français.
- Une seule requête SPARQL suffit pour tout récupérer : embouchure, longueur, surface du bassin (P2053, peu renseignée), nombre de sitelinks et coordonnées.
- Avec un filtre « France métropolitaine, au moins 12 sitelinks », on obtient **257 rivières, dont 252 avec une chaîne complète**. Ça correspond à la taille visée pour l'alpha.
- Nombre de cours d'eau intermédiaires avant la mer : 0 pour 47 rivières, 1 pour 103, 2 pour 74, 3 pour 24, 4 ou plus pour 4.
- Les points d'arrivée sont hétérogènes : golfe de Gascogne, estuaire de la Gironde, pertuis d'Antioche, baie de Somme, bassin d'Arcachon, mer Tyrrhénienne (Corse)… Il faut une table d'environ 18 entrées pour les ramener aux 4 mers du jeu.
- Une erreur relevée : la Nive a pour embouchure « Bayonne », qui est une ville. D'où la nécessité du contrôle IGN et d'un instantané revu à la main.

### BD TOPO V3 (IGN, WFS `data.geopf.fr`)

- `BDTOPO_V3:noeud_hydrographique` : sur les nœuds de catégorie « Confluent », `liens_vers_cours_d_eau_amont` et `liens_vers_cours_d_eau_aval` donnent directement le receveur. Exemple : le nœud de confluence du Loir donne Loir + Sarthe en amont et Sarthe en aval.
- **Piège** : la couche `cours_d_eau` mélange 138 814 objets « Graphe unitaire » et 13 807 objets « toponymiques ». Il faut filtrer sur « Graphe unitaire », sinon les chaînes deviennent fausses.
- `troncon_hydrographique` porte `code_du_cours_d_eau_bdcarthage`, qui permet la jointure avec le code Sandre de Wikidata.
- La topologie **s'arrête aux frontières** (Moselle, Sarre, Meuse, Lys) et aux estuaires.

### BD TOPAGE (Sandre / OFB / IGN, WFS `topage2026`)

- **Aucun attribut** ne donne le receveur, la longueur ou l'ordre de Strahler. Il faut déduire le receveur des tronçons : on prend le dernier tronçon vers l'aval et on regarde quel cours d'eau commence au nœud suivant. Ça fonctionne, mais BD TOPO le donne plus simplement.
- Les identifiants des nœuds changent à chaque millésime.

## Validation sur les chaînes de test

| Chaîne attendue | Wikidata | Topologie IGN |
|---|---|---|
| Loir → Sarthe → Maine → Loire → Atlantique | OK (via golfe de Gascogne) | OK jusqu'à la Loire |
| Aisne → Oise → Seine → Manche | OK | OK (l'Oise a aussi un confluent avec un canal : garder le plus en aval) |
| Gartempe → Creuse → Vienne → Loire → Atlantique | OK (via golfe de Gascogne) | OK jusqu'à la Loire |
| Vologne → Moselle → Rhin → mer du Nord | OK | S'arrête à la frontière luxembourgeoise |
| Ognon → Saône → Rhône → Méditerranée | OK | OK |

La chaîne du Loir a été revérifiée par une requête SPARQL indépendante.

Contrôle croisé sur 70 affluents tirés au hasard : 61 concordent entre Wikidata et l'IGN, 3 ne sont pas comparables, et les 6 écarts viennent tous de l'IGN :
- valeurs aberrantes, comme une altitude à −1 000 m ;
- rivières découpées en plusieurs objets ;
- codes partagés entre plusieurs objets ;
- même rivière connue sous deux noms.

Aucune erreur Wikidata n'a été trouvée dans cet échantillon.

## Cas particuliers et règles proposées

- **La Maine** est un cours d'eau à part entière dans les deux sources (11,5 km). Beaucoup de rivières portent le même nom : on identifie toujours une rivière par son identifiant Wikidata (QID), jamais par son nom.
- **Dordogne, Garonne et Gironde** : dans Wikidata, Dordogne et Garonne se jettent dans l'« estuaire de la Gironde », qui rejoint l'Atlantique. L'IGN s'arrête au Bec d'Ambès.
- **Lacs** : le Léman n'a pas d'embouchure dans Wikidata, et la Dranse s'arrête dans le lac. Il faut des règles manuelles : Léman → Rhône, et de même pour les lacs d'Annecy et du Bourget.
- **Étangs** : l'Arc et la Touloubre se jettent dans l'étang de Berre. Règle proposée : étang de Berre → Méditerranée (idem étang de Thau).
- **Corse** : ses fleuves arrivent en « mer Tyrrhénienne » ou en « mer Ligure », à ramener à la Méditerranée.
- **Rivières étrangères ayant un code Sandre** (Alzette, Doire ripaire) : à exclure.

## Règles décidées (28/10/2026)

1. **La Gironde est une étape facultative** : les chemins Garonne → Atlantique et Garonne → Gironde → Atlantique sont tous deux justes (de même pour la Dordogne).
2. **Un lac traversé ne compte pas comme une étape** : pour la Dranse, la réponse attendue est le Rhône ; citer le Léman n'est pas une erreur.
3. **La Corse est incluse** : ses fleuves aboutissent tous en Méditerranée.

## Le pipeline

```bash
uv run scripts/data/build_rivers.py            # utilise le cache scripts/data/cache/
uv run scripts/data/build_rivers.py --refresh  # retélécharge Wikidata et Wikipédia
```

1. **Wikidata** : deux requêtes SPARQL. La première ramène tous les cours d'eau ayant un code Sandre, avec leur longueur. La seconde ramène tous les nœuds atteignables en suivant les embouchures, avec leur nom, leurs sitelinks et leur article Wikipédia.
2. **Sélection** : cours d'eau de métropole, Corse comprise (code Sandre de 8 caractères commençant par une lettre ou un tiret), ayant au moins 12 sitelinks, plus les ajouts de `rules.yaml`. Quand deux rivières de départ portent le même nom, on ne garde que la plus connue.
3. **Chaînes** : on remonte les embouchures jusqu'à un point d'arrivée de `rules.yaml` (mers, golfes, baies, estuaires). Les étapes facultatives et les lacs transparents y sont aussi déclarés. Une embouchure multiple se résout au profit d'un cours d'eau français ; sinon, il faut une règle.
4. **Noms** : on prend le libellé Wikidata, et l'article est tiré de la première phrase de l'article Wikipédia (« La Sarthe est une rivière… »). On peut aussi l'imposer dans `rules.yaml`.
5. **Difficulté** : nombre d'étapes obligatoires, notoriété (sitelinks), et un bonus quand le chemin passe par l'étranger.
6. **Sorties** :
   - `assets/data/rivers.json` : rivières jouables, étapes et mers ;
   - `assets/data/watercourse-names.json` : 4 648 noms, sans article, pour l'autocomplétion ;
   - `scripts/data/report.md` : chaînes non résolues, rivières écartées, articles devinés, toutes les chaînes ;
   - `scripts/data/review.md` : les 50 chaînes à relire à la main.

Pour corriger une chaîne : une règle dans `rules.yaml`, puis on relance. On ne touche jamais aux JSON à la main.

**Reste à faire** :
- **Contrôle IGN** : relier code Sandre → tronçons BD TOPO → objet « Graphe unitaire » → nœud de confluence. Chaque écart avec Wikidata part en revue manuelle.
- **Géométries** : prendre les tronçons du réseau principal (`reseau_principal_coulant`), les fusionner, les simplifier, puis les exporter en TopoJSON ou en polyline encodée. Le Loir, simplifié à 300 m, tient en 213 points, soit environ 8 Ko.
- **Difficulté** : l'affiner avec les pages vues de Wikipédia en français, qui reflètent mieux la notoriété en France que les sitelinks. Éviter l'ordre de Strahler, qui n'est pas comparable d'une région à l'autre.

Outils prévus pour la suite : `geopandas`/`pyogrio`, `shapely` 2 et `pyproj`.

## Licences et mentions à afficher

| Source | Licence | Mention |
|---|---|---|
| Wikidata | CC0 | Aucune obligatoire ; « Données : Wikidata » par courtoisie |
| BD TOPO, BD CARTO (IGN) | Licence Ouverte 2.0 | « Source : IGN – BD TOPO®, mise à jour du JJ/MM/AAAA » (source et date obligatoires) |
| BD TOPAGE (si utilisée) | Licence Ouverte 2.0 | « BD TOPAGE® – Sandre/OFB/IGN, millésime AAAA » |
| Marine Regions (si utilisé pour contrôler la mer d'arrivée) | CC-BY | « Flanders Marine Institute : MarineRegions.org » |

## Accès

- WFS IGN : https://data.geopf.fr/wfs/ows (couches `BDTOPO_V3:*`, `BDCARTO_V5:*`)
- WFS Sandre : https://services.sandre.eaufrance.fr/geo/topage2026
- Téléchargements BD TOPAGE 2026 : https://services.sandre.eaufrance.fr/telechargement/geo/ETH/BDTopage/2026/ (cours d'eau 191 Mo, tronçons 804 Mo, nœuds 131 Mo en GPKG). Les requêtes WFS ciblées suffisent pour quelque 250 rivières.
- Descriptif de contenu BD TOPO 3.5 : https://data.geopf.fr/annexes/ressources/documentation/DC_BDTOPO_3-5.pdf
- SPARQL Wikidata : https://query.wikidata.org/sparql
