# Portuguese Character Encoding Test Script (PowerShell)
# Run this after deployment to test the encoding fix

Write-Host "🔧 Testing Portuguese Character Encoding Fix" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Replace with your actual Render backend URL
$BACKEND_URL = "https://your-backend.onrender.com"

Write-Host ""
Write-Host "1. Testing UTF-8 endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/test/test" -Method Get
    Write-Host "   Portuguese words: $($response.portugueseChars.words -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "   ❌ UTF-8 test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Checking for database corruption..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/test/check-corruption" -Method Get
    Write-Host "   Total corrupted records: $($response.totalCorrupted)" -ForegroundColor Green
    if ($response.samplesFound.Count -gt 0) {
        Write-Host "   Samples found:" -ForegroundColor Yellow
        $response.samplesFound | ForEach-Object { 
            Write-Host "     - $($_.table).$($_.column): $($_.value)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Corruption check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Triggering manual encoding fix..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/test/fix-encoding" -Method Post
    Write-Host "   Records fixed: $($response.recordsFixed)" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Manual fix failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test completed! Check the output above for results." -ForegroundColor Green
Write-Host "🔍 Look for Portuguese characters (ç, ã, õ, etc.) instead of ?? symbols" -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Magenta
Write-Host "   1. Replace 'your-backend.onrender.com' with your actual Render URL" -ForegroundColor White
Write-Host "   2. Deploy your changes to Render" -ForegroundColor White
Write-Host "   3. Run this script to verify the fix worked" -ForegroundColor White
Write-Host "   4. Check your frontend app for correct Portuguese character display" -ForegroundColor White
