#!/bin/bash
# tests/run-websocket-tests.sh

echo "=== Running WebSocket Tests ==="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${RED}Backend is not running. Please start it first:${NC}"
    echo "cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo "Checking if frontend is running..."
if ! curl -s http://localhost:8080 > /dev/null; then
    echo -e "${RED}Frontend is not running. Please start it first:${NC}"
    echo "cd frontend && npx http-server -p 8080"
    exit 1
fi

echo -e "${GREEN}Services are running. Starting tests...${NC}"

# 1. Run unit tests
echo ""
echo "1. Running WebSocket unit tests..."

# Fixed directory navigation with proper path handling
BACKEND_DIR=""
if [ -d "../backend" ]; then
    BACKEND_DIR="../backend"
elif [ -d "backend" ]; then
    BACKEND_DIR="backend"
else
    echo "⚠️  Backend directory not found, skipping backend tests"
    UNIT_RESULT=1
fi

if [ -n "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    npm test -- src/services/__tests__/websocketService.test.js
    UNIT_RESULT=$?
    cd "$ORIGINAL_DIR"
fi

# 2. Run integration tests
echo ""
echo "2. Running WebSocket integration tests..."
# Ensure we're in the tests directory
if [ "$(basename "$ORIGINAL_DIR")" != "tests" ]; then
    cd tests
fi
npm test -- integration/websocket-integration.test.js
INTEGRATION_RESULT=$?

# 3. Run Cypress E2E tests
echo ""
echo "3. Running Cypress WebSocket tests..."
npm run cypress:run -- --spec "cypress/e2e/websocket.cy.js"
CYPRESS_RESULT=$?

# 4. Run performance tests (smoke test only)
echo ""
echo "4. Running WebSocket performance test (smoke)..."
node performance/websocket-load-test.js smoke
PERF_RESULT=$?

# Summary
echo ""
echo "=== Test Results Summary ==="
if [ $UNIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo -e "${RED}✗ Integration tests failed${NC}"
fi

if [ $CYPRESS_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
else
    echo -e "${RED}✗ E2E tests failed${NC}"
fi

if [ $PERF_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Performance tests passed${NC}"
else
    echo -e "${RED}✗ Performance tests failed${NC}"
fi

# Generate report
echo ""
echo "Generating test report..."
node -e "
const fs = require('fs');
const report = {
  timestamp: new Date().toISOString(),
  results: {
    unit: ${UNIT_RESULT} === 0,
    integration: ${INTEGRATION_RESULT} === 0,
    e2e: ${CYPRESS_RESULT} === 0,
    performance: ${PERF_RESULT} === 0
  }
};
fs.writeFileSync('reports/websocket-test-summary.json', JSON.stringify(report, null, 2));
console.log('Report saved to reports/websocket-test-summary.json');
"

# Open monitoring dashboard
echo ""
echo "Opening monitoring dashboard..."
open tests/monitoring/websocket-dashboard.html

echo ""
echo "=== WebSocket Testing Complete ==="
