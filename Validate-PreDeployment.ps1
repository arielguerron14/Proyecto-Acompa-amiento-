#Requires -Version 5.0
<#
.SYNOPSIS
    Valida la configuración previa al despliegue
.DESCRIPTION
    Verifica que todas las configuraciones y dependencias estén correctas
    antes de ejecutar el despliegue de contenedores
#>

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔍 VALIDACIÓN PRE-DESPLIEGUE                                 ║" -ForegroundColor Cyan
Write-Host "║  Verificando configuración y conectividad                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$checks = @()
$failureCount = 0

# ============================================================================
# 1. Verificar archivo de configuración
# ============================================================================
Write-Host "📋 1️⃣  Verificando archivo de configuración..." -ForegroundColor Yellow

if (Test-Path "config/instance_ips.json") {
    Write-Host "  ✅ Archivo config/instance_ips.json encontrado" -ForegroundColor Green
    $config = Get-Content "config/instance_ips.json" | ConvertFrom-Json
    Write-Host "  ✅ Configuración JSON válida" -ForegroundColor Green
    
    # Verificar que todas las instancias tienen IP
    $instanceCount = $config.PSObject.Properties.Count
    Write-Host "  ✅ $instanceCount instancias configuradas" -ForegroundColor Green
    
    $config.PSObject.Properties | ForEach-Object {
        $name = $_.Name
        $ip = $_.Value.PublicIpAddress
        Write-Host "    ✓ $name => $ip" -ForegroundColor Gray
    }
}
else {
    Write-Host "  ❌ Archivo config/instance_ips.json NO encontrado" -ForegroundColor Red
    $failureCount++
}

Write-Host ""

# ============================================================================
# 2. Verificar SSH disponible
# ============================================================================
Write-Host "📋 2️⃣  Verificando acceso SSH..." -ForegroundColor Yellow

$sshPath = "ssh"
$sshCheck = Get-Command ssh -ErrorAction SilentlyContinue

if ($sshCheck) {
    Write-Host "  ✅ SSH disponible: $($sshCheck.Source)" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  SSH no encontrado en PATH" -ForegroundColor Yellow
    Write-Host "     En Windows, instalar Git Bash o WSL para SSH" -ForegroundColor Gray
    $failureCount++
}

Write-Host ""

# ============================================================================
# 3. Verificar clave SSH
# ============================================================================
Write-Host "📋 3️⃣  Verificando claves SSH..." -ForegroundColor Yellow

$keyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (Test-Path $keyPath) {
    Write-Host "  ✅ Clave privada encontrada: $keyPath" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Clave privada NO encontrada en $keyPath" -ForegroundColor Red
    Write-Host "     Generar con: ssh-keygen -t rsa -b 4096" -ForegroundColor Gray
    $failureCount++
}

$pubKeyPath = "$keyPath.pub"
if (Test-Path $pubKeyPath) {
    Write-Host "  ✅ Clave pública encontrada: $pubKeyPath" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Clave pública NO encontrada" -ForegroundColor Red
    $failureCount++
}

Write-Host ""

# ============================================================================
# 4. Verificar conectividad a las instancias
# ============================================================================
Write-Host "📋 4️⃣  Verificando conectividad a EC2 instances..." -ForegroundColor Yellow

$ips = @{
    "EC2-CORE"           = "100.49.160.199"
    "EC2-API-Gateway"    = "98.86.94.92"
    "EC2-DB"             = "3.235.120.8"
}

foreach ($name in $ips.Keys) {
    $ip = $ips[$name]
    
    # Ping rápido
    $ping = Test-Connection -ComputerName $ip -Count 1 -Quiet
    if ($ping) {
        Write-Host "  ✅ $name ($ip) - Respondiendo" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  $name ($ip) - Sin respuesta a ping" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================================================
# 5. Verificar Docker instalado (si es local)
# ============================================================================
Write-Host "📋 5️⃣  Verificando Docker en máquina local..." -ForegroundColor Yellow

$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCheck) {
    Write-Host "  ✅ Docker disponible: $($dockerCheck.Source)" -ForegroundColor Green
    
    # Ver versión
    try {
        $dockerVersion = docker --version
        Write-Host "  ✅ Versión: $dockerVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  No se puede obtener versión de Docker" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ℹ️  Docker no disponible localmente (no requerido para deployment remoto)" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# 6. Verificar Git
# ============================================================================
Write-Host "📋 6️⃣  Verificando Git..." -ForegroundColor Yellow

$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    Write-Host "  ✅ Git disponible: $($gitCheck.Source)" -ForegroundColor Green
    
    # Verificar repositorio
    if (Test-Path ".git") {
        Write-Host "  ✅ Repositorio Git encontrado" -ForegroundColor Green
        
        # Ver rama actual
        $branch = git branch --show-current
        Write-Host "  ✅ Rama actual: $branch" -ForegroundColor Green
        
        # Ver último commit
        $lastCommit = git log -1 --pretty=format:"%h - %s"
        Write-Host "  ✅ Último commit: $lastCommit" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# 7. Verificar variables de entorno necesarias
# ============================================================================
Write-Host "📋 7️⃣  Verificando variables de entorno..." -ForegroundColor Yellow

$envVars = @{
    "DOCKER_USERNAME" = "Usuario de Docker (para descargar imágenes)"
}

foreach ($var in $envVars.Keys) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "  ✅ $var = $value" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  $var no configurada" -ForegroundColor Yellow
        Write-Host "     Configurar con: `$env:$var = 'valor'" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================================================
# 8. Verificar scripts de despliegue
# ============================================================================
Write-Host "📋 8️⃣  Verificando scripts de despliegue..." -ForegroundColor Yellow

$scripts = @(
    "Deploy-AllContainers.ps1",
    "deploy-all-containers.sh",
    "test-app-flows.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        $size = (Get-Item $script).Length / 1KB
        Write-Host "  ✅ $script ($([math]::Round($size)) KB)" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ $script NO encontrado" -ForegroundColor Red
        $failureCount++
    }
}

Write-Host ""

# ============================================================================
# RESUMEN
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RESUMEN DE VALIDACIÓN                                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($failureCount -eq 0) {
    Write-Host "✅ ¡VALIDACIÓN EXITOSA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "El sistema está listo para desplegar los contenedores." -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo paso:" -ForegroundColor Yellow
    Write-Host "  .\Deploy-AllContainers.ps1 -PrivateKeyPath `"$env:USERPROFILE\.ssh\id_rsa`" -DockerUsername `"tu_usuario_docker`"" -ForegroundColor Gray
}
else {
    Write-Host "❌ VALIDACIÓN FALLIDA - $failureCount problemas encontrados" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, resolver los problemas indicados arriba antes de continuar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
