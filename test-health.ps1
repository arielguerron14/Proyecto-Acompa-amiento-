#!/usr/bin/env pwsh
# Test Health Endpoints

$baseUrl = "http://52.71.188.181:8080"

Write-Host "Testing health endpoints:"
Write-Host ""

# Auth health
Write-Host "1. GET /api/auth/health"
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/auth/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Status: $($res.StatusCode) - OK"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__) - FAIL"
}

# Estudiantes health
Write-Host "2. GET /api/estudiantes/health"
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Status: $($res.StatusCode) - OK"
    Write-Host "   Response: $($res.Content)"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__) - FAIL"
}

# Maestros health
Write-Host "3. GET /api/maestros/health"
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/maestros/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Status: $($res.StatusCode) - OK"
    Write-Host "   Response: $($res.Content)"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__) - FAIL"
}

# Gateway test
Write-Host "4. GET /test"
try {
    $res = Invoke-WebRequest -Uri "$baseUrl/test" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Status: $($res.StatusCode) - OK"
    Write-Host "   Response: $($res.Content)"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__) - FAIL"
}

Write-Host ""
Write-Host "Si todos son OK, el problema es en la lógica de reservas."
