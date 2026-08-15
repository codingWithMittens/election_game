#!/bin/bash

# Electoral Strategy - Complete Project Setup Script
# This script creates ALL necessary files for the complete starter codebase

set -e

echo "🎮 Setting up Electoral Strategy Web Game..."
echo ""

BASE_DIR="$HOME/Workspace/election_game"
cd "$BASE_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📁 Creating project structure...${NC}"

# Create all necessary directories
mkdir -p backend/src/{db,routes,socket,lib,types,data}
mkdir -p frontend/src/{pages,components/{game,cards,ui},lib,hooks,types,data,styles}

echo -e "${GREEN}✓ Directories created${NC}"

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install --silent 2>/dev/null || echo "Run 'cd backend && npm install' manually"
cd ..

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install --silent 2>/dev/null || echo "Run 'cd frontend && npm install' manually"
cd ..

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "📚 Next steps:"
echo "1. Copy .env.example to .env in both backend and frontend"
echo "2. Update DATABASE_URL in backend/.env"
echo "3. Run: cd backend && npm run db:setup"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "📖 Read README.md for detailed instructions"
