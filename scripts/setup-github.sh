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
  if [ "$(gh config get git_protocol)" = "ssh" ]; then
    git remote add origin "git@github.com:$FULL.git"
  else
    git remote add origin "https://github.com/$FULL.git"
  fi
fi
git push -u origin main

gh repo edit "$FULL" \
  --enable-discussions \
  --enable-issues \
  --delete-branch-on-merge \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --enable-wiki=false \
  --homepage "https://$OWNER.github.io/$REPO/" \
  --add-topic regeneration \
  --add-topic axolotl \
  --add-topic computational-biology \
  --add-topic agent-based-model \
  --add-topic typescript \
  --add-topic open-science \
  --add-topic in-silico

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

gh api --method PUT "repos/$FULL/vulnerability-alerts" >/dev/null
gh api --method PUT "repos/$FULL/automated-security-fixes" >/dev/null
gh api --method PUT "repos/$FULL/private-vulnerability-reporting" >/dev/null
gh api --method PATCH "repos/$FULL" --input - >/dev/null <<JSON
{
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
JSON
gh api --method PATCH "repos/$FULL/code-scanning/default-setup" \
  -f state=configured -f query_suite=default >/dev/null

gh api --method PUT "repos/$FULL/branches/main/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

gh workflow run pages.yml --repo "$FULL" --ref main

echo "Done: https://github.com/$FULL"
echo "Note: with you as the only reviewer, merge your own PRs as an admin (enforce_admins is off)."
