#!/usr/bin/env pwsh
# Test CREATE RESERVA - Raw payload test

$baseUrl = "http://52.71.188.181:8080"

# Step 1: Register and login
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.raw.$timestamp@example.com"

$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; name = "Test"; password = "Test123!" } | ConvertTo-Json) `
    -UseBasicParsing

$regData = $reg.Content | ConvertFrom-Json
$userId = $regData.user.userId

$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; password = "Test123!" } | ConvertTo-Json) `
    -UseBasicParsing

$loginData = $login.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "Registered: $email"
Write-Host "User ID: $userId"
Write-Host "Token OK"
Write-Host ""

# Step 2: Try GET RESERVAS with minimal fields
Write-Host "GET /api/estudiantes/reservas/estudiante/$userId"

try {
    $getRes = Invoke-WebRequest `
        -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -UseBasicParsing
    
    Write-Host "[SUCCESS] Status: $($getRes.StatusCode)"
    Write-Host "Body: $($getRes.Content | ConvertFrom-Json | ConvertTo-Json -Depth 1)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "[ERROR] Status: $status"
    
    # Try to read error body
    try {
        $errorStream = $_.Exception.Response.Content
        if ($errorStream) {
            Write-Host "Body: $errorStream"
        }
    } catch { }
}

Write-Host ""

# Step 3: Try POST RESERVA with minimal fields
Write-Host "POST /api/estudiantes/reservar"

$payload = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = "2026-01-13"
    hora = "14:00"
} | ConvertTo-Json

Write-Host "Payload: $payload"
Write-Host ""

try {
    $createRes = Invoke-WebRequest `
        -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -Body $payload `
        -UseBasicParsing
    
    Write-Host "[SUCCESS] Status: $($createRes.StatusCode)"
    Write-Host "Body: $($createRes.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "[ERROR] Status: $status"
    
    # Try to read error body
    try {
        $errorBody = $_.Exception.Response.Content
        if ($errorBody) {
            Write-Host "Body: $errorBody"
        }
    } catch { }
}
