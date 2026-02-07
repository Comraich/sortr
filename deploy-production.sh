#!/bin/bash

# Production Deployment Script for Sortr
# This script helps you deploy Sortr to production using Docker

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "🚀 Sortr Production Deployment"
echo "========================================"
echo ""

# Function to check command existence
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 not found${NC}"
        echo "  Please install $1 first"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 found${NC}"
}

echo "1. Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_command docker
check_command docker-compose
echo ""

echo "2. Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

# Check SECRET_KEY
if ! grep -q "^SECRET_KEY=" .env || grep -q "SECRET_KEY=your-secret-key-here" .env; then
    echo -e "${YELLOW}⚠ SECRET_KEY not configured${NC}"
    echo "  Generating SECRET_KEY..."
    SECRET=$(openssl rand -base64 32)
    if grep -q "^SECRET_KEY=" .env; then
        # Update existing SECRET_KEY
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^SECRET_KEY=.*/SECRET_KEY=$SECRET/" .env
        else
            sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$SECRET/" .env
        fi
    else
        # Add SECRET_KEY
        echo "SECRET_KEY=$SECRET" >> .env
    fi
    echo -e "${GREEN}✓ SECRET_KEY generated${NC}"
else
    echo -e "${GREEN}✓ SECRET_KEY configured${NC}"
fi

# Prompt for hostname
echo ""
echo -e "${BLUE}What is your server hostname?${NC}"
echo "  Examples: sortr, sortr.example.com, subdomain.yourdomain.com"
read -p "Hostname [sortr]: " HOSTNAME
HOSTNAME=${HOSTNAME:-sortr}

# Prompt for protocol
echo ""
echo -e "${BLUE}Are you using HTTPS?${NC}"
read -p "Use HTTPS? (y/N): " USE_HTTPS
if [[ $USE_HTTPS =~ ^[Yy]$ ]]; then
    PROTOCOL="https"
else
    PROTOCOL="http"
fi

# Update .env with hostname
echo ""
echo "Updating .env with hostname configuration..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=$PROTOCOL://$HOSTNAME|" .env
    sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=$PROTOCOL://$HOSTNAME:8000|" .env
else
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$PROTOCOL://$HOSTNAME|" .env
    sed -i "s|^VITE_API_URL=.*|VITE_API_URL=$PROTOCOL://$HOSTNAME:8000|" .env
fi
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo "3. Current Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Frontend URL: $PROTOCOL://$HOSTNAME"
echo "  Backend API:  $PROTOCOL://$HOSTNAME:8000"
echo "  Health Check: $PROTOCOL://$HOSTNAME:8000/health"
echo ""

# Ask for confirmation
echo -e "${YELLOW}Ready to deploy?${NC}"
read -p "Continue with deployment? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi
echo ""

echo "4. Stopping Existing Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose ps | grep -q "Up"; then
    echo "Stopping running services..."
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
else
    echo "No running services found."
fi
echo ""

echo "5. Building Docker Images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building images (this may take a few minutes)..."
if docker-compose build > /tmp/docker-build.log 2>&1; then
    echo -e "${GREEN}✓ Images built successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Check /tmp/docker-build.log for details"
    tail -20 /tmp/docker-build.log
    exit 1
fi
echo ""

echo "6. Starting Production Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting services in production mode..."
if docker-compose up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi
echo ""

echo "7. Waiting for Services to be Ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Waiting for backend to be ready..."
sleep 5

# Wait up to 60 seconds for backend
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker-compose exec -T backend node -e "console.log('ready')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "\n${RED}✗ Backend failed to start in time${NC}"
    echo "Showing logs:"
    docker-compose logs --tail=20 backend
    exit 1
fi
echo ""

echo "8. Running Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running migrations..."
if docker-compose exec -T backend npx sequelize-cli db:migrate; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Migrations may have issues${NC}"
    echo "Check manually with: docker-compose exec backend npx sequelize-cli db:migrate:status"
fi
echo ""

echo "9. Checking Service Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo ""

echo "========================================"
echo "✨ Deployment Complete!"
echo "========================================"
echo ""
echo "Your application is now running at:"
echo "  Frontend:  $PROTOCOL://$HOSTNAME"
echo "  Backend:   $PROTOCOL://$HOSTNAME:8000"
echo "  Health:    $PROTOCOL://$HOSTNAME:8000/health"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose ps               # View status"
echo "  docker-compose restart          # Restart services"
echo "  docker-compose down             # Stop services"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the health endpoint: curl $PROTOCOL://$HOSTNAME:8000/health"
echo "  2. Access the frontend in your browser: $PROTOCOL://$HOSTNAME"
echo "  3. Set up HTTPS if using HTTP (see PRODUCTION.md)"
echo "  4. Configure OAuth callbacks if using social login"
echo "  5. Set up automated backups (see PRODUCTION.md)"
echo ""
echo "For detailed production setup, see: PRODUCTION.md"
echo ""
