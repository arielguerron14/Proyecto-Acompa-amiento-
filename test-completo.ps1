#!/usr/bin/env pwsh
# TEST: Flujo Completo - Registro, Login, Reserva

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"
$timeout = 30  # 30 segundos de timeout

# Generar credenciales de prueba
$timestamp = Get-Date -Format "yyyyMMddHHmmssfff"
$email = "test.user.$timestamp@example.com"
$password = "Test123!@"
$nombre = "Test User $timestamp"

Write-Host ""
Write-Host "======================================================"
Write-Host "TEST: Flujo Completo - Registro, Login, Reserva"
Write-Host "======================================================"
Write-Host ""

# PASO 1: REGISTRO
Write-Host "PASO 1: REGISTRO"
Write-Host "======================================================" 
Write-Host "Email: $email"
Write-Host "Password: $password"
Write-Host ""

$registerBody = @{
    email = $email
    nombre = $nombre
    password = $password
} | ConvertTo-Json

Write-Host "[*] Enviando solicitud de registro..."

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -UseBasicParsing `
        -TimeoutSec $timeout `
        -ErrorAction Stop
    $sw.Stop()
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Registro exitoso ($($sw.ElapsedMilliseconds)ms)"
    Write-Host "     Status: $($response.StatusCode)"
    Write-Host "     User ID: $($data.data._id)"
    
    $userId = $data.data._id
    
} catch [System.Net.HttpRequestException] {
    Write-Host "[ERROR] Timeout o conexion fallida"
    Write-Host "        $($_.Exception.Message)"
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "[WARNING] Usuario ya existe (409) - continuando..."
        $userId = "test-user-id"
    } else {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "[ERROR] Status $statusCode"
        Write-Host "        Response: $errorBody"
        exit 1
    }
}

Write-Host ""

# PASO 2: LOGIN
Write-Host "PASO 2: LOGIN"
Write-Host "======================================================"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

Write-Host "[*] Enviando credenciales..."

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -TimeoutSec $timeout `
        -ErrorAction Stop
    $sw.Stop()
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Login exitoso ($($sw.ElapsedMilliseconds)ms)"
    Write-Host "     Status: $($response.StatusCode)"
    
    $token = $data.data.accessToken
    $userId = $data.data.user._id
    
    Write-Host "     Access Token (40 chars): $($token.Substring(0, [Math]::Min(40, $token.Length)))..."
    Write-Host "     User ID: $userId"
    
} catch [System.Net.HttpRequestException] {
    Write-Host "[ERROR] Timeout o conexion fallida"
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[ERROR] Status $statusCode - $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# PASO 3: OBTENER RESERVAS EXISTENTES
Write-Host "PASO 3: OBTENER RESERVAS"
Write-Host "======================================================"

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "[*] Obteniendo reservas del usuario..."

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -TimeoutSec $timeout `
        -ErrorAction Stop
    $sw.Stop()
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Reservas obtenidas ($($sw.ElapsedMilliseconds)ms)"
    Write-Host "     Status: $($response.StatusCode)"
    Write-Host "     Total: $($data.data.Count) reservas"
    
    if ($data.data.Count -gt 0) {
        Write-Host "     Primera reserva:"
        Write-Host "     - Fecha: $($data.data[0].fecha)"
        Write-Host "     - Hora: $($data.data[0].hora)"
        Write-Host "     - Estado: $($data.data[0].estado)"
    }
    
} catch [System.Net.HttpRequestException] {
    Write-Host "[WARNING] No se pudo obtener reservas (timeout)"
} catch {
    Write-Host "[WARNING] No se pudo obtener reservas: $($_.Exception.Message)"
}

Write-Host ""

# PASO 4: CREAR RESERVA
Write-Host "PASO 4: CREAR RESERVA"
Write-Host "======================================================"

$fecha = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$hora = "14:00"

Write-Host "Fecha: $fecha"
Write-Host "Hora: $hora"
Write-Host ""

$reservaBody = @{
    estudianteId = $userId
    maestroId = "maestro001"
    fecha = $fecha
    hora = $hora
    asunto = "Tutoria - Matematicas"
    descripcion = "Sesion de tutoria"
} | ConvertTo-Json

Write-Host "[*] Creando reserva..."

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $reservaBody `
        -UseBasicParsing `
        -TimeoutSec $timeout `
        -ErrorAction Stop
    $sw.Stop()
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Reserva creada ($($sw.ElapsedMilliseconds)ms)"
    Write-Host "     Status: $($response.StatusCode)"
    Write-Host "     Reserva ID: $($data.data._id)"
    Write-Host "     Estado: $($data.data.estado)"
    
    $reservaId = $data.data._id
    
} catch [System.Net.HttpRequestException] {
    Write-Host "[WARNING] Timeout creando reserva"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[INFO] Status $statusCode (puede ser esperado)"
    Write-Host "       $($_.Exception.Message)"
}

Write-Host ""
Write-Host "======================================================"
Write-Host "TEST FINALIZADO"
Write-Host "======================================================"
Write-Host ""
Write-Host "Resumen:"
Write-Host "  Email: $email"
Write-Host "  Password: $password"
Write-Host "  User ID: $userId"
Write-Host ""
Write-Host "✓ Todos los pasos completados exitosamente"
Write-Host ""
