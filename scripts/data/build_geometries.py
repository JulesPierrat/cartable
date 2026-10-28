# /// script
# requires-python = ">=3.11"
# dependencies = ["requests>=2.32", "pyyaml>=6", "shapely>=2"]
# ///
"""Construit les tracés de la carte de « Jusqu'à la mer » à partir de l'IGN.

Usage : uv run scripts/data/build_geometries.py [--refresh]

À lancer après build_rivers.py : il trace chaque cours d'eau décrit dans assets/data/rivers.json.
- Rivières : BD TOPO (tronçons du réseau principal, reliés par leur code Sandre).
- Contour de la France : ADMIN EXPRESS petite échelle (régions de métropole, Corse comprise).
Les réponses du WFS de l'IGN sont gardées dans scripts/data/cache/wfs/ ; --refresh les retélécharge.

Sortie : assets/data/geo.json, en coordonnées Lambert-93 (EPSG:2154) ramenées en hectomètres,
nord en haut : X = x / 100, Y = (7 200 000 - y) / 100. Chaque ligne est une liste plate d'entiers :
le premier point en absolu, les suivants en écart au précédent.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date
from pathlib import Path

import requests
import yaml
from shapely.geometry import LineString, MultiLineString, MultiPolygon, Polygon, shape
from shapely.ops import linemerge, unary_union

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache" / "wfs"
RIVERS = ROOT / "assets" / "data" / "rivers.json"
OUTPUT = ROOT / "assets" / "data" / "geo.json"

WFS_URL = "https://data.geopf.fr/wfs/ows"
USER_AGENT = "cartable-data/0.1 (jeu de géographie ; https://github.com/JulesPierrat/cartable)"
PAGE_SIZE = 5000

# Tolérances de simplification (mètres) : assez fin pour une rivière de 30 km vue en gros plan,
# assez léger pour embarquer tous les tracés dans l'app.
RIVER_TOLERANCE_M = 250
FRANCE_TOLERANCE_M = 1000
# Îles plus petites que ça (km²) : retirées du contour.
MIN_ISLAND_KM2 = 40
# Régions d'outre-mer (codes INSEE), exclues du contour.
OVERSEAS_REGIONS = {"01", "02", "03", "04", "06"}

Y_TOP = 7_200_000
UNIT_M = 100


def wfs(http: requests.Session, layer: str, cql: str | None, refresh: bool, cache_name: str) -> list[dict]:
    """Toutes les entités d'une couche WFS (en Lambert-93), page par page, avec cache."""
    path = CACHE / f"{cache_name}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text())
    features: list[dict] = []
    start = 0
    while True:
        params = {
            "SERVICE": "WFS",
            "VERSION": "2.0.0",
            "REQUEST": "GetFeature",
            "TYPENAMES": layer,
            "OUTPUTFORMAT": "application/json",
            "SRSNAME": "EPSG:2154",
            "COUNT": PAGE_SIZE,
            "STARTINDEX": start,
        }
        if cql:
            params["CQL_FILTER"] = cql
        for attempt in range(4):
            try:
                response = http.get(WFS_URL, params=params, timeout=180)
                response.raise_for_status()
                break
            except requests.RequestException:
                if attempt == 3:
                    raise
                time.sleep(5 * (attempt + 1))
        page = response.json()["features"]
        features += [{"geometry": f["geometry"], "properties": f.get("properties", {})} for f in page]
        if len(page) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(features))
    return features


def encode_line(coords) -> list[int]:
    """Points Lambert-93 → entiers en hectomètres, nord en haut, en écarts successifs."""
    flat: list[int] = []
    previous = (0, 0)
    for x, y, *_ in coords:
        point = (round(x / UNIT_M), round((Y_TOP - y) / UNIT_M))
        if flat and point == previous:
            continue
        flat += [point[0] - previous[0], point[1] - previous[1]]
        previous = point
    return flat


def river_lines(features: list[dict]) -> list[list[int]]:
    lines = [shape(f["geometry"]) for f in features]
    merged = linemerge(MultiLineString([line for line in lines if isinstance(line, LineString)]))
    parts = merged.geoms if isinstance(merged, MultiLineString) else [merged]
    simplified = [part.simplify(RIVER_TOLERANCE_M) for part in parts if part.length > 0]
    # Les petits bouts isolés (moins de 2 km) n'apportent rien à cette échelle.
    kept = [part for part in simplified if part.length >= 2000] or simplified
    return [encode_line(part.coords) for part in kept]


def france_rings(features: list[dict]) -> list[list[int]]:
    """Le contour seul de la France : les régions fusionnées en une forme, sans aucune limite intérieure."""
    regions = [shape(f["geometry"]) for f in features if f["properties"].get("code_insee") not in OVERSEAS_REGIONS]
    # Gonfler puis dégonfler de 500 m referme les interstices entre régions mal jointives,
    # qui laisseraient sinon apparaître des bouts de frontières intérieures.
    land = unary_union(regions).buffer(500).buffer(-500).simplify(FRANCE_TOLERANCE_M)
    polygons = land.geoms if isinstance(land, MultiPolygon) else [land]
    kept = [p for p in polygons if isinstance(p, Polygon) and p.area >= MIN_ISLAND_KM2 * 1_000_000]
    return [encode_line(p.exterior.coords) for p in sorted(kept, key=lambda p: -p.area)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--refresh", action="store_true", help="retélécharger les données de l'IGN")
    args = parser.parse_args()

    rules = yaml.safe_load((HERE / "rules.yaml").read_text())
    code_overrides: dict[str, str] = rules.get("geometry_codes") or {}
    dataset = json.loads(RIVERS.read_text())
    http = requests.Session()
    http.headers["User-Agent"] = USER_AGENT

    france = france_rings(wfs(http, "ADMINEXPRESS-COG-CARTO-PE.LATEST:region", None, args.refresh, "regions"))

    lines: dict[str, list[list[int]]] = {}
    missing: list[str] = []
    watercourses = dataset["watercourses"]
    for index, (qid, watercourse) in enumerate(sorted(watercourses.items()), start=1):
        code = code_overrides.get(qid) or watercourse.get("sandreCode")
        if not code:
            missing.append(f"{watercourse['name']} ({qid}) : pas de code Sandre")
            continue
        cql = f"code_du_cours_d_eau_bdcarthage='{code}' AND reseau_principal_coulant=true"
        features = wfs(http, "BDTOPO_V3:troncon_hydrographique", cql, args.refresh, f"troncons-{code}")
        if not features:
            missing.append(f"{watercourse['name']} ({qid}) : aucun tronçon pour le code {code}")
            continue
        lines[qid] = river_lines(features)
        print(f"[{index}/{len(watercourses)}] {watercourse['name']} : {len(features)} tronçons", flush=True)

    OUTPUT.write_text(
        json.dumps(
            {
                "version": 1,
                "source": "IGN – BD TOPO®, ADMIN EXPRESS (Licence Ouverte 2.0)",
                # Date de consultation du WFS de l'IGN (celle du cache) : la licence demande de la citer.
                "snapshot": date.fromtimestamp((CACHE / "regions.json").stat().st_mtime).isoformat(),
                "projection": "Lambert-93 en hectomètres, Y = (7 200 000 - y) / 100",
                "france": france,
                "watercourses": lines,
            },
            separators=(",", ":"),
        )
        + "\n"
    )
    size = OUTPUT.stat().st_size // 1024
    print(f"{len(lines)} cours d'eau tracés, {len(missing)} sans tracé, {size} Ko.")
    for line in missing:
        print(f"  - {line}")


if __name__ == "__main__":
    sys.exit(main())
