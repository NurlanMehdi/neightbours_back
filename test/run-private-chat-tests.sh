#!/bin/bash

# Private Chat WebSocket Tests Runner
# 
# This script helps you run the Private Chat WebSocket tests easily.
# You can either:
# 1. Edit the tokens below directly
# 2. Set environment variables before running this script
# 3. Pass tokens as command line arguments

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🚀 Private Chat WebSocket Test Runner${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Default configuration (edit these if you want)
DEFAULT_SERVER_URL="http://localhost:3000"
DEFAULT_USER_A_ID="1"
DEFAULT_USER_B_ID="2"

# Use environment variables if set, otherwise use defaults
SERVER_URL="${WS_SERVER_URL:-$DEFAULT_SERVER_URL}"
USER_A_ID="${USER_A_ID:-$DEFAULT_USER_A_ID}"
USER_B_ID="${USER_B_ID:-$DEFAULT_USER_B_ID}"

# Check if tokens are provided
if [ -z "$JWT_TOKEN_USER_A" ] || [ -z "$JWT_TOKEN_USER_B" ]; then
  echo -e "${RED}❌ Error: JWT tokens not provided${NC}"
  echo ""
  echo -e "${YELLOW}Please provide JWT tokens using one of these methods:${NC}"
  echo ""
  echo "1. Set environment variables:"
  echo "   export JWT_TOKEN_USER_A=\"your-token-here\""
  echo "   export JWT_TOKEN_USER_B=\"your-token-here\""
  echo "   ./test/run-private-chat-tests.sh"
  echo ""
  echo "2. Pass as inline variables:"
  echo "   JWT_TOKEN_USER_A=\"token1\" JWT_TOKEN_USER_B=\"token2\" ./test/run-private-chat-tests.sh"
  echo ""
  echo "3. Edit this script and add tokens to the DEFAULT_ variables"
  echo ""
  echo -e "${YELLOW}How to get JWT tokens:${NC}"
  echo "1. Start the server: npm run start:dev"
  echo "2. Login via API: curl -X POST http://localhost:3000/auth/login \\"
  echo "   -H \"Content-Type: application/json\" \\"
  echo "   -d '{\"phone\":\"+1234567890\",\"password\":\"password\"}'"
  echo "3. Copy the 'accessToken' from the response"
  echo ""
  exit 1
fi

# Verify tokens are not placeholder values
if [ "$JWT_TOKEN_USER_A" == "your-jwt-token-user-a" ] || [ "$JWT_TOKEN_USER_B" == "your-jwt-token-user-b" ]; then
  echo -e "${RED}❌ Error: Please replace placeholder tokens with real JWT tokens${NC}"
  exit 1
fi

# Display configuration
echo -e "${GREEN}Configuration:${NC}"
echo "  Server URL:  $SERVER_URL"
echo "  User A ID:   $USER_A_ID"
echo "  User B ID:   $USER_B_ID"
echo "  Token A:     ${JWT_TOKEN_USER_A:0:20}... (${#JWT_TOKEN_USER_A} chars)"
echo "  Token B:     ${JWT_TOKEN_USER_B:0:20}... (${#JWT_TOKEN_USER_B} chars)"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "200\|404\|401"; then
  echo -e "${GREEN}✓ Server is responding${NC}"
else
  echo -e "${RED}❌ Server is not responding at $SERVER_URL${NC}"
  echo -e "${YELLOW}Please start the server: npm run start:dev${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}Running tests...${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Check if node_modules/socket.io-client exists
if [ ! -d "node_modules/socket.io-client" ]; then
  echo -e "${YELLOW}⚠️  socket.io-client not found, installing...${NC}"
  npm install socket.io-client
  echo ""
fi

# Run the tests
JWT_TOKEN_USER_A="$JWT_TOKEN_USER_A" \
JWT_TOKEN_USER_B="$JWT_TOKEN_USER_B" \
USER_A_ID="$USER_A_ID" \
USER_B_ID="$USER_B_ID" \
WS_SERVER_URL="$SERVER_URL" \
node test/private-chat-refactored-tests.js

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${RED}❌ Some tests failed. Exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE

