# /// script
# requires-python = ">=3.11"
# dependencies = ["requests>=2.32", "pyyaml>=6"]
# ///
"""Construit les données du jeu « Jusqu'à la mer » à partir de Wikidata.

Usage : uv run scripts/data/build_rivers.py [--refresh]

Les réponses de Wikidata et de Wikipédia sont gardées dans scripts/data/cache/ ;
--refresh les télécharge à nouveau.

Sorties :
- assets/data/rivers.json : rivières jouables et leur chaîne jusqu'à la mer ;
- assets/data/watercourse-names.json : tous les noms de cours d'eau connus, du plus au moins connu, pour l'autocomplétion ;
- scripts/data/report.md : ce qui demande une relecture.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import statistics
import sys
import time
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import requests
import yaml

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
OUTPUT = ROOT / "assets" / "data"
USER_AGENT = "cartable-data/0.1 (jeu de géographie ; https://github.com/JulesPierrat/cartable)"

SPARQL_URL = "https://query.wikidata.org/sparql"
WIKIPEDIA_API = "https://fr.wikipedia.org/w/api.php"

# Rivières assez connues pour être jouables (nombre d'articles Wikipédia, toutes langues).
MIN_SITELINKS = 12
# Code hydrographique Sandre d'un cours d'eau de métropole : 8 caractères, commence par une
# lettre ou un tiret (les codes d'outre-mer commencent par un chiffre), le 8e caractère
# vaut 0 ou un tiret (1 = bras, 2 = canal).
METRO_CODE = re.compile(r"^[A-Z-][A-Z0-9-]{3}[0-9-]{3}[0-]$")

SEAS = {
    "channel": {"name": "Manche", "article": "la", "shortName": "Manche"},
    "north-sea": {"name": "mer du Nord", "article": "la", "shortName": "Mer du Nord"},
    "atlantic": {"name": "océan Atlantique", "article": "l'", "shortName": "Atlantique"},
    "mediterranean": {"name": "mer Méditerranée", "article": "la", "shortName": "Méditerranée"},
}

RIVERS_QUERY = """
SELECT ?item ?code ?lengthM WHERE {
  ?item wdt:P1717 ?code .
  OPTIONAL { ?item p:P2043/psn:P2043/wikibase:quantityAmount ?lengthM }
}
"""

# Tous les nœuds atteignables en suivant les embouchures (P403) depuis un cours d'eau français,
# y compris le cours d'eau lui-même.
GRAPH_QUERY = """
SELECT DISTINCT ?node ?label ?sitelinks ?title ?mouth WHERE {
  ?item wdt:P1717 [] ; wdt:P403* ?node .
  ?node wikibase:sitelinks ?sitelinks .
  OPTIONAL { ?node rdfs:label ?label FILTER(lang(?label) = "fr") }
  OPTIONAL { ?article schema:about ?node ; schema:isPartOf <https://fr.wikipedia.org/> ; schema:name ?title }
  OPTIONAL { ?node wdt:P403 ?mouth }
}
"""


@dataclass
class Node:
    qid: str
    label: str | None = None
    sitelinks: int = 0
    title: str | None = None
    mouths: set[str] = field(default_factory=set)
    sandre_codes: set[str] = field(default_factory=set)
    lengths_m: list[float] = field(default_factory=list)

    @property
    def is_metro_watercourse(self) -> bool:
        return any(METRO_CODE.match(code) for code in self.sandre_codes)


class Unresolved(Exception):
    """La chaîne d'une rivière ne mène pas à une des quatre mers."""


# --- Téléchargement -------------------------------------------------------------------------


def session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = USER_AGENT
    return s


def cached(name: str, refresh: bool, fetch):
    path = CACHE / f"{name}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text())
    data = fetch()
    CACHE.mkdir(exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False))
    return data


def sparql(http: requests.Session, query: str) -> list[dict]:
    response = http.get(
        SPARQL_URL,
        params={"query": query},
        headers={"Accept": "application/sparql-results+json"},
        timeout=120,
    )
    response.raise_for_status()
    return response.json()["results"]["bindings"]


def wikipedia_intros(http: requests.Session, titles: list[str]) -> dict[str, str]:
    """Début de l'introduction de chaque article de Wikipédia en français (par lots de 20)."""
    intros: dict[str, str] = {}
    for start in range(0, len(titles), 20):
        batch = titles[start : start + 20]
        response = http.get(
            WIKIPEDIA_API,
            params={
                "action": "query",
                "prop": "extracts",
                "exintro": 1,
                "explaintext": 1,
                "exchars": 200,
                "redirects": 1,
                "titles": "|".join(batch),
                "format": "json",
                "formatversion": 2,
            },
            timeout=60,
        )
        response.raise_for_status()
        query = response.json()["query"]
        renamed = {r["to"]: r["from"] for r in query.get("redirects", [])}
        renamed |= {n["to"]: n["from"] for n in query.get("normalized", [])}
        for page in query.get("pages", []):
            title = page["title"]
            intros[renamed.get(title, title)] = page.get("extract", "")
        time.sleep(0.5)
    return intros


def qid(binding: dict, key: str) -> str:
    return binding[key]["value"].rsplit("/", 1)[1]


def load_graph(http: requests.Session, refresh: bool) -> dict[str, Node]:
    graph_rows = cached("graph", refresh, lambda: sparql(http, GRAPH_QUERY))
    river_rows = cached("rivers", refresh, lambda: sparql(http, RIVERS_QUERY))

    nodes: dict[str, Node] = {}
    for row in graph_rows:
        node = nodes.setdefault(qid(row, "node"), Node(qid(row, "node")))
        node.label = row.get("label", {}).get("value", node.label)
        node.title = row.get("title", {}).get("value", node.title)
        node.sitelinks = int(row["sitelinks"]["value"])
        if "mouth" in row:
            node.mouths.add(qid(row, "mouth"))
    for row in river_rows:
        node = nodes.get(qid(row, "item"))
        if node is None:
            continue
        node.sandre_codes.add(row["code"]["value"])
        if "lengthM" in row:
            node.lengths_m.append(float(row["lengthM"]["value"]))
    return nodes


# --- Chaînes --------------------------------------------------------------------------------


class Resolver:
    def __init__(self, nodes: dict[str, Node], rules: dict):
        self.nodes = nodes
        self.sea_of = {q: sea for sea, qids in rules["seas"].items() for q in qids}
        self.optional = rules.get("optional_steps") or {}
        self.transparent = rules.get("transparent") or {}
        self.fixes = rules.get("mouth_fixes") or {}

    def is_terminal(self, q: str) -> bool:
        return q in self.sea_of

    def next_node(self, q: str) -> str:
        if q in self.fixes:
            return self.fixes[q]["mouth"]
        mouths = self.nodes[q].mouths if q in self.nodes else set()
        if not mouths:
            raise Unresolved(f"{self.describe(q)} n'a pas d'embouchure connue")
        if len(mouths) == 1:
            return next(iter(mouths))
        # Plusieurs embouchures : on préfère un cours d'eau français, puis une mer du jeu.
        watercourses = [m for m in mouths if m in self.nodes and self.nodes[m].is_metro_watercourse]
        if len(watercourses) == 1:
            return watercourses[0]
        seas = {self.sea_of[m] for m in mouths if m in self.sea_of}
        if not watercourses and len(seas) == 1:
            return next(m for m in sorted(mouths) if m in self.sea_of)
        names = ", ".join(self.describe(m) for m in sorted(mouths))
        raise Unresolved(f"{self.describe(q)} a plusieurs embouchures : {names}")

    def chain(self, start: str) -> tuple[list[dict], str]:
        """Étapes à citer après `start`, puis la mer d'arrivée."""
        steps: list[dict] = []
        seen = {start}
        current = start
        while True:
            nxt = self.next_node(current)
            if nxt in self.sea_of:
                return steps, self.sea_of[nxt]
            if nxt in seen:
                raise Unresolved(f"boucle sur {self.describe(nxt)}")
            seen.add(nxt)
            if nxt in self.transparent:
                steps.append({"id": nxt, "optional": True})
                then = self.transparent[nxt]["then"]
                if then in SEAS:
                    return steps, then
                steps.append({"id": then})
                seen.add(then)
                current = then
                continue
            if nxt in self.optional:
                steps.append({"id": nxt, "optional": True})
            else:
                steps.append({"id": nxt})
            current = nxt

    def describe(self, q: str) -> str:
        label = self.nodes[q].label if q in self.nodes else None
        return f"{label or '?'} ({q})"


# --- Noms et articles -----------------------------------------------------------------------


ARTICLE = re.compile(r"^\s*(Les |Le |La |L['’])", re.IGNORECASE)


def split_label(label: str) -> tuple[str | None, str]:
    """Sépare l'article que certains libellés Wikidata contiennent (« le Paillon ») du nom,
    retire une précision entre parenthèses et met une majuscule au nom (« gave d'Aspe »)."""
    label = re.sub(r"\s*\(.*\)$", "", label).strip()
    article = None
    match = ARTICLE.match(label)
    if match:
        article = match.group(1).strip().lower().replace("’", "'")
        label = label[match.end() :].strip()
    return article, label[:1].upper() + label[1:]


def clean_label(label: str) -> str:
    return split_label(label)[1]


def article_from_intro(intro: str, name: str) -> str | None:
    """Article de l'introduction Wikipédia, s'il précède bien le nom du cours d'eau."""
    match = ARTICLE.match(intro)
    if not match:
        return None
    rest = intro[match.end() :]
    if not normalize(rest).startswith(normalize(name)[:4]):
        return None
    word = match.group(1).strip().lower().replace("’", "'")
    return word


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


# --- Programme principal --------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--refresh", action="store_true", help="retélécharger Wikidata et Wikipédia")
    args = parser.parse_args()

    rules = yaml.safe_load((HERE / "rules.yaml").read_text())
    http = session()
    nodes = load_graph(http, args.refresh)
    resolver = Resolver(nodes, rules)
    exclusions: dict[str, str] = rules.get("exclusions") or {}
    additions: list[str] = rules.get("additions") or []
    report = Report()

    # Rivières candidates : cours d'eau de métropole assez connus, plus les ajouts manuels.
    candidates = [
        n.qid
        for n in nodes.values()
        if (n.is_metro_watercourse and n.sitelinks >= MIN_SITELINKS) or n.qid in additions
    ]
    playable: dict[str, tuple[list[dict], str]] = {}
    for q in sorted(candidates, key=lambda q: -nodes[q].sitelinks):
        if q in exclusions:
            report.excluded.append((resolver.describe(q), exclusions[q]))
            continue
        if not nodes[q].label:
            report.excluded.append((resolver.describe(q), "pas de nom en français"))
            continue
        try:
            playable[q] = resolver.chain(q)
        except Unresolved as error:
            report.unresolved.append((resolver.describe(q), str(error)))

    # Deux rivières jouables ne peuvent pas porter le même nom : on garde la plus connue.
    by_name: dict[str, list[str]] = defaultdict(list)
    for q in playable:
        by_name[normalize(clean_label(nodes[q].label))].append(q)
    for same in by_name.values():
        kept, *others = sorted(same, key=lambda q: -nodes[q].sitelinks)
        for q in others:
            report.excluded.append((resolver.describe(q), f"homonyme de {resolver.describe(kept)}, plus connue"))
            del playable[q]

    # Cours d'eau à décrire : les rivières jouables et toutes leurs étapes.
    described = set(playable) | {step["id"] for steps, _ in playable.values() for step in steps}
    names_rules: dict[str, dict] = rules.get("names") or {}
    optional_rules = rules.get("optional_steps") or {}
    titles = sorted({nodes[q].title for q in described if q in nodes and nodes[q].title})
    intros = cached("wikipedia-intros", args.refresh, lambda: wikipedia_intros(http, titles))
    missing = [t for t in titles if t not in intros]
    if missing:
        intros |= wikipedia_intros(http, missing)
        (CACHE / "wikipedia-intros.json").write_text(json.dumps(intros, ensure_ascii=False))

    watercourses: dict[str, dict] = {}
    for q in sorted(described):
        node = nodes[q]
        override = names_rules.get(q) or optional_rules.get(q) or {}
        label_article, label_name = split_label(node.label or "")
        name = override.get("name") or label_name
        article = (
            override.get("article")
            or label_article
            or article_from_intro(intros.get(node.title or "", ""), name)
        )
        if article is None:
            article = "l'" if normalize(name)[:1] in "aeiouyh" else "la"
            report.guessed_articles.append((resolver.describe(q), article))
        entry = {"name": name, "article": article, "sitelinks": node.sitelinks}
        metro_codes = sorted(c for c in node.sandre_codes if METRO_CODE.match(c))
        if metro_codes:
            entry["sandreCode"] = metro_codes[0]
        if node.lengths_m:
            entry["lengthKm"] = round(statistics.median(node.lengths_m) / 1000, 1)
        watercourses[q] = entry

    rivers = []
    for q, (steps, sea) in sorted(playable.items(), key=lambda item: normalize(watercourses[item[0]]["name"])):
        abroad = any(not step.get("optional") and not nodes[step["id"]].is_metro_watercourse for step in steps)
        rivers.append(
            {"id": q, "steps": steps, "sea": sea, "difficulty": difficulty(steps, nodes[q].sitelinks, abroad)}
        )

    # Noms pour l'autocomplétion : tous les cours d'eau de métropole connus et toutes les étapes,
    # du plus connu au moins connu (un nom porté par plusieurs cours d'eau prend la meilleure notoriété).
    notoriety: dict[str, int] = defaultdict(int)
    for n in nodes.values():
        if n.label and n.is_metro_watercourse:
            name = clean_label(n.label)
            notoriety[name] = max(notoriety[name], n.sitelinks)
    for w in watercourses.values():
        notoriety[w["name"]] = max(notoriety[w["name"]], w["sitelinks"])
    names = sorted(notoriety, key=lambda name: (-notoriety[name], normalize(name)))

    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Date de l'instantané : celle du téléchargement de Wikidata, pas celle du passage du script.
    snapshot = date.fromtimestamp((CACHE / "graph.json").stat().st_mtime).isoformat()
    write_json(
        OUTPUT / "rivers.json",
        {
            "version": 1,
            "snapshot": snapshot,
            "source": "Wikidata (CC0)",
            "seas": SEAS,
            "watercourses": watercourses,
            "rivers": rivers,
        },
    )
    write_json(OUTPUT / "watercourse-names.json", names)

    report.write(HERE / "report.md", snapshot, rivers, watercourses, nodes, resolver)
    print(f"{len(rivers)} rivières jouables, {len(watercourses)} cours d'eau décrits, {len(names)} noms.")
    print(f"À relire : scripts/data/report.md ({len(report.unresolved)} chaînes non résolues).")


def difficulty(steps: list[dict], sitelinks: int, abroad: bool) -> str:
    """Plus la chaîne est longue, la rivière peu connue, ou le chemin passe par l'étranger
    (l'Èbre pour le Sègre), plus c'est difficile. Les sitelinks mesurent la notoriété
    internationale, d'où le bonus pour les chaînes qui sortent de France."""
    required = sum(1 for step in steps if not step.get("optional"))
    obscurity = 0 if sitelinks >= 40 else 1 if sitelinks >= 20 else 2
    score = required + obscurity + (2 if abroad else 0)
    if score <= 1:
        return "easy"
    if score <= 3:
        return "medium"
    return "hard"


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")


@dataclass
class Report:
    unresolved: list[tuple[str, str]] = field(default_factory=list)
    excluded: list[tuple[str, str]] = field(default_factory=list)
    guessed_articles: list[tuple[str, str]] = field(default_factory=list)

    def write(self, path, snapshot, rivers, watercourses, nodes, resolver) -> None:
        def display(q: str) -> str:
            w = watercourses[q]
            return f"{w['article']} {w['name']}" if not w["article"].endswith("'") else f"{w['article']}{w['name']}"

        def chain_text(river: dict) -> str:
            parts = [display(river["id"])]
            for step in river["steps"]:
                parts.append(f"({display(step['id'])})" if step.get("optional") else display(step["id"]))
            sea = SEAS[river["sea"]]
            parts.append(sea["name"])
            return " → ".join(parts)

        levels = defaultdict(int)
        lengths = defaultdict(int)
        for river in rivers:
            levels[river["difficulty"]] += 1
            lengths[sum(1 for s in river["steps"] if not s.get("optional"))] += 1

        lines = [
            "# Rapport de construction des données",
            "",
            f"Généré par `scripts/data/build_rivers.py` à partir de l'instantané Wikidata du {snapshot}. Ne pas modifier à la main.",
            "",
            f"- **{len(rivers)} rivières jouables** (au moins {MIN_SITELINKS} articles Wikipédia).",
            "- Difficulté : " + ", ".join(f"{k} {levels[k]}" for k in ("easy", "medium", "hard")) + ".",
            "- Étapes obligatoires avant la mer : " + ", ".join(f"{k} → {lengths[k]}" for k in sorted(lengths)) + ".",
            "",
            "## Chaînes non résolues",
            "",
            "Rivières candidates écartées faute de chaîne complète : ajouter une règle dans `rules.yaml` si elles méritent d'être jouables.",
            "",
        ]
        lines += [f"- {name} : {reason}" for name, reason in self.unresolved] or ["Aucune."]
        lines += ["", "## Rivières écartées", ""]
        lines += [f"- {name} : {reason}" for name, reason in self.excluded] or ["Aucune."]
        lines += ["", "## Articles devinés", "", "Wikipédia ne les donnait pas : à vérifier, et à corriger dans `names` de `rules.yaml`.", ""]
        lines += [f"- {name} : « {article} »" for name, article in self.guessed_articles] or ["Aucun."]
        lines += ["", "## Toutes les chaînes", ""]
        lines += [f"- {chain_text(r)} — *{r['difficulty']}*" for r in rivers]
        path.write_text("\n".join(lines) + "\n")

        # La liste de relecture n'est écrite qu'une fois, pour ne pas effacer les cases cochées.
        review = path.with_name("review.md")
        if not review.exists():
            sample = random.Random(snapshot).sample(rivers, min(50, len(rivers)))
            review_lines = [
                "# Revue manuelle : 50 chaînes tirées au hasard",
                "",
                f"Échantillon tiré de l'instantané du {snapshot}. Coche chaque chaîne vérifiée ; une étape entre",
                "parenthèses est facultative. Une chaîne fausse se corrige dans `rules.yaml`, puis on relance le pipeline.",
                "Ce fichier n'est pas réécrit par le pipeline : supprime-le pour tirer un nouvel échantillon.",
                "",
            ]
            review_lines += [
                f"- [ ] {chain_text(r)}"
                for r in sorted(sample, key=lambda r: normalize(watercourses[r["id"]]["name"]))
            ]
            review.write_text("\n".join(review_lines) + "\n")


if __name__ == "__main__":
    sys.exit(main())
