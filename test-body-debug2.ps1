#!/usr/bin/env pwsh
# Test mejorado para ver exactamente qué responde el servidor

$baseUrl = "http://52.71.188.181:8080"

# Registrar
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.body.$timestamp@example.com"

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

Write-Host "✓ Usuario: $email"
Write-Host "✓ User ID: $userId"
Write-Host "✓ Token OK"
Write-Host ""

# Test: Enviar payload
Write-Host "TEST: Crear reserva"

$payload = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = "2026-01-13"
    hora = "14:00"
    asunto = "Tutoria"
    descripcion = "Test"
} | ConvertTo-Json

Write-Host "📤 Enviando JSON:"
Write-Host $payload
Write-Host ""

try {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -Body $payload `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✓ Status: $($res.StatusCode)"
    Write-Host "📥 Response Body:"
    Write-Host $res.Content
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status: $statusCode"
    
    # Try to read the response stream
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    
    Write-Host "📥 Response Body:"
    Write-Host $responseBody
    Write-Host ""
    
    if ($responseBody) {
        try {
            Write-Host "📥 Parsed JSON:"
            $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 2
        } catch {
            Write-Host "(No es JSON válido)"
        }
    }
}
