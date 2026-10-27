#!/usr/bin/env bash
# Every deploy is a release. Rules and steps for all Arrow apps: ../pi-ops/docs/deploy-conventions.md
#
#   scripts/deploy.sh          # 0.1.4 -> release 0.1.5 (commit "Release 0.1.5", tag v0.1.5)
#   scripts/deploy.sh minor    # patch | minor | major | <version>; minor/major only on request
#
# Bumps the version with npm version, builds for /missioncontrol/ from that commit and hands the build to
# pi-ops. Never pushes.
set -euo pipefail

cd "$(dirname "$0")/.."
PI_OPS_PATH="${PI_OPS_PATH:-../pi-ops}"
bump="${1:-patch}"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Uncommitted changes: commit them first, a release must match a commit." >&2
  exit 1
fi

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use > /dev/null
fi

npm ci
next="$(npm version "$bump" -m "Release %s")"
npm run build:pi

MISSIONCONTROL_LOCAL_PATH="$PWD" "$PI_OPS_PATH/scripts/deploy-missioncontrol.sh"

echo "Deployed missioncontrol ${next#v} ($(git rev-parse --short "$next"))"
