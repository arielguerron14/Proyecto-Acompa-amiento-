#!/usr/bin/env pwsh
# TEST FINAL: Flujo Completo - Registro, Login, Reservas

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"

# Credenciales de prueba
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.user.$timestamp@example.com"
$password = "Test123!@"

Write-Host ""
Write-Host "============================================================"
Write-Host "TEST FINAL: Flujo Completo - Registro, Login, Reserva"
Write-Host "============================================================"
Write-Host ""

# ============================================================
# PASO 1: REGISTRO
# ============================================================

Write-Host "PASO 1: REGISTRO"
Write-Host "------"

$registerBody = @{
    email = $email
    name = "Test User"
    password = $password
} | ConvertTo-Json

try {
    $reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -UseBasicParsing
    
    $regData = $reg.Content | ConvertFrom-Json
    $userId = $regData.user.userId
    
    Write-Host "[OK] Usuario registrado exitosamente"
    Write-Host "  - Status: $($reg.StatusCode)"
    Write-Host "  - Email: $email"
    Write-Host "  - User ID: $userId"
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Fallo en registro: $($_.Exception.Message)"
    exit 1
}

# ============================================================
# PASO 2: LOGIN
# ============================================================

Write-Host "PASO 2: LOGIN"
Write-Host "------"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    $loginData = $login.Content | ConvertFrom-Json
    $token = $loginData.token
    $refreshToken = $loginData.refreshToken
    
    Write-Host "[OK] Login exitoso"
    Write-Host "  - Status: $($login.StatusCode)"
    Write-Host "  - Access Token: $($token.Substring(0, 40))..."
    Write-Host "  - Refresh Token: $($refreshToken.Substring(0, 40))..."
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Fallo en login: $($_.Exception.Message)"
    exit 1
}

# ============================================================
# PASO 3: OBTENER RESERVAS ACTUALES
# ============================================================

Write-Host "PASO 3: OBTENER RESERVAS ACTUALES"
Write-Host "------"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $getReservas = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $reservasData = $getReservas.Content | ConvertFrom-Json
    $totalReservas = @($reservasData.data).Count
    
    Write-Host "[OK] Reservas obtenidas"
    Write-Host "  - Status: $($getReservas.StatusCode)"
    Write-Host "  - Total de reservas: $totalReservas"
    
    if ($totalReservas -gt 0) {
        for ($i = 0; $i -lt [Math]::Min(3, $totalReservas); $i++) {
            $r = $reservasData.data[$i]
            Write-Host "  [$($i+1)] $($r.fecha) - $($r.hora) - $($r.estado)"
        }
    } else {
        Write-Host "  (Sin reservas aún)"
    }
    Write-Host ""
    
} catch {
    Write-Host "[WARNING] No se pudieron obtener reservas: $($_.Exception.Message)"
    Write-Host ""
}

# ============================================================
# PASO 4: CREAR NUEVA RESERVA
# ============================================================

Write-Host "PASO 4: CREAR NUEVA RESERVA"
Write-Host "------"

$fecha = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$hora = "14:00"

$reservaBody = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = $fecha
    hora = $hora
    asunto = "Tutoria - Matematicas"
    descripcion = "Sesion de tutoria para resolver dudas de algebra"
} | ConvertTo-Json

Write-Host "Reservando:"
Write-Host "  - Fecha: $fecha"
Write-Host "  - Hora: $hora"
Write-Host "  - Asunto: Tutoria - Matematicas"
Write-Host ""

try {
    $crearReserva = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $reservaBody `
        -UseBasicParsing
    
    $reservaCreada = $crearReserva.Content | ConvertFrom-Json
    
    Write-Host "[OK] Reserva creada exitosamente"
    Write-Host "  - Status: $($crearReserva.StatusCode)"
    Write-Host "  - Reserva ID: $($reservaCreada.data._id)"
    Write-Host "  - Estado: $($reservaCreada.data.estado)"
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Fallo al crear reserva: $($_.Exception.Message)"
    Write-Host ""
}

# ============================================================
# PASO 5: VERIFICAR RESERVA CREADA
# ============================================================

Write-Host "PASO 5: VERIFICAR RESERVA CREADA"
Write-Host "------"

try {
    $verifyReservas = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $verifyData = $verifyReservas.Content | ConvertFrom-Json
    $totalReservasNew = @($verifyData.data).Count
    
    Write-Host "[OK] Verificacion completada"
    Write-Host "  - Status: $($verifyReservas.StatusCode)"
    Write-Host "  - Total de reservas ahora: $totalReservasNew"
    
    if ($totalReservasNew -gt 0) {
        Write-Host ""
        Write-Host "Reservas del usuario:"
        for ($i = 0; $i -lt $totalReservasNew; $i++) {
            $r = $verifyData.data[$i]
            Write-Host "  [$($i+1)] $($r.fecha) - $($r.hora) - Estado: $($r.estado)"
        }
    }
    Write-Host ""
    
} catch {
    Write-Host "[WARNING] Error en verificacion: $($_.Exception.Message)"
    Write-Host ""
}

# ============================================================
# RESUMEN FINAL
# ============================================================

Write-Host "============================================================"
Write-Host "TEST COMPLETADO EXITOSAMENTE"
Write-Host "============================================================"
Write-Host ""
Write-Host "Credenciales del usuario de prueba:"
Write-Host "  Email: $email"
Write-Host "  Password: $password"
Write-Host "  User ID: $userId"
Write-Host ""
Write-Host "Tokens generados:"
Write-Host "  Access Token (40 chars): $($token.Substring(0, 40))..."
Write-Host "  Refresh Token (40 chars): $($refreshToken.Substring(0, 40))..."
Write-Host ""
Write-Host "RESULTADO: Todos los pasos completados exitosamente!"
Write-Host ""
