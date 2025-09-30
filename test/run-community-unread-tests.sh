#!/bin/bash

# Community Unread Messages E2E Test Runner
# This script runs the integration tests for the community unread messages feature

set -e  # Exit on error

echo "🚀 Community Unread Messages E2E Tests"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "❌ Error: node_modules not found. Run 'npm install' first."
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found. Using default environment variables."
fi

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  Warning: DATABASE_URL not set. Using default from .env or config."
fi

if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  Warning: JWT_SECRET not set. Using default from .env or config."
fi

echo ""
echo "🔧 Configuration:"
echo "  - Test File: test/community-unread.e2e-spec.ts"
echo "  - Test Framework: Jest + @nestjs/testing"
echo "  - Database: PostgreSQL (via Prisma)"
echo ""

# Parse command line arguments
WATCH_MODE=false
VERBOSE=false
COVERAGE=false
TEST_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --watch)
      WATCH_MODE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --test)
      TEST_NAME="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./run-community-unread-tests.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --watch       Run tests in watch mode"
      echo "  --verbose     Show detailed output"
      echo "  --coverage    Generate coverage report"
      echo "  --test NAME   Run specific test matching NAME"
      echo "  --help        Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./run-community-unread-tests.sh"
      echo "  ./run-community-unread-tests.sh --watch"
      echo "  ./run-community-unread-tests.sh --coverage"
      echo "  ./run-community-unread-tests.sh --test 'REST API'"
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Build command
CMD="npm run test:e2e -- community-unread.e2e-spec.ts"

if [ "$WATCH_MODE" = true ]; then
  CMD="$CMD --watch"
  echo "📺 Running in watch mode..."
fi

if [ "$VERBOSE" = true ]; then
  CMD="$CMD --verbose"
  echo "🔍 Verbose mode enabled..."
fi

if [ "$COVERAGE" = true ]; then
  CMD="$CMD --coverage"
  echo "📊 Coverage report will be generated..."
fi

if [ -n "$TEST_NAME" ]; then
  CMD="$CMD -t '$TEST_NAME'"
  echo "🎯 Running specific test: $TEST_NAME"
fi

echo ""
echo "▶️  Running tests..."
echo "   Command: $CMD"
echo ""

# Run the tests
eval $CMD

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All tests passed!"
  echo ""
  
  if [ "$COVERAGE" = true ]; then
    echo "📊 Coverage report available at: coverage/lcov-report/index.html"
    echo ""
  fi
else
  echo ""
  echo "❌ Some tests failed. Check the output above for details."
  echo ""
  exit 1
fi

