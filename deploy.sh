#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
#  VMS Auto-Deploy Script
#  Deploys:  Backend + MySQL → Railway   |   Frontend → Vercel
#  Run this once after waking up:  bash ~/Desktop/DBMS/deploy.sh
# ════════════════════════════════════════════════════════════════════════════
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[VMS]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"
FRONTEND="$SCRIPT_DIR/frontend"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   VMS Deployment — Railway + Vercel  ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Install CLIs ─────────────────────────────────────────────────────
log "Checking Railway CLI..."
if ! command -v railway &>/dev/null; then
  log "Installing Railway CLI..."
  npm install -g @railway/cli || err "Failed to install Railway CLI"
fi
ok "Railway CLI ready"

log "Checking Vercel CLI..."
if ! command -v vercel &>/dev/null; then
  log "Installing Vercel CLI..."
  npm install -g vercel || err "Failed to install Vercel CLI"
fi
ok "Vercel CLI ready"

# ── Step 2: Railway (Backend + MySQL) ────────────────────────────────────────
echo ""
log "━━━ STEP 1: Deploy Backend to Railway ━━━"
echo ""
warn "You'll need to log in to Railway. A browser window will open."
echo ""

cd "$BACKEND"

# Login — skip if RAILWAY_TOKEN is already set
if [ -n "$RAILWAY_TOKEN" ]; then
  ok "Using RAILWAY_TOKEN (skipping browser login)"
else
  railway login || err "Railway login failed"
fi

# Init project (creates a new project if none exists)
if [ ! -f ".railway/config.json" ]; then
  log "Creating Railway project..."
  railway init --name "vms-backend"
fi

# Provision MySQL database
log "Adding MySQL database to Railway project..."
railway add --plugin mysql 2>/dev/null || warn "MySQL plugin may already exist — skipping"

# Deploy backend
log "Deploying backend..."
railway up --detach

# Get the backend URL
BACKEND_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [ -z "$BACKEND_URL" ]; then
  echo ""
  warn "Couldn't auto-detect backend URL."
  echo -e "${YELLOW}→ Open https://railway.app/dashboard${NC}"
  echo -e "${YELLOW}→ Go to your project → Deployments → copy the URL${NC}"
  echo ""
  read -p "  Paste your Railway backend URL (e.g. https://vms-backend-xxx.up.railway.app): " BACKEND_URL
fi

ok "Backend deployed → $BACKEND_URL"

# ── Step 3: Vercel (Frontend) ─────────────────────────────────────────────────
echo ""
log "━━━ STEP 2: Deploy Frontend to Vercel ━━━"
echo ""

cd "$FRONTEND"

# Create .env.production with the backend URL
echo "VITE_API_URL=$BACKEND_URL" > .env.production
ok "Set VITE_API_URL=$BACKEND_URL"

# Login and deploy
vercel login || err "Vercel login failed"
log "Deploying frontend to Vercel..."
vercel --prod --yes

FRONTEND_URL=$(vercel ls 2>/dev/null | grep -v "^$\|Error\|Retrieving" | head -2 | tail -1 | awk '{print $2}' || echo "")
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              🎉 Deployment Complete!              ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  🔧 Backend  : ${CYAN}$BACKEND_URL${NC}"
echo -e "${BOLD}║${NC}  🌐 Frontend : ${GREEN}https://$FRONTEND_URL${NC}"
echo -e "${BOLD}║${NC}                                                  "
echo -e "${BOLD}║${NC}  📋 To seed the DB, run in Railway shell:        "
echo -e "${BOLD}║${NC}     railway run mysql < database/schema_expanded.sql  "
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
