#!/bin/bash

# Debug script to diagnose connection issues between frontend and backend

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "🔍 Sortr Connection Debugger"
echo "========================================"
echo ""

echo "1. Checking Backend Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if backend is listening on port 8000
echo -n "Backend listening on port 8000? "
if lsof -i :8000 -sTCP:LISTEN >/dev/null 2>&1 || netstat -an | grep -q ":8000.*LISTEN" 2>/dev/null; then
    echo -e "${GREEN}✓ Yes${NC}"
else
    echo -e "${RED}✗ No${NC}"
    echo -e "${YELLOW}Backend is not running!${NC}"
    echo "Start it with: docker-compose up -d backend"
    echo "Or manually: cd backend && node server.js"
    exit 1
fi

# Test backend health endpoint
echo -n "Backend health check... "
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/health 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo "2. Checking Frontend Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .env configuration
echo "Environment variables:"
if [ -f .env ]; then
    echo -e "${BLUE}FRONTEND_URL:${NC} $(grep "^FRONTEND_URL=" .env | cut -d'=' -f2-)"
    echo -e "${BLUE}VITE_API_URL:${NC}  $(grep "^VITE_API_URL=" .env | cut -d'=' -f2-)"
else
    echo -e "${RED}✗ .env file not found${NC}"
fi
echo ""

echo "3. Testing API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test registration endpoint with localhost
echo -n "Test /api/register (localhost:8000)... "
REG_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/register \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>/dev/null)
if [ "$REG_RESPONSE" = "400" ] || [ "$REG_RESPONSE" = "201" ]; then
    echo -e "${GREEN}✓ Reachable (HTTP $REG_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $REG_RESPONSE)${NC}"
fi

# Test registration endpoint with hostname
HOSTNAME=$(grep "^VITE_API_URL=" .env 2>/dev/null | cut -d'=' -f2- | sed 's|http://||' | sed 's|:.*||')
if [ -n "$HOSTNAME" ] && [ "$HOSTNAME" != "localhost" ]; then
    echo -n "Test /api/register ($HOSTNAME:8000)... "
    REG_RESPONSE2=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://$HOSTNAME:8000/api/register \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' 2>/dev/null)
    if [ "$REG_RESPONSE2" = "400" ] || [ "$REG_RESPONSE2" = "201" ]; then
        echo -e "${GREEN}✓ Reachable (HTTP $REG_RESPONSE2)${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $REG_RESPONSE2)${NC}"
    fi
fi
echo ""

echo "4. CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FRONTEND_URL=$(grep "^FRONTEND_URL=" .env 2>/dev/null | cut -d'=' -f2-)
echo "Backend will accept requests from: ${BLUE}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}⚠ Make sure you access the frontend at exactly this URL!${NC}"
echo "  If you access from a different URL, requests will be blocked by CORS."
echo ""

echo "5. Common Issues & Solutions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${BLUE}Issue 1:${NC} Backend not running"
echo "  Solution: docker-compose up -d backend"
echo ""

echo -e "${BLUE}Issue 2:${NC} Frontend not rebuilt after .env change"
echo "  Solution: docker-compose build frontend && docker-compose up -d"
echo "  Or: cd frontend && npm run build"
echo ""

echo -e "${BLUE}Issue 3:${NC} Accessing frontend from wrong URL"
echo "  Configured: $FRONTEND_URL"
echo "  You must access frontend from exactly this URL"
echo ""

echo -e "${BLUE}Issue 4:${NC} Port 8000 blocked by firewall"
echo "  Solution: sudo ufw allow 8000/tcp"
echo "  Or: sudo firewall-cmd --add-port=8000/tcp --permanent"
echo ""

echo "6. Browser Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Open browser developer console (F12) and check:"
echo ""
echo "1. What URL is the page loaded from?"
echo "   Should be: $FRONTEND_URL"
echo ""
echo "2. What API URL is being used?"
echo "   In console, type: localStorage.getItem('apiUrl')"
echo "   Or check Network tab for failed requests"
echo ""
echo "3. Check for CORS errors in console:"
echo "   Look for: 'Access-Control-Allow-Origin' errors"
echo ""

echo "========================================"
echo "🔧 Quick Fix Commands"
echo "========================================"
echo ""
echo "If using Docker:"
echo "  docker-compose down"
echo "  docker-compose build"
echo "  docker-compose up -d"
echo "  docker-compose logs -f"
echo ""
echo "If manual:"
echo "  # Terminal 1 - Backend"
echo "  cd backend && node server.js"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd frontend && npm run build"
echo "  npx serve -s dist -l 8080"
echo ""
