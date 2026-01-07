#!/usr/bin/env pwsh
# TEST: Flujo Completo - Simple

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"
$timeout = 30

# Credenciales de prueba
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.user.$timestamp@example.com"
$password = "Test123!@"

Write-Host ""
Write-Host "=================================================="
Write-Host "TEST: Flujo Registro -> Login -> Reserva"
Write-Host "=================================================="
Write-Host ""

# PASO 1: REGISTRO
Write-Host "PASO 1: REGISTRO"
Write-Host "Email: $email"
Write-Host ""

$registerBody = @{
    email = $email
    name = "Test User"
    password = $password
} | ConvertTo-Json

$reg = $null
try {
    $reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -UseBasicParsing `
        -TimeoutSec $timeout
    
    $data = $reg.Content | ConvertFrom-Json
    Write-Host "[SUCCESS] Usuario registrado"
    Write-Host "Status: $($reg.StatusCode)"
    Write-Host "User ID: $($data.data._id)"
    $userId = $data.data._id
} catch {
    Write-Host "[ERROR] Fallo en registro"
    Write-Host $_.Exception.Message
}

Write-Host ""

# PASO 2: LOGIN  
Write-Host "PASO 2: LOGIN"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = $null
try {
    $login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -TimeoutSec $timeout
    
    $data = $login.Content | ConvertFrom-Json
    Write-Host "[SUCCESS] Login completado"
    Write-Host "Status: $($login.StatusCode)"
    
    $token = $data.data.accessToken
    $userId = $data.data.user._id
    Write-Host "Token: $($token.Substring(0, 30))..."
    Write-Host "User ID: $userId"
} catch {
    Write-Host "[ERROR] Fallo en login"
    Write-Host $_.Exception.Message
}

Write-Host ""

# PASO 3: OBTENER RESERVAS
Write-Host "PASO 3: OBTENER RESERVAS"

$headers = @{ "Authorization" = "Bearer $token" }

try {
    $reservas = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -TimeoutSec $timeout
    
    $data = $reservas.Content | ConvertFrom-Json
    Write-Host "[SUCCESS] Reservas obtenidas"
    Write-Host "Status: $($reservas.StatusCode)"
    Write-Host "Total: $($data.data.Count) reservas"
} catch {
    Write-Host "[INFO] No se pudieron obtener reservas"
    Write-Host $_.Exception.Message
}

Write-Host ""

# PASO 4: CREAR RESERVA
Write-Host "PASO 4: CREAR RESERVA"

$fecha = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$reservaBody = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = $fecha
    hora = "14:00"
    asunto = "Tutoria - Matematicas"
    descripcion = "Sesion de tutoria"
} | ConvertTo-Json

Write-Host "Fecha: $fecha, Hora: 14:00"
Write-Host ""

try {
    $nuevaReserva = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $reservaBody `
        -UseBasicParsing `
        -TimeoutSec $timeout
    
    $data = $nuevaReserva.Content | ConvertFrom-Json
    Write-Host "[SUCCESS] Reserva creada"
    Write-Host "Status: $($nuevaReserva.StatusCode)"
    Write-Host "Reserva ID: $($data.data._id)"
    Write-Host "Estado: $($data.data.estado)"
} catch {
    Write-Host "[ERROR] Fallo al crear reserva"
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=================================================="
Write-Host "TEST COMPLETADO"
Write-Host "=================================================="
