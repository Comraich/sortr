#!/bin/bash

set -e

echo "================================"
echo "  Sortr Installation Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for Node.js
echo "Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js 18+ is recommended. You have $(node -v)${NC}"
fi

echo -e "${GREEN}Node.js $(node -v) found${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}npm $(npm -v) found${NC}"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install
echo -e "${GREEN}Backend dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install
echo -e "${GREEN}Frontend dependencies installed${NC}"
echo ""

# Setup .env file
cd "$SCRIPT_DIR"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env

        # Generate a random SECRET_KEY
        SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

        # Replace placeholder SECRET_KEY (works on both macOS and Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|your-secret-key-here|$SECRET_KEY|g" .env
        else
            sed -i "s|your-secret-key-here|$SECRET_KEY|g" .env
        fi

        echo -e "${GREEN}.env file created with generated SECRET_KEY${NC}"
        echo -e "${YELLOW}Please edit .env to configure OAuth providers (optional)${NC}"
    else
        echo -e "${YELLOW}Warning: No .env.example found. Please create .env manually.${NC}"
    fi
else
    echo -e "${GREEN}.env file already exists${NC}"
fi
echo ""

# Build frontend for production (optional)
read -p "Build frontend for production? (y/N): " BUILD_PROD
if [[ "$BUILD_PROD" =~ ^[Yy]$ ]]; then
    echo "Building frontend..."
    cd "$SCRIPT_DIR/frontend"
    npm run build
    echo -e "${GREEN}Frontend built successfully${NC}"
fi
echo ""

echo "================================"
echo -e "${GREEN}  Installation Complete!${NC}"
echo "================================"
echo ""
echo "To start Sortr, run:"
echo "  ./start.sh"
echo ""
echo "Or start manually:"
echo "  Backend:  cd backend && node server.js"
echo "  Frontend: cd frontend && npm run dev"
echo ""
