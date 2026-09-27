#!/usr/bin/env bash
# Push this project to GitHub.
#
#   bash push-to-github.sh
#
# The commit already exists. This only re-adds the remote (git config is not
# carried in the download) and pushes. GitHub will ask for your username and
# a Personal Access Token — not your account password, which GitHub stopped
# accepting in 2021.
set -e
cd "$(dirname "$0")"

REPO="https://github.com/ranjithkumr05-bit/Custom-arena.git"

[ -d .git ] || { echo "No git history here. Are you in the right folder?"; exit 1; }

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO"
git branch -M main

echo
echo "Pushing to $REPO"
echo "Username: your GitHub username"
echo "Password: paste a Personal Access Token (repo scope)"
echo "          Settings > Developer settings > Personal access tokens > Tokens (classic)"
echo
git push -u origin main
echo
echo "Done. https://github.com/ranjithkumr05-bit/Custom-arena"
