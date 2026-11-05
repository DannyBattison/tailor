#!/bin/sh
# usage: scripts/commit.sh "message"
git add -A && git commit -q -m "$1" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -m "Co-authored-by: helm session goal-build-an-mvp <noreply@helm.app>" && git log --oneline | head -1
