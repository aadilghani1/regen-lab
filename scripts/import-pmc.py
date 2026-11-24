"""Import a versioned PMC plain-text article with its original metadata."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("accessions", nargs="+", help="Versioned PMC accessions, e.g. PMC4895291.1")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / "literature/full-text"
root.mkdir(exist_ok=True)
cache = root.parents[2] / ".regen-paper-cache"
cache.mkdir(exist_ok=True)
for accession in args.accessions:
    if not re.fullmatch(r"PMC\d+\.\d+", accession):
        parser.error(f"Invalid accession: {accession}")
    url = f"https://pmc-oa-opendata.s3.amazonaws.com/{accession}/{accession}"
    try:
        with urlopen(url + ".json", timeout=30) as response:
            meta = json.load(response)
    except HTTPError as exc:
        if exc.code != 404:
            raise
        print(f"{accession}: no open archive record at this version")
        continue
    if meta.get("license_code") not in {"CC BY", "CC0"} or meta.get("is_retracted"):
        print(f"{accession}: skipped ({meta.get('license_code')}, retracted={meta.get('is_retracted')})")
        continue
    with urlopen(url + ".txt", timeout=30) as response:
        content = response.read()
    if hashlib.md5(content).hexdigest() != meta["text_url"].split("?md5=")[-1]:
        raise ValueError(f"PMC checksum mismatch for {accession}")
    record = {key: meta[key] for key in ("title", "pmid", "doi", "citation", "license_code")}
    record.update(accession=accession, source_url=url + ".txt", sha256=hashlib.sha256(content).hexdigest())
    (cache / f"{accession}.txt").write_bytes(content)
    (root / f"{accession}.json").write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n")
    print(f"{accession}: imported {len(content)} bytes")
