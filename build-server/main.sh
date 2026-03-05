#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"
# export GIT_REPOSITORY_URL="https://github.com/divyamGNH/DivyamPF"

# Dockerfile has the workdir setup as home/app
git clone "$GIT_REPOSITORY_URL" /home/app/output

exec node script.js