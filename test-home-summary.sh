#!/bin/bash

# Test script for /home/summary endpoint
# Usage: ./test-home-summary.sh <jwt_token>

TOKEN=$1

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-home-summary.sh <jwt_token>"
  echo ""
  echo "To get a token, login first:"
  echo "  curl -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{\"email\": \"your@email.com\", \"password\": \"yourpassword\"}'"
  exit 1
fi

echo "Calling GET /home/summary..."
echo ""

curl -s http://localhost:3000/home/summary \
  -H "Authorization: Bearer $TOKEN" | jq .
