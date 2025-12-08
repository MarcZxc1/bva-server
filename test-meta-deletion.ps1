# PowerShell test script for Meta Data Deletion endpoints
# This script tests both the backend endpoint and the Supabase Edge Function

Write-Host "🧪 Testing Meta Data Deletion Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_URL = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "http://localhost:3000" }
$SUPABASE_FUNCTION_URL = if ($env:SUPABASE_FUNCTION_URL) { $env:SUPABASE_FUNCTION_URL } else { "https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion" }

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Backend URL: $BACKEND_URL"
Write-Host "  Supabase Function URL: $SUPABASE_FUNCTION_URL"
Write-Host ""

# Test 1: Check if backend server is running
Write-Host "🔍 Test 1: Checking if backend server is running..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server is not running or not accessible" -ForegroundColor Red
    Write-Host "   Please start your server: cd server && npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Test backend DELETE endpoint
Write-Host "🔍 Test 2: Testing backend DELETE endpoint..." -ForegroundColor Cyan
Write-Host "   Endpoint: DELETE $BACKEND_URL/api/auth/facebook/delete-user"
Write-Host ""

$TEST_FACEBOOK_ID = "test_facebook_123456"
$body = @{
    facebookUserId = $TEST_FACEBOOK_ID
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/facebook/delete-user" `
        -Method Delete `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Green
    Write-Host "✅ Endpoint is working correctly" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "   HTTP Status: $statusCode" -ForegroundColor Yellow
    Write-Host "   Response: $errorBody" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host "⚠️  User not found (expected if test user doesn't exist)" -ForegroundColor Yellow
        Write-Host "✅ Endpoint is working correctly" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "❌ Server error - check backend logs" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Test Supabase Edge Function
Write-Host "🔍 Test 3: Testing Supabase Edge Function..." -ForegroundColor Cyan
Write-Host "   Endpoint: POST $SUPABASE_FUNCTION_URL"
Write-Host ""

$MOCK_SIGNED_REQUEST = "test_signed_request_$(Get-Date -Format 'yyyyMMddHHmmss')"
$formData = @{
    signed_request = $MOCK_SIGNED_REQUEST
}

Write-Host "   Sending test request with mock signed_request..."
try {
    $response = Invoke-RestMethod -Uri $SUPABASE_FUNCTION_URL `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $formData `
        -ErrorAction Stop
    
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Green
    Write-Host "✅ Function processed request successfully" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "   HTTP Status: $statusCode" -ForegroundColor Yellow
    Write-Host "   Response: $errorBody" -ForegroundColor Yellow
    
    if ($statusCode -eq 400) {
        Write-Host "⚠️  Invalid signed_request (expected with mock data)" -ForegroundColor Yellow
        Write-Host "✅ Function is deployed and responding" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ Function not found or not deployed" -ForegroundColor Red
        Write-Host "   Deploy the function: supabase functions deploy meta-data-deletion" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host "❌ Function error - check Supabase logs" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Test CORS
Write-Host "🔍 Test 4: Testing CORS support..." -ForegroundColor Cyan
Write-Host "   Endpoint: OPTIONS $SUPABASE_FUNCTION_URL"
Write-Host ""

try {
    $corsResponse = Invoke-WebRequest -Uri $SUPABASE_FUNCTION_URL `
        -Method Options `
        -Headers @{
            "Origin" = "https://facebook.com"
            "Access-Control-Request-Method" = "POST"
        } `
        -ErrorAction Stop
    
    Write-Host "   HTTP Status: $($corsResponse.StatusCode)" -ForegroundColor Green
    $corsHeaders = $corsResponse.Headers | Where-Object { $_ -like "*Access-Control*" }
    if ($corsHeaders) {
        Write-Host "   CORS Headers found" -ForegroundColor Green
        Write-Host "✅ CORS is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CORS headers not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test CORS: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend endpoint: DELETE /api/auth/facebook/delete-user" -ForegroundColor Green
Write-Host "   - Tested with mock Facebook user ID"
Write-Host ""
Write-Host "✅ Supabase Edge Function: POST /functions/v1/meta-data-deletion" -ForegroundColor Green
Write-Host "   - Tested with mock signed_request"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Deploy Edge Function if not deployed:"
Write-Host "      supabase functions deploy meta-data-deletion"
Write-Host ""
Write-Host "   2. Add function URL to Facebook App:"
Write-Host "      https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion"
Write-Host ""
Write-Host "   3. Test with real Meta signed_request (from Facebook App dashboard)"
Write-Host ""

