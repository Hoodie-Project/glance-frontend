#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/code"

log() {
  printf '\n[deploy] %s\n' "$1"
}

fail() {
  printf '\n[deploy] %s\n' "$1" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "required command not found: $1"
  fi
}

require_command git
require_command npm
require_command pm2
require_command lsof

[[ -d "$APP_DIR" ]] || fail "app directory not found: $APP_DIR"
[[ -f "$APP_DIR/package.json" ]] || fail "package.json not found in: $APP_DIR"

CURRENT_BRANCH="$(git -C "$ROOT_DIR" branch --show-current)"

case "$CURRENT_BRANCH" in
  main)
    PORT="3000"
    PROCESS_NAME="glance-front-main"
    ;;
  dev)
    PORT="3001"
    PROCESS_NAME="glance-front-dev"
    ;;
  *)
    fail "current branch is \"$CURRENT_BRANCH\". deploy is allowed only on \"main\" or \"dev\"."
    ;;
esac

log "branch: $CURRENT_BRANCH"
log "port: $PORT"
log "process: $PROCESS_NAME"

log "fetch latest code"
git -C "$ROOT_DIR" fetch origin "$CURRENT_BRANCH"

log "pull latest code with fast-forward only"
git -C "$ROOT_DIR" pull --ff-only origin "$CURRENT_BRANCH"

log "install dependencies"
npm --prefix "$APP_DIR" install

log "remove previous build output"
rm -rf "$APP_DIR/.next"

log "build next app"
npm --prefix "$APP_DIR" run build

if pm2 describe "$PROCESS_NAME" >/dev/null 2>&1; then
  log "delete existing pm2 process"
  pm2 delete "$PROCESS_NAME"
fi

EXISTING_PIDS="$(lsof -ti tcp:"$PORT" || true)"
if [[ -n "$EXISTING_PIDS" ]]; then
  log "kill process using port $PORT"
  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    kill -9 "$pid"
  done <<< "$EXISTING_PIDS"
fi

log "start next server on port $PORT with pm2"
pm2 start "$APP_DIR/node_modules/next/dist/bin/next" \
  --name "$PROCESS_NAME" \
  --cwd "$APP_DIR" \
  --interpreter node \
  -- start --port "$PORT"

log "save pm2 process list"
pm2 save

log "deploy completed"
