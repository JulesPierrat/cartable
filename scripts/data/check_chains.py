# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6", "shapely>=2"]
# ///
"""Contrôle les chaînes de Wikidata avec la topologie de la BD TOPO de l'IGN.

Usage : uv run scripts/data/check_chains.py   (après build_rivers.py et build_geometries.py)

Pour chaque maillon « A se jette dans B » des rivières jouables, mesure la distance entre
l'embouchure de A (l'extrémité aval de ses tronçons BD TOPO du réseau principal, gardés en cache par
build_geometries.py) et le tracé de B. Aucun téléchargement : tout vient du cache.

Sortie : scripts/data/crosscheck.md, avec les écarts à relire en tête.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

import yaml
from shapely.geometry import MultiLineString, Point, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache" / "wfs"
RIVERS = ROOT / "assets" / "data" / "rivers.json"
OUTPUT = HERE / "crosscheck.md"

# Embouchure à moins de 1,5 km du tracé de B : le maillon est confirmé (une confluence sur un bras
# secondaire tombe souvent à quelques centaines de mètres du tracé principal).
CONFIRMED_M = 1500
# Embouchure à moins de 3 km de la frontière : la confluence est sans doute à l'étranger.
BORDER_M = 3000
OVERSEAS_REGIONS = {"01", "02", "03", "04", "06"}


def load_segments(code: str) -> list[dict] | None:
    """Tronçons d'un cours d'eau : leurs attributs, avec la géométrie sous la clé `geometry`."""
    path = CACHE / f"troncons-{code}.json"
    if not path.exists():
        return None
    return [{**f["properties"], "geometry": f["geometry"]} for f in json.loads(path.read_text())]


def mouth_points(segments: list[dict]) -> list[Point]:
    """Coordonnées des extrémités aval (l'embouchure, parfois plusieurs bras)."""
    ends = downstream_ends(segments)
    points = []
    for s in segments:
        coords = s["geometry"]["coordinates"]
        if s.get("lien_vers_noeud_hydrographique_fin") in ends:
            points.append(Point(coords[-1][:2]))
        if s.get("lien_vers_noeud_hydrographique_ini") in ends:
            points.append(Point(coords[0][:2]))
    return points


def track(segments: list[dict]):
    return unary_union(MultiLineString([[c[:2] for c in s["geometry"]["coordinates"]] for s in segments]))


def downstream_ends(segments: list[dict]) -> set[str]:
    """Nœuds d'où rien ne repart vers l'aval : l'embouchure du cours d'eau (parfois plusieurs bras)."""
    outgoing: dict[str, set[str]] = defaultdict(set)
    nodes: set[str] = set()
    for s in segments:
        start, end = s.get("lien_vers_noeud_hydrographique_ini"), s.get("lien_vers_noeud_hydrographique_fin")
        if not start or not end:
            continue
        nodes |= {start, end}
        direction = s.get("sens_de_l_ecoulement")
        if direction == "Sens inverse":
            outgoing[end].add(start)
        elif direction == "Sens direct":
            outgoing[start].add(end)
        else:
            outgoing[start].add(end)
            outgoing[end].add(start)
    return {node for node in nodes if not outgoing[node]}


def all_nodes(segments: list[dict]) -> set[str]:
    return {
        node
        for s in segments
        for node in (s.get("lien_vers_noeud_hydrographique_ini"), s.get("lien_vers_noeud_hydrographique_fin"))
        if node
    }


def main() -> None:
    rules = yaml.safe_load((HERE / "rules.yaml").read_text())
    overrides: dict[str, str | list[str]] = rules.get("geometry_codes") or {}
    dataset = json.loads(RIVERS.read_text())
    watercourses = dataset["watercourses"]

    def name(qid: str) -> str:
        w = watercourses[qid]
        return f"{w['article']}{w['name']}" if w["article"].endswith("'") else f"{w['article']} {w['name']}"

    segments_cache: dict[str, list[dict] | None] = {}

    def segments(qid: str) -> list[dict] | None:
        if qid not in segments_cache:
            override = overrides.get(qid)
            codes = [override] if isinstance(override, str) else override or [watercourses[qid].get("sandreCode")]
            found = [s for code in codes if code for s in (load_segments(code) or [])]
            segments_cache[qid] = found or None
        return segments_cache[qid]

    regions = json.loads((CACHE / "regions.json").read_text())
    border = unary_union(
        [shape(f["geometry"]) for f in regions if f["properties"].get("code_insee") not in OVERSEAS_REGIONS]
    ).boundary

    # Chaque maillon n'est contrôlé qu'une fois, même s'il apparaît dans plusieurs chaînes. Une étape
    # facultative qui a un tracé (Gaves réunis) est gardée ; sans tracé (lac, estuaire), elle est notée.
    links: dict[tuple[str, str], dict] = {}
    for river in dataset["rivers"]:
        chain = [river["id"]]
        skipped: list[str] = []
        for step in river["steps"]:
            if step.get("optional") and not segments(step["id"]):
                skipped.append(step["id"])
                continue
            link = links.setdefault((chain[-1], step["id"]), {"rivers": 0, "via": list(skipped)})
            link["rivers"] += 1
            chain.append(step["id"])
            skipped = []

    results: dict[str, list[str]] = {"écart": [], "frontière": [], "ok": [], "non comparable": []}
    for (a, b), link in sorted(links.items(), key=lambda item: name(item[0][0])):
        seg_a, seg_b = segments(a), segments(b)
        count = link["rivers"]
        label = f"{name(a)} → {name(b)} ({count} chaîne{'s' if count > 1 else ''})"
        if link["via"]:
            results["non comparable"].append(f"{label} : passe par {', '.join(name(v) for v in link['via'])}")
            continue
        if not seg_a or not seg_b:
            missing = name(a) if not seg_a else name(b)
            results["non comparable"].append(f"{label} : pas de tracé IGN pour {missing}")
            continue
        mouths = mouth_points(seg_a)
        distance = min(track(seg_b).distance(p) for p in mouths)
        if distance <= CONFIRMED_M:
            results["ok"].append(label)
        elif min(border.distance(p) for p in mouths) <= BORDER_M:
            results["frontière"].append(f"{label} : {name(a)} quitte la France, la confluence est à l'étranger")
        else:
            results["écart"].append(f"{label} : embouchure à {distance / 1000:.1f} km du tracé ({name(b)})")

    total = sum(len(v) for v in results.values())
    lines = [
        "# Contrôle des chaînes avec la BD TOPO",
        "",
        "Généré par `scripts/data/check_chains.py`. Ne pas modifier à la main.",
        "",
        f"{total} maillons « A se jette dans B » contrôlés (étapes facultatives exclues) :",
        "",
        f"- **{len(results['ok'])} confirmés** : l'embouchure de A est à moins de {CONFIRMED_M / 1000:.1f} km du tracé de B ;",
        f"- **{len(results['frontière'])} à l'étranger** : A quitte la France avant de rejoindre B ;",
        f"- **{len(results['écart'])} écarts** : l'embouchure de A est loin du tracé de B, à relire en priorité ;",
        f"- **{len(results['non comparable'])} non comparables** : pas de tracé IGN, ou chemin par un lac ou un estuaire.",
        "",
    ]
    titles = {
        "écart": "Écarts à relire",
        "frontière": "Confluences à l'étranger",
        "non comparable": "Non comparables",
        "ok": "Confirmés",
    }
    for key in ("écart", "frontière", "non comparable", "ok"):
        lines += [f"## {titles[key]}", ""]
        lines += [f"- {entry}" for entry in results[key]] or ["Aucun."]
        lines.append("")
    OUTPUT.write_text("\n".join(lines))
    print(
        f"{total} maillons : {len(results['ok'])} confirmés, {len(results['frontière'])} à l'étranger, "
        f"{len(results['écart'])} écarts, {len(results['non comparable'])} non comparables."
    )


if __name__ == "__main__":
    sys.exit(main())
