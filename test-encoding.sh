#!/bin/bash

# Portuguese Character Encoding Test Script
# Run this after deployment to test the encoding fix

echo "🔧 Testing Portuguese Character Encoding Fix"
echo "============================================="

# Replace with your actual Render backend URL
BACKEND_URL="https://your-backend.onrender.com"

echo ""
echo "1. Testing UTF-8 endpoint..."
curl -s "$BACKEND_URL/api/test/test" | jq -r '.portugueseChars.words[]' 2>/dev/null || echo "❌ UTF-8 test failed or jq not installed"

echo ""
echo "2. Checking for database corruption..."
curl -s "$BACKEND_URL/api/test/check-corruption" | jq '.totalCorrupted' 2>/dev/null || echo "❌ Corruption check failed"

echo ""
echo "3. Triggering manual encoding fix..."
curl -X POST -s "$BACKEND_URL/api/test/fix-encoding" | jq '.recordsFixed' 2>/dev/null || echo "❌ Manual fix failed"

echo ""
echo "4. Checking user data for Portuguese characters..."
# Note: This requires authentication - adjust as needed for your API
curl -s "$BACKEND_URL/api/admin/users" | head -c 500 | grep -o 'ç\|ã\|õ\|á\|é\|í\|ó\|ú' | head -5 || echo "❌ No Portuguese characters found or auth required"

echo ""
echo "✅ Test completed! Check the output above for results."
echo "🔍 Look for Portuguese characters (ç, ã, õ, etc.) instead of ?? symbols"
