#!/usr/bin/env bash
# Local development setup script.
# Run once after cloning this repo, or up to you bro.
#
# Usage: ./scripts/init-dev.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEV_DIR="$ROOT_DIR/dev/directus"

echo "==> Creating directories"
mkdir -p "$DEV_DIR/database" "$DEV_DIR/uploads"

echo "==> Setting up dev/directus/.env"

if [ ! -f "$DEV_DIR/.env" ]; then
  cp "$DEV_DIR/.env.example" "$DEV_DIR/.env"
  # Generate a random SECRET instead of leaving the placeholder value.
  SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
  sed -i.bak "s|^SECRET=.*|SECRET=$SECRET|" "$DEV_DIR/.env" && rm -f "$DEV_DIR/.env.bak"
  echo "    Created dev/directus/.env from dev/directus/.env.example (edit ADMIN_EMAIL / ADMIN_PASSWORD as needed)"
else
  echo "    dev/directus/.env already exists, skipping"
fi

echo "==> Setting up dev/strapi/.env"
STRAPI_DIR="$ROOT_DIR/dev/strapi"
mkdir -p "$STRAPI_DIR/database" "$STRAPI_DIR/public/uploads"

if [ ! -f "$STRAPI_DIR/.env" ]; then
  cp "$STRAPI_DIR/.env.example" "$STRAPI_DIR/.env"
  rand() { openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64; }
  APP_KEYS="$(rand),$(rand),$(rand),$(rand)"
  sed -i.bak \
    -e "s|^APP_KEYS=.*|APP_KEYS=\"$APP_KEYS\"|" \
    -e "s|^API_TOKEN_SALT=.*|API_TOKEN_SALT=$(rand)|" \
    -e "s|^ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=$(rand)|" \
    -e "s|^TRANSFER_TOKEN_SALT=.*|TRANSFER_TOKEN_SALT=$(rand)|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=$(rand)|" \
    -e "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(rand)|" \
    "$STRAPI_DIR/.env" && rm -f "$STRAPI_DIR/.env.bak"
  echo "    Created dev/strapi/.env from dev/strapi/.env.example with generated secrets"
else
  echo "    dev/strapi/.env already exists, skipping"
fi

echo "==> Installing workspace dependencies"

if command -v pnpm >/dev/null 2>&1; then
  (cd "$ROOT_DIR" && pnpm i)
elif command -v corepack >/dev/null 2>&1; then
  (cd "$ROOT_DIR" && corepack pnpm i)
else
  echo "    pnpm not found — install pnpm (see packageManager in package.json) then run 'pnpm i' manually."
fi

echo "==> Setting up pre-commit hooks"
if command -v pre-commit >/dev/null 2>&1; then
    cd "$ROOT_DIR"
    pre-commit install --hook-type commit-msg
    echo "✓ pre-commit hooks installed"
else
    echo "⚠ pre-commit not found; skipping hook installation."
    echo "  Install it with your preferred package manager, then run:"
    echo "    pre-commit install --hook-type commit-msg"
fi

echo "==> Done. You can now run: pnpm docker:up:directus"
