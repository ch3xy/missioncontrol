#!/usr/bin/env bash
# Every deploy is a release. Rules and steps for all Arrow apps: ../pi-ops/docs/deploy-conventions.md
#
#   scripts/deploy.sh          # 0.1.6-SNAPSHOT -> release 0.1.6 (commit "Release 0.1.6", tag v0.1.6)
#   scripts/deploy.sh 0.2.0    # explicit version; minor/major only on request
#
# The version lives in backend/pom.xml only. pi-ops/scripts/release-maven.sh releases it, builds the backend
# jar and the frontend (npm run build:pi) from the release commit, moves the pom to the next snapshot, deploys
# the backend as container missioncontrol-api and then the static frontend. Never pushes.
set -euo pipefail

cd "$(dirname "$0")/.."
PI_OPS_PATH="$(cd "${PI_OPS_PATH:-../pi-ops}" && pwd)"

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use > /dev/null
fi

# Before the release commit, so a failed install leaves no release behind
npm ci

export MAVEN_DIR=backend
export APP_JAR=missioncontrol.jar
export RELEASE_BUILD_CMD="npm run build:pi"
export RELEASE_DEPLOY_CMD="MISSIONCONTROL_LOCAL_PATH=\"\$PWD\" \"$PI_OPS_PATH/scripts/deploy-missioncontrol.sh\""

exec "$PI_OPS_PATH/scripts/release-maven.sh" missioncontrol-api "$@"
