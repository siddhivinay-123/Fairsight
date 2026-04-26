#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ███████╗ █████╗ ██╗██████╗ ███████╗██╗ ██████╗ ██╗  ██╗████████╗"
echo "  ██╔════╝██╔══██╗██║██╔══██╗██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝"
echo "  █████╗  ███████║██║██████╔╝███████╗██║██║  ███╗███████║   ██║   "
echo "  ██╔══╝  ██╔══██║██║██╔══██╗╚════██║██║██║   ██║██╔══██║   ██║   "
echo "  ██║     ██║  ██║██║██║  ██║███████║██║╚██████╔╝██║  ██║   ██║   "
echo "  ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   "
echo -e "${NC}"
echo -e "  ${CYAN}Real-Time AI Bias Audit Engine${NC} · ${GREEN}v1.0.0${NC}"
echo ""

MODE=${1:-"dev"}

if [ "$MODE" = "docker" ]; then
    echo -e "${YELLOW}▶ Starting with Docker Compose...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found. Install Docker Desktop first.${NC}"; exit 1
    fi
    docker compose up --build
    exit 0
fi

# ── Dev mode ──────────────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Starting in Development Mode${NC}"
echo ""

# Backend
echo -e "${CYAN}[1/3] Setting up Python backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "  ${GREEN}✓ Virtual environment created${NC}"
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install -r requirements.txt -q
echo -e "  ${GREEN}✓ Dependencies installed${NC}"

uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend started (PID: $BACKEND_PID) → http://localhost:8000${NC}"
cd ..

sleep 2

# Frontend
echo -e "${CYAN}[2/3] Setting up React frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    npm install -q
    echo -e "  ${GREEN}✓ Node modules installed${NC}"
fi

npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started (PID: $FRONTEND_PID) → http://localhost:5173${NC}"
cd ..

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   FairSight is running!              ║${NC}"
echo -e "${GREEN}${BOLD}║                                      ║${NC}"
echo -e "${GREEN}${BOLD}║   Dashboard → http://localhost:5173  ║${NC}"
echo -e "${GREEN}${BOLD}║   API Docs  → http://localhost:8000  ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"
echo ""

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down FairSight...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done.${NC}"
    exit 0
}
trap cleanup INT TERM

wait
