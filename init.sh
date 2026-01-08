#!/bin/bash
# SolarQuote UK - Build, Test, and Validation Script
# Run this at the start of each Ralph loop iteration

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔆 SolarQuote UK - Initialisation Script"
echo "═══════════════════════════════════════════════════════════════════"

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
echo -e "\n${YELLOW}Checking npm...${NC}"
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm v${NPM_VERSION}${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}Installing dependencies...${NC}"
    npm install
else
    echo -e "\n${GREEN}✅ Dependencies already installed${NC}"
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo -e "\n${YELLOW}Creating .env.local from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local${NC}"
    else
        echo -e "${RED}⚠️  No .env.example found${NC}"
    fi
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# TypeScript check
echo -e "\n${YELLOW}Running TypeScript check...${NC}"
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript compiles without errors${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    npx tsc --noEmit
    exit 1
fi

# ESLint check
echo -e "\n${YELLOW}Running ESLint...${NC}"
if npm run lint --silent 2>/dev/null; then
    echo -e "${GREEN}✅ ESLint passed${NC}"
else
    echo -e "${YELLOW}⚠️  ESLint issues found (non-fatal)${NC}"
fi

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
if npm run test --silent 2>/dev/null; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed or no tests found${NC}"
fi

# Check feature progress
echo -e "\n${YELLOW}Feature Progress:${NC}"
if [ -f "feature_list.json" ]; then
    TOTAL=$(cat feature_list.json | jq '.features | length')
    PASSED=$(cat feature_list.json | jq '.features | map(select(.passes == true)) | length')
    BLOCKED=$(cat feature_list.json | jq '.features | map(select(.blocked == true)) | length')
    REMAINING=$((TOTAL - PASSED))
    
    echo -e "  Total features:    ${TOTAL}"
    echo -e "  ${GREEN}Completed:         ${PASSED}${NC}"
    echo -e "  ${YELLOW}Remaining:         ${REMAINING}${NC}"
    if [ "$BLOCKED" -gt 0 ]; then
        echo -e "  ${RED}Blocked:           ${BLOCKED}${NC}"
    fi
    
    # Show next feature
    NEXT=$(cat feature_list.json | jq -r '.features | map(select(.passes == false and .blocked == false)) | .[0].id // "NONE"')
    if [ "$NEXT" != "NONE" ]; then
        echo -e "\n  ${YELLOW}Next feature:${NC} ${NEXT}"
    else
        echo -e "\n  ${GREEN}All features complete!${NC}"
    fi
else
    echo -e "${RED}❌ feature_list.json not found${NC}"
fi

# Kill any existing dev server
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "\n${YELLOW}Stopping existing dev server on port 3000...${NC}"
    kill $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 1
fi

# Start dev server
echo -e "\n${YELLOW}Starting development server...${NC}"
npm run dev &
DEV_PID=$!
echo $DEV_PID > .dev-server.pid

# Wait for server
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Dev server ready at http://localhost:3000${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start${NC}"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ Initialisation complete${NC}"
echo "  📍 Server: http://localhost:3000"
echo "  📊 Dev PID: $DEV_PID"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Ready for Ralph loop iteration. Run:"
echo "  cat feature_list.json | jq '.features | map(select(.passes == false)) | .[0]'"
echo ""
