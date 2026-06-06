#!/bin/sh

export GIT_URL="$GITHUB_REPOSITORY_URL"

mkdir -p /home/app/output

cd /home/app/output

git clone "$GIT_URL"

echo "Repository cloned successfully"

exec node /home/app/script.js