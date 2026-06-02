#!/bin/bash

# Test monicredit Bank APIs
# This script loads environment variables and runs the test

set -e

echo "Loading environment variables from .env..."

# Export environment variables from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
  echo "Error: .env file not found!"
  exit 1
fi

echo "Running monicredit API tests..."
npx tsx scripts/test-monicredit-banks.ts
