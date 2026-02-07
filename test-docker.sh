#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "🐳 Sortr Docker Setup Test"
echo "======================================"
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

# Function to wait for service
wait_for_service() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=0

    echo -n "Waiting for $service to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}✗ Timeout${NC}"
    return 1
}

echo "1. Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_command docker
check_command docker-compose
check_command curl
echo ""

echo "2. Checking Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please configure SECRET_KEY in .env${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env file exists${NC}"

if ! grep -q "^SECRET_KEY=" .env || grep -q "SECRET_KEY=your-secret-key-here" .env; then
    echo -e "${YELLOW}⚠ SECRET_KEY not configured${NC}"
    echo "  Generating SECRET_KEY..."
    SECRET=$(openssl rand -base64 32)
    if grep -q "^SECRET_KEY=" .env; then
        # Update existing SECRET_KEY
        sed -i.bak "s/^SECRET_KEY=.*/SECRET_KEY=$SECRET/" .env
    else
        # Add SECRET_KEY
        echo "SECRET_KEY=$SECRET" >> .env
    fi
    echo -e "${GREEN}✓ SECRET_KEY generated${NC}"
fi
echo ""

echo "3. Building Docker Images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building images (this may take a few minutes)..."
if docker-compose build --no-cache > /tmp/docker-build.log 2>&1; then
    echo -e "${GREEN}✓ Images built successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Check /tmp/docker-build.log for details"
    tail -20 /tmp/docker-build.log
    exit 1
fi
echo ""

echo "4. Starting Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting docker-compose..."
if docker-compose up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi
echo ""

echo "5. Testing Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for backend
if wait_for_service "http://localhost:8000/health" "Backend"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    
    # Show health response
    echo "  Response:"
    curl -s http://localhost:8000/health | head -3
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    docker-compose logs backend | tail -20
fi

# Wait for frontend
if wait_for_service "http://localhost/" "Frontend"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    docker-compose logs frontend | tail -20
fi
echo ""

echo "6. Running Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose exec -T backend npx sequelize-cli db:migrate:status; then
    echo -e "${GREEN}✓ Migrations checked${NC}"
else
    echo -e "${YELLOW}⚠ Running migrations...${NC}"
    docker-compose exec -T backend npx sequelize-cli db:migrate
fi
echo ""

echo "7. Testing API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test health endpoint
echo -n "Testing /health... "
if curl -s -f http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test 404 handling
echo -n "Testing 404 handling... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/nonexistent)
if [ "$RESPONSE" = "404" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (got $RESPONSE)${NC}"
fi

# Test auth required
echo -n "Testing auth required... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/items)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (got $RESPONSE)${NC}"
fi
echo ""

echo "8. Checking Container Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo ""

echo "9. Checking Logs (last 10 lines)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Backend:${NC}"
docker-compose logs --tail=10 backend
echo ""
echo -e "${BLUE}Frontend:${NC}"
docker-compose logs --tail=10 frontend
echo ""

echo "======================================"
echo "✨ Docker Setup Test Complete!"
echo "======================================"
echo ""
echo "Access your application at:"
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:8000"
echo "  Health:    http://localhost:8000/health"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose ps               # View status"
echo "  docker-compose down             # Stop services"
echo "  docker-compose down -v          # Stop and remove volumes"
echo ""
echo "Press any key to stop services, or Ctrl+C to keep running..."
read -n 1 -s

echo ""
echo "Stopping services..."
docker-compose down
echo -e "${GREEN}✓ Services stopped${NC}"
