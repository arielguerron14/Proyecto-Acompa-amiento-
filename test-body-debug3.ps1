#!/usr/bin/env pwsh
# Test mejorado para PowerShell Core

$baseUrl = "http://52.71.188.181:8080"
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.body.$timestamp@example.com"

$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; name = "Test"; password = "Test123!" } | ConvertTo-Json) `
    -SkipHttpErrorCheck

$regData = $reg.Content | ConvertFrom-Json
$userId = $regData.user.userId

$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; password = "Test123!" } | ConvertTo-Json) `
    -SkipHttpErrorCheck

$loginData = $login.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "✓ User ID: $userId"

$payload = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = "2026-01-13"
    hora = "14:00"
} | ConvertTo-Json

Write-Host "📤 Payload:"
Write-Host $payload
Write-Host ""

$res = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body $payload `
    -SkipHttpErrorCheck

Write-Host "Status: $($res.StatusCode)"
Write-Host "Response:"
Write-Host $res.Content
