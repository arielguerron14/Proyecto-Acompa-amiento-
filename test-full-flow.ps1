# Test Full Microservices and API Gateway Flow
# This script tests the complete deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING MICROSERVICES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test IPs
$AUTH_IP = "100.24.118.233"
$API_GATEWAY_IP = "100.49.159.65"
$DB_IP = "98.84.26.109"

# Test 1: Check Auth Microservice
Write-Host "1️⃣  Testing Auth Microservice Health..." -ForegroundColor Yellow
$response = try {
    Invoke-WebRequest -Uri "http://$($AUTH_IP):3000/health" -TimeoutSec 5 -ErrorAction Stop
    $response.StatusCode
} catch {
    "❌ FAILED"
}
Write-Host "   Status: $response" -ForegroundColor Green
Write-Host ""

# Test 2: Check Estudiantes Microservice
Write-Host "2️⃣  Testing Estudiantes Microservice Health..." -ForegroundColor Yellow
$response = try {
    Invoke-WebRequest -Uri "http://$($AUTH_IP):3001/health" -TimeoutSec 5 -ErrorAction Stop
    $response.StatusCode
} catch {
    "❌ FAILED"
}
Write-Host "   Status: $response" -ForegroundColor Green
Write-Host ""

# Test 3: Check Maestros Microservice
Write-Host "3️⃣  Testing Maestros Microservice Health..." -ForegroundColor Yellow
$response = try {
    Invoke-WebRequest -Uri "http://$($AUTH_IP):3002/health" -TimeoutSec 5 -ErrorAction Stop
    $response.StatusCode
} catch {
    "❌ FAILED"
}
Write-Host "   Status: $response" -ForegroundColor Green
Write-Host ""

# Test 4: Check API Gateway Health
Write-Host "4️⃣  Testing API Gateway Health..." -ForegroundColor Yellow
$response = try {
    Invoke-WebRequest -Uri "http://$($API_GATEWAY_IP):8080/health" -TimeoutSec 5 -ErrorAction Stop
    $response.StatusCode
} catch {
    "❌ FAILED"
}
Write-Host "   Status: $response" -ForegroundColor Green
Write-Host ""

# Test 5: Test Registration (CORRECT PATH: /auth/register, not /api/auth/register)
Write-Host "5️⃣  Testing Registration via API Gateway..." -ForegroundColor Yellow
$body = @{
    nombre = "Test User"
    email = "test@example.com"
    password = "123456"
    rol = "Estudiante"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://$($API_GATEWAY_IP):8080/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Test Login
Write-Host "6️⃣  Testing Login via API Gateway..." -ForegroundColor Yellow
$body = @{
    email = "test@example.com"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://$($API_GATEWAY_IP):8080/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Microservices should be at: http://100.24.118.233:3000/3001/3002" -ForegroundColor Cyan
Write-Host "   • API Gateway should be at: http://100.49.159.65:8080" -ForegroundColor Cyan
Write-Host "   • Auth endpoints: /auth/register, /auth/login, /auth/logout, /auth/verify-token" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next: Deploy frontend using 'Deploy Frontend with New IPs' workflow" -ForegroundColor Green
