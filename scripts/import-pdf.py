"""Index a locally held, text-layer PDF. Sources and extracted pages stay on this computer."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("pdf", type=Path)
parser.add_argument("--title", required=True)
parser.add_argument("--doi", required=True)
args = parser.parse_args()
if not re.fullmatch(r"10\.\d{4,9}/\S+", args.doi, re.I):
    parser.error("Supply the DOI printed on the paper.")
try:
    result = subprocess.run(["pdftotext", "-enc", "UTF-8", str(args.pdf.resolve()), "-"],
                            check=True, capture_output=True, text=True)
except FileNotFoundError:
    parser.error("Install Poppler to provide pdftotext.")
except subprocess.CalledProcessError as exc:
    parser.error(exc.stderr)
if not result.stdout.strip():
    parser.error("This PDF has no readable text layer. Import a searchable edition.")
digest = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
cache = Path(__file__).resolve().parents[2] / ".regen-paper-cache" / "pdf"
cache.mkdir(exist_ok=True, parents=True)
record = dict(title=args.title, doi=args.doi, sha256=digest, pages=result.stdout.rstrip("\f").split("\f"))
path = cache / (digest + ".json")
path.write_text(json.dumps(record, ensure_ascii=False))
print(f"Extracted {len(record['pages'])} pages. Run bun run library build to update the index.")
