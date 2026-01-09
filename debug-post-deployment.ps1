#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Debugging completo para problemas post-deployment

.DESCRIPTION
    Herramienta diagnostica para identificar y resolver problemas después del deployment:
    - Estado del contenedor Docker
    - Variables de entorno
    - Conectividad de red
    - Logs de error
    - Health check detallado

.PARAMETER InstanceName
    Nombre de la instancia a diagnosticar

.EXAMPLE
    .\debug-post-deployment.ps1 -InstanceName "EC2_CORE"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$InstanceName
)

# Colores
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$CYAN = "`e[36m"
$MAGENTA = "`e[35m"
$RESET = "`e[0m"

function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "${BLUE}╔═══════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${BLUE}║${RESET}  $Title"
    Write-Host "${BLUE}╚═══════════════════════════════════════════════════════════════╝${RESET}"
    Write-Host ""
}

function Test-Condition {
    param([bool]$Condition, [string]$Success, [string]$Failure)
    if ($Condition) {
        Write-Color "✅ $Success" $GREEN
        return $true
    } else {
        Write-Color "❌ $Failure" $RED
        return $false
    }
}

Write-Host ""
Write-Host "${CYAN}╔═══════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${CYAN}║  🔧 DEBUG POST-DEPLOYMENT - $InstanceName${RESET}"
Write-Host "${CYAN}╚═══════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# Variables
$diagnosticReport = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Instance = $InstanceName
    Checks = @()
    Issues = @()
    Recommendations = @()
}

# 1. Cargar configuración
Write-Section "1️⃣  CARGA DE CONFIGURACIÓN"

$configScript = @"
const config = require('./infrastructure.config.js');
const instance = '$InstanceName';
const envFile = './infrastructure.config.js';

console.log(JSON.stringify({
    publicIp: config.PUBLIC[instance + '_IP'],
    privateIp: config.PRIVATE[instance + '_PRIVATE_IP'],
    port: config.PORTS[instance] || 3000,
    mongoUrl: config.MONGO_URLS[instance],
    kafkaUrl: config.KAFKA_URL,
    hasEnvFile: true
}));
"@

try {
    $config = node -e $configScript | ConvertFrom-Json
    Write-Color "✅ Configuración cargada exitosamente" $GREEN
    Write-Host "  • IP Pública: $($config.publicIp)"
    Write-Host "  • IP Privada: $($config.privateIp)"
    Write-Host "  • Puerto: $($config.port)"
    
    $diagnosticReport.Checks += @{
        name = "Configuration Loading"
        status = "PASS"
        details = "Config loaded from infrastructure.config.js"
    }
} catch {
    Write-Color "❌ Error cargando configuración: $_" $RED
    $diagnosticReport.Issues += "Configuration loading failed"
    exit 1
}

# 2. Obtener SSH Key
Write-Section "2️⃣  OBTENCIÓN DE SSH KEY"

$sshKeyFile = "/tmp/debug-key-$InstanceName.pem"
try {
    $sshKeyContent = aws secretsmanager get-secret-value `
        --secret-id "AWS_EC2_SSH_PRIVATE_KEY" `
        --query 'SecretString' `
        --output text 2>$null
    
    if ($sshKeyContent) {
        $sshKeyContent | Out-File -FilePath $sshKeyFile -Encoding ASCII -NoNewline -Force
        chmod 600 $sshKeyFile
        Write-Color "✅ SSH Key obtecida desde AWS Secrets Manager" $GREEN
    } else {
        throw "No SSH key found"
    }
    
    $diagnosticReport.Checks += @{
        name = "SSH Key Access"
        status = "PASS"
        details = "SSH key retrieved from AWS Secrets Manager"
    }
} catch {
    Write-Color "⚠️  Usando SSH key local" $YELLOW
    $diagnosticReport.Recommendations += "Consider setting up AWS Secrets Manager for SSH keys"
}

# 3. Conectividad SSH
Write-Section "3️⃣  CONECTIVIDAD SSH"

try {
    $sshTest = ssh -i $sshKeyFile -o StrictHostKeyChecking=no -o ConnectTimeout=5 `
        "ec2-user@$($config.publicIp)" "echo 'SSH OK'" 2>&1
    
    if ($sshTest -eq "SSH OK") {
        Write-Color "✅ Conexión SSH exitosa" $GREEN
        $diagnosticReport.Checks += @{
            name = "SSH Connectivity"
            status = "PASS"
            details = "SSH connection established"
        }
    } else {
        throw "SSH response invalid"
    }
} catch {
    Write-Color "❌ Error en conexión SSH: $_" $RED
    $diagnosticReport.Issues += "SSH connection failed"
    $diagnosticReport.Recommendations += "Check security group rules and SSH key"
    exit 1
}

# 4. Estado del Contenedor Docker
Write-Section "4️⃣  ESTADO DEL CONTENEDOR DOCKER"

try {
    $dockerStatus = ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
        "ec2-user@$($config.publicIp)" `
        "docker ps --filter name=$InstanceName --format json" 2>&1 | ConvertFrom-Json
    
    if ($dockerStatus) {
        Write-Color "✅ Contenedor encontrado" $GREEN
        Write-Host "  • Container ID: $($dockerStatus.ID.Substring(0, 12))"
        Write-Host "  • Estado: $($dockerStatus.State)"
        Write-Host "  • Status: $($dockerStatus.Status)"
        
        $diagnosticReport.Checks += @{
            name = "Docker Container"
            status = "PASS"
            details = "Container found - State: $($dockerStatus.State)"
        }
        
        # Verificar si está running
        if ($dockerStatus.State -ne "running") {
            $diagnosticReport.Issues += "Container is not running (State: $($dockerStatus.State))"
            Write-Color "⚠️  ADVERTENCIA: Contenedor no está en ejecución" $YELLOW
        }
    } else {
        throw "No container found"
    }
} catch {
    Write-Color "❌ Contenedor no encontrado: $_" $RED
    $diagnosticReport.Issues += "Docker container not found"
    $diagnosticReport.Recommendations += "Run deploy-complete.ps1 to deploy the container"
}

# 5. Logs del Contenedor
Write-Section "5️⃣  LOGS DEL CONTENEDOR"

try {
    Write-Color "Últimas 30 líneas de logs:" $CYAN
    $logs = ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
        "ec2-user@$($config.publicIp)" `
        "docker logs --tail=30 $InstanceName 2>&1" 2>&1
    
    Write-Host $logs
    
    # Buscar errores
    if ($logs -match "error|Error|ERROR") {
        Write-Color "⚠️  ERRORES DETECTADOS EN LOGS" $RED
        $errorLines = $logs | Select-String -Pattern "error|Error|ERROR" | Select-Object -First 5
        foreach ($line in $errorLines) {
            Write-Host "  $line"
        }
        $diagnosticReport.Issues += "Errors found in container logs"
    } else {
        Write-Color "✅ No hay errores obvios en los logs" $GREEN
        $diagnosticReport.Checks += @{
            name = "Container Logs"
            status = "PASS"
            details = "No obvious errors in logs"
        }
    }
} catch {
    Write-Color "⚠️  Error leyendo logs: $_" $YELLOW
}

# 6. Variables de Entorno
Write-Section "6️⃣  VARIABLES DE ENTORNO"

try {
    Write-Color "Verificando archivo .env.prod.$($InstanceName.ToLower())..." $CYAN
    
    $envCheck = ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
        "ec2-user@$($config.publicIp)" `
        "cat /home/ec2-user/$InstanceName/.env 2>&1" 2>&1 | Head -20
    
    if ($envCheck) {
        Write-Host $envCheck
        Write-Color "✅ Archivo .env encontrado" $GREEN
        $diagnosticReport.Checks += @{
            name = ".env File"
            status = "PASS"
            details = ".env file exists and is readable"
        }
    } else {
        throw ".env not found"
    }
} catch {
    Write-Color "❌ No se pudo acceder a .env: $_" $RED
    $diagnosticReport.Issues += ".env file not accessible"
}

# 7. Conectividad de Red
Write-Section "7️⃣  CONECTIVIDAD DE RED"

try {
    # Test puerto 3000
    Write-Color "Probando puerto $($config.port) en localhost (dentro del contenedor)..." $CYAN
    $portTest = ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
        "ec2-user@$($config.publicIp)" `
        "docker exec $InstanceName curl -s http://localhost:$($config.port)/health || echo 'FAIL'" 2>&1
    
    if ($portTest -match "FAIL") {
        Write-Color "❌ Puerto $($config.port) no responde" $RED
        $diagnosticReport.Issues += "Port $($config.port) is not responding"
        $diagnosticReport.Recommendations += "Check if service is listening on port $($config.port)"
    } else {
        Write-Color "✅ Puerto $($config.port) responde correctamente" $GREEN
        $diagnosticReport.Checks += @{
            name = "Network Port"
            status = "PASS"
            details = "Service listening on port $($config.port)"
        }
        Write-Host "  Respuesta: $($portTest | Select-Object -First 1)"
    }
} catch {
    Write-Color "⚠️  Error probando puerto: $_" $YELLOW
}

# 8. Health Check
Write-Section "8️⃣  HEALTH CHECK"

try {
    Write-Color "Probando /health endpoint..." $CYAN
    $healthCheck = Invoke-WebRequest -Uri "http://$($config.publicIp):$($config.port)/health" `
        -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    if ($healthCheck) {
        Write-Color "✅ Health check exitoso ($($healthCheck.StatusCode))" $GREEN
        Write-Host "  Respuesta: $($healthCheck.Content)"
        $diagnosticReport.Checks += @{
            name = "Health Check"
            status = "PASS"
            details = "Health endpoint responding with 200"
        }
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Color "❌ Health check fallido: $_" $RED
    $diagnosticReport.Issues += "Health check endpoint not responding"
    $diagnosticReport.Recommendations += "Verify service is properly initialized"
}

# 9. Métricas del Contenedor
Write-Section "9️⃣  MÉTRICAS DEL CONTENEDOR"

try {
    $metrics = ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
        "ec2-user@$($config.publicIp)" `
        "docker stats --no-stream $InstanceName --format 'table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}'" 2>&1
    
    Write-Color "CPU / Memoria / Red I/O:" $CYAN
    Write-Host $metrics
    $diagnosticReport.Checks += @{
        name = "Container Metrics"
        status = "PASS"
        details = "Metrics retrieved successfully"
    }
} catch {
    Write-Color "⚠️  Error obteniendo métricas: $_" $YELLOW
}

# Generar Reporte Final
Write-Section "📋 REPORTE DE DIAGNÓSTICO"

Write-Color "Estado General: $(if ($diagnosticReport.Issues.Count -eq 0) { 'EXCELENTE ✅' } else { "PROBLEMAS DETECTADOS ❌" })" `
    $(if ($diagnosticReport.Issues.Count -eq 0) { $GREEN } else { $RED })

Write-Host ""
Write-Color "Checks Exitosos: $($diagnosticReport.Checks.Count)" $GREEN
foreach ($check in $diagnosticReport.Checks) {
    Write-Host "  ✅ $($check.name): $($check.details)"
}

if ($diagnosticReport.Issues.Count -gt 0) {
    Write-Host ""
    Write-Color "Problemas Detectados: $($diagnosticReport.Issues.Count)" $RED
    foreach ($issue in $diagnosticReport.Issues) {
        Write-Host "  ❌ $issue"
    }
}

if ($diagnosticReport.Recommendations.Count -gt 0) {
    Write-Host ""
    Write-Color "Recomendaciones:" $YELLOW
    foreach ($rec in $diagnosticReport.Recommendations) {
        Write-Host "  💡 $rec"
    }
}

# Guardar reporte
$reportPath = "debug-report-$InstanceName-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$diagnosticReport | ConvertTo-Json | Out-File -FilePath $reportPath
Write-Color "Reporte guardado en: $reportPath" $CYAN

# Limpiar
Remove-Item -Path $sshKeyFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "${CYAN}╔═══════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${CYAN}║  ✅ DEBUG COMPLETADO${RESET}"
Write-Host "${CYAN}╚═══════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""
