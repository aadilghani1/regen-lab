#!/usr/bin/env bash
set -euo pipefail

OWNER="${OWNER:-aadilghani1}"
REPO="${REPO:-regen-lab}"
FULL="$OWNER/$REPO"

gh auth status >/dev/null

if ! gh repo view "$FULL" >/dev/null 2>&1; then
  gh repo create "$FULL" --public \
    --description "In-silico research lab for limb regeneration: functional TypeScript models, evidence registry, and an interactive viewer."
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$FULL.git"
fi
git push -u origin main

gh repo edit "$FULL" \
  --enable-discussions \
  --enable-issues \
  --delete-branch-on-merge \
  --homepage "https://$OWNER.github.io/$REPO/" \
  --add-topic regeneration \
  --add-topic axolotl \
  --add-topic computational-biology \
  --add-topic agent-based-model \
  --add-topic typescript

label() { gh label create "$1" --repo "$FULL" --color "$2" --description "$3" --force; }
label "module:trigger"         "1d76db" "Wound, nerve signal, blastema formation"
label "module:progenitor-pool" "0e8a16" "Progenitor division and lineages"
label "module:pattern"         "5319e7" "Positional identity and patterning"
label "module:termination"     "b60205" "Stopping outgrowth"
label "hypothesis"             "fbca04" "An in-silico question to test"
label "literature"             "c5def5" "Add or verify a source"
label "benchmark-change"       "d93f0b" "Changes what the model claims about biology"
label "constitution"           "000000" "Amendment to CONSTITUTION.md"
label "good first issue"       "7057ff" "Good for newcomers"

gh api --method POST "repos/$FULL/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api --method PUT "repos/$FULL/pages" -f build_type=workflow >/dev/null

gh api --method PUT "repos/$FULL/branches/main/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null
}
JSON

echo "Done: https://github.com/$FULL"
echo "Note: with you as the only reviewer, merge your own PRs as an admin (enforce_admins is off)."
