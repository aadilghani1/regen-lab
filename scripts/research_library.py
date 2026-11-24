"""Build the local research graph, export it for the viewer, or search its text."""
import argparse
import csv
import hashlib
import html
import json
import re
import sqlite3
import tempfile
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / ".cache/research.sqlite"
WEB = ROOT / "packages/viewer/public/research-index.json"


def graph(local_pdfs=True):
    nodes, edges, aliases = {}, set(), {}

    def paper(title, doi=None, pmid=None, fallback=None, **fields):
        identifiers = [x for x in (f"doi:{doi.lower()}" if doi else None,
                                   f"pmid:{pmid}" if pmid else None, fallback) if x]
        key = next((aliases[x] for x in identifiers if x in aliases), identifiers[0])
        aliases.update(dict.fromkeys(identifiers, key))
        node = nodes.setdefault(key, dict(id=key, kind="Paper", title=title, text="", source=""))
        if doi:
            node["source"] = f"https://doi.org/{doi}"
        elif pmid and not node["source"]:
            node["source"] = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        node.update(fields)
        return key

    receipts = [json.loads(path.read_text()) for path in sorted((ROOT / "literature/full-text").glob("*.json"))]
    for record in receipts:
        accession = record["accession"].split(".")[0]
        if record.get("doi"):
            aliases[f"PMC:{accession}"] = "doi:" + record["doi"].lower()
        elif record.get("pmid"):
            aliases[f"PMC:{accession}"] = f"pmid:{record['pmid']}"

    for line in (ROOT / "literature/search-log.jsonl").read_text().splitlines():
        if line.strip():
            d = json.loads(line)
            paper(re.sub(r"</?(?:i|b|sub|sup)>", "", html.unescape(d["title"])), d["doi"], d["pmid"], f'{d["source"]}:{d["id"]}', authors=d["authors"] or "", publication="Preprint" if d["source"] == "PPR" else "")
    for d in receipts:
        cached = ROOT.parent / ".regen-paper-cache" / (d["accession"] + ".txt")
        raw = cached.read_bytes() if cached.exists() else b""
        if cached.exists() and hashlib.sha256(raw).hexdigest() != d["sha256"]:
            raise ValueError(f"Paper checksum mismatch: {cached.name}")
        paper(d["title"], d["doi"], d["pmid"], "PMC:" + d["accession"].split(".")[0], text=raw.decode(), license=d["license_code"],
              origin=d["source_url"], accession=d["accession"])
    for path in (sorted((ROOT.parent / ".regen-paper-cache/pdf").glob("*.json")) if local_pdfs else []):
        d = json.loads(path.read_text())
        key = paper(d["title"], d["doi"])
        if not nodes[key]["text"]:
            nodes[key]["text"] = "\n\n".join(f"Page {i}\n{page}" for i, page in enumerate(d["pages"], 1))
            nodes[key]["format"] = "PDF extraction"
    for d in tomllib.loads((ROOT / "evidence/assumptions.toml").read_text())["assumption"]:
        key = d["id"]
        nodes[key] = dict(id=key, kind="Model rule", title=key, text=d["statement"],
                          status=d["status"], module=d["module"])
        for ref in d.get("citations", []):
            target = paper(ref["ref"], ref.get("doi"), ref.get("pmid"), ref["ref"])
            edges.add((key, "cites", target))
    for path in sorted((ROOT / "packages/scenarios/catalog").glob("*.toml")):
        d = tomllib.loads(path.read_text())
        key = "scenario:" + d["name"]
        nodes[key] = dict(id=key, kind="Scenario", title=d["name"], text=d["summary"])
        for target in d.get("benchmark", {}).get("assumptions", []):
            edges.add((key, "uses rule", target))
    for path in sorted((ROOT / "literature/notes").glob("*.md")):
        body = path.read_text()
        key = "note:" + path.stem
        nodes[key] = dict(id=key, kind="Reading note", title=body.splitlines()[0].lstrip("# "), text=body)
        for pmid in re.findall(r"\bPMID\s*:?\s*(\d+)", body, re.I):
            target = aliases.get(f"pmid:{pmid}")
            if target:
                edges.add((key, "discusses", target))
        for rule in re.findall(r"\bA\d+-[a-z-]+", body):
            if rule in nodes:
                edges.add((key, "discusses", rule))
    for filename in ("title-screen.tsv", "measurements.tsv"):
        with (ROOT / "literature" / filename).open() as stream:
            seen = set()
            for row in csv.DictReader(stream, delimiter="\t"):
                key = aliases[row.pop("paper")]
                if key in seen:
                    raise ValueError(f"Duplicate {filename} record for {key}")
                seen.add(key)
                nodes[key].update(row)
                if "measured" in row and not all(row[k] for k in ("measured", "groups", "location")):
                    raise ValueError(f"Incomplete measurement for {key}")
                if row.get("independent_cohort") and not row.get("onset_review"):
                    raise ValueError(f"Missing eligibility rationale for {key}")
    for n in nodes.values():
        if n.get("origin"):
            references = n["text"].partition("\nReferences\n")[2]
            for doi in re.findall(r"10\.\d{4,9}/[^\s]+", references, re.I):
                target = aliases.get("doi:" + doi.rstrip(".,;").lower())
                if target and target != n["id"]:
                    edges.add((n["id"], "cites", target))
    for f in tomllib.loads((ROOT / "literature/findings.toml").read_text())["finding"]:
        key = "finding:" + f["id"]
        target = aliases["doi:" + f["doi"].lower()]
        if nodes[target]["text"] and f["anchor"] not in nodes[target]["text"]:
            raise ValueError(f"Cannot locate evidence passage for {key}")
        nodes[key] = dict(f, id=key, kind="Finding", paper=target)
        edges.add((key, "draws from", target))
    if any(a not in nodes or b not in nodes for a, _, b in edges):
        raise ValueError("Unresolved research graph edge")
    return list(nodes.values()), sorted(edges)


def build():
    nodes, edges = graph()
    DB.parent.mkdir(exist_ok=True)
    WEB.parent.mkdir(exist_ok=True, parents=True)
    with tempfile.TemporaryDirectory(dir=DB.parent) as tmp:
        path = Path(tmp) / "index.sqlite"
        conn = sqlite3.connect(path)
        with conn:
            conn.executescript("""
                CREATE TABLE nodes(id TEXT PRIMARY KEY, kind TEXT, title TEXT, record TEXT);
                CREATE TABLE edges(subject TEXT, relation TEXT, object TEXT, PRIMARY KEY(subject, relation, object));
                CREATE INDEX incoming ON edges(object);
                CREATE VIRTUAL TABLE documents USING fts5(id UNINDEXED, title, body, context);
            """)
            for n in nodes:
                conn.execute("INSERT INTO nodes VALUES(?,?,?,?)", (n["id"], n["kind"], n["title"], json.dumps(n)))
                conn.execute("INSERT INTO documents VALUES(?,?,?,?)", (n["id"], n["title"], "\n".join(filter(None, (n["text"], n.get("measured"), n.get("groups"), n.get("location"), n.get("onset_review")))),
                             " ".join(str(n.get(k, "")) for k in ("id","authors","module","status","accession"))))
            conn.executemany("INSERT INTO edges VALUES(?,?,?)", edges)
        conn.close()
        path.replace(DB)
    with tempfile.NamedTemporaryFile(dir=WEB.parent, mode="w", delete=False) as f:
        json.dump(dict(nodes=nodes, edges=edges), f, ensure_ascii=False)
    Path(f.name).replace(WEB)
    print(f"Indexed {len(nodes)} records and {len(edges)} connections.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("build")
    commands.add_parser("release")
    commands.add_parser("search").add_argument("query")
    commands.add_parser("neighbors").add_argument("id")
    args = parser.parse_args()
    if args.command == "release":
        nodes, edges = graph(local_pdfs=False)
        for n in nodes:
            if n.get("origin"):
                n["text"] = ""
        dest = ROOT / "packages/viewer/dist/research-index.json"
        dest.write_text(json.dumps(dict(nodes=nodes, edges=edges), ensure_ascii=False))
        return
    if args.command == "build":
        build()
        return
    if not DB.exists():
        build()
    conn = sqlite3.connect(DB)
    if args.command == "neighbors":
        rows = conn.execute("SELECT subject,relation,object FROM edges WHERE subject=? OR object=? ORDER BY 1,2,3", (args.id, args.id))
    else:
        terms = re.findall(r"\w+", args.query)
        if not terms:
            parser.error("Enter at least one search term")
        rows = conn.execute("SELECT id,title,snippet(documents,2,'[',']','…',18) FROM documents WHERE documents MATCH ? ORDER BY rank", (" AND ".join(f'"{t}"' for t in terms),))
    for row in rows:
        print("\t".join(row))
    conn.close()


if __name__ == "__main__":
    main()
