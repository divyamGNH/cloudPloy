#!/bin/sh

export GIT_URL="$GITHUB_REPOSITORY_URL"
git clone "$GIT_URL"/home/app/output
exec node script.js