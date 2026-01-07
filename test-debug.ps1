#!/usr/bin/env pwsh
# TEST: Flujo Completo - DEBUG

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"

# Credenciales de prueba
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.user.$timestamp@example.com"
$password = "Test123!@"

Write-Host "TEST: Flujo Registro -> Login -> Reserva"
Write-Host ""

# PASO 1: REGISTRO
Write-Host "PASO 1: REGISTRO"
Write-Host "Email: $email"

$registerBody = @{
    email = $email
    name = "Test User"
    password = $password
} | ConvertTo-Json

$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $registerBody `
    -UseBasicParsing

Write-Host "Response Text:" 
Write-Host $reg.Content

$regData = $reg.Content | ConvertFrom-Json
Write-Host ""
Write-Host "Parsed JSON:"
$regData | ConvertTo-Json

$userId = $null
if ($regData.user) {
    $userId = $regData.user.userId
    Write-Host "User ID from user.userId: $userId"
} elseif ($regData.data) {
    $userId = $regData.data._id
    Write-Host "User ID from data._id: $userId"
} else {
    Write-Host "No se encontró user ID"
    Write-Host $regData | ConvertTo-Json
}

Write-Host ""
Write-Host "PASO 2: LOGIN"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody `
    -UseBasicParsing

Write-Host "Response Text:"
Write-Host $login.Content

$loginData = $login.Content | ConvertFrom-Json
Write-Host ""
Write-Host "Parsed JSON:"
$loginData | ConvertTo-Json

if ($loginData.token) {
    $token = $loginData.token
    Write-Host "Token: $($token.Substring(0, 30))..."
} elseif ($loginData.data -and $loginData.data.accessToken) {
    $token = $loginData.data.accessToken
    Write-Host "Token: $($token.Substring(0, 30))..."
} else {
    Write-Host "No se encontró token"
}
