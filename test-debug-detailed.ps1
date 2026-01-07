#!/usr/bin/env pwsh
# DEBUG: Detailed response inspection

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"

# Credenciales
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.debug.$timestamp@example.com"

Write-Host "REGISTRO"

$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; name = "Debug"; password = "Test123!" } | ConvertTo-Json) `
    -UseBasicParsing

$regData = $reg.Content | ConvertFrom-Json
$userId = $regData.user.userId

Write-Host "User ID: $userId"
Write-Host ""

# LOGIN
Write-Host "LOGIN"

$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{ email = $email; password = "Test123!" } | ConvertTo-Json) `
    -UseBasicParsing

$loginData = $login.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "Token OK"
Write-Host ""

# GET RESERVAS - Test sin token
Write-Host "GET RESERVAS (sin token)"

try {
    $getRes = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -UseBasicParsing
    Write-Host "Status: $($getRes.StatusCode)"
    Write-Host $getRes.Content
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Response: $body"
}

Write-Host ""

# GET RESERVAS - Test con token
Write-Host "GET RESERVAS (con token)"

$headers = @{ "Authorization" = "Bearer $token" }

try {
    $getRes = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    Write-Host "Status: $($getRes.StatusCode)"
    Write-Host "Response: $($getRes.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Response: $body"
}

Write-Host ""

# CREATE RESERVA
Write-Host "CREATE RESERVA"

$reservaPayload = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = "2026-01-13"
    hora = "14:00"
    asunto = "Test"
    descripcion = "Test"
} | ConvertTo-Json

Write-Host "Payload: $reservaPayload"
Write-Host ""

try {
    $createRes = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $reservaPayload `
        -UseBasicParsing
    Write-Host "Status: $($createRes.StatusCode)"
    Write-Host "Response: $($createRes.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Response: $body"
}
