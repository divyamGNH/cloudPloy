#!/bin/sh

export GIT_URL="$GITHUB_REPOSITORY_URL"

PROJECT_DIR="/home/app/output/${PROJECT_ID}-${DEPLOYMENT_ID}"

mkdir -p "$PROJECT_DIR"

git clone "$GIT_URL" "$PROJECT_DIR"

echo "Repository cloned successfully"

exec node /home/app/dist/script.js