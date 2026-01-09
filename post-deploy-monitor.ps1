#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Monitoreo en tiempo real y pruebas de endpoints post-deployment

.DESCRIPTION
    - Monitorea logs del contenedor en tiempo real
    - Prueba todos los endpoints disponibles
    - Valida connectivity entre servicios
    - Genera reporte de salud del sistema

.PARAMETER InstanceName
    Nombre de la instancia a monitorear

.PARAMETER FollowLogs
    Seguir logs en tiempo real (-f flag)

.PARAMETER TestEndpoints
    Probar todos los endpoints disponibles

.EXAMPLE
    .\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -FollowLogs
    .\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -TestEndpoints
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$InstanceName,
    
    [switch]$FollowLogs = $false,
    [switch]$TestEndpoints = $false,
    [switch]$CheckConnectivity = $false,
    [int]$MaxLines = 50
)

# Colores
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$CYAN = "`e[36m"
$RESET = "`e[0m"

function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "${BLUE}┌─────────────────────────────────────────────────────────────┐${RESET}"
    Write-Host "${BLUE}│${RESET}  $Title"
    Write-Host "${BLUE}└─────────────────────────────────────────────────────────────┘${RESET}"
    Write-Host ""
}

Write-Host ""
Write-Host "${CYAN}╔═════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${CYAN}║${RESET}  📊 POST-DEPLOYMENT MONITOR - $InstanceName"
Write-Host "${CYAN}╚═════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# Cargar configuración
Write-Color "Cargando configuración..." $YELLOW

$configScript = @"
const config = require('./infrastructure.config.js');
const instance = '$InstanceName';
console.log(JSON.stringify({
    publicIp: config.PUBLIC[instance + '_IP'],
    privateIp: config.PRIVATE[instance + '_PRIVATE_IP'],
    port: config.PORTS[instance] || 3000
}));
"@

try {
    $config = node -e $configScript | ConvertFrom-Json
} catch {
    Write-Color "❌ Error cargando configuración" $RED
    exit 1
}

# Opción 1: Ver logs
if ($FollowLogs -or (-not $TestEndpoints -and -not $CheckConnectivity)) {
    Write-Section "VER LOGS - Últimas $MaxLines líneas"
    
    # Obtener SSH key
    $sshKeyFile = "/tmp/monitor-key-$InstanceName.pem"
    try {
        $sshKeyContent = aws secretsmanager get-secret-value `
            --secret-id "AWS_EC2_SSH_PRIVATE_KEY" `
            --query 'SecretString' `
            --output text 2>$null
        
        if ($sshKeyContent) {
            $sshKeyContent | Out-File -FilePath $sshKeyFile -Encoding ASCII -NoNewline -Force
            chmod 600 $sshKeyFile
        }
    } catch {
        Write-Color "⚠️  No se pudo obtener SSH key" $YELLOW
    }
    
    Write-Color "Obteniendo logs del contenedor..." $YELLOW
    Write-Host ""
    
    try {
        if ($FollowLogs) {
            Write-Color "Modo: Seguimiento en tiempo real (presiona Ctrl+C para salir)" $CYAN
            ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
                "ec2-user@$($config.publicIp)" `
                "docker logs -f $InstanceName" 2>$null
        } else {
            ssh -i $sshKeyFile -o StrictHostKeyChecking=no `
                "ec2-user@$($config.publicIp)" `
                "docker logs --tail=$MaxLines $InstanceName" 2>$null
        }
    } catch {
        Write-Color "❌ Error obteniendo logs" $RED
    }
    
    Remove-Item -Path $sshKeyFile -Force -ErrorAction SilentlyContinue
}

# Opción 2: Probar endpoints
if ($TestEndpoints) {
    Write-Section "PRUEBA DE ENDPOINTS"
    
    $endpoints = @(
        @{ method = "GET"; path = "/health"; expected = 200; desc = "Health Check" },
        @{ method = "GET"; path = "/api/status"; expected = 200; desc = "Status API" },
        @{ method = "GET"; path = "/api/info"; expected = 200; desc = "Info API" },
        @{ method = "GET"; path = "/metrics"; expected = 200; desc = "Metrics" }
    )
    
    Write-Color "Probando $($endpoints.Count) endpoints en http://$($config.publicIp):$($config.port)" $YELLOW
    Write-Host ""
    
    $passed = 0
    $failed = 0
    
    foreach ($endpoint in $endpoints) {
        $url = "http://$($config.publicIp):$($config.port)$($endpoint.path)"
        
        try {
            Write-Color "  🔍 $($endpoint.method) $($endpoint.path) ($($endpoint.desc))" $CYAN
            
            $response = Invoke-WebRequest -Uri $url -Method $endpoint.method `
                -TimeoutSec 5 -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq $endpoint.expected) {
                Write-Color "     ✅ $($response.StatusCode) - OK" $GREEN
                $passed++
            } else {
                Write-Color "     ⚠️  $($response.StatusCode) - Esperado: $($endpoint.expected)" $YELLOW
                $failed++
            }
            
            # Mostrar snippet de respuesta
            if ($response.Content.Length -gt 0) {
                $preview = ($response.Content | Select-Object -First 100).Substring(0, [Math]::Min(100, $response.Content.Length))
                Write-Host "     └─ Respuesta: $preview..."
            }
        } catch {
            Write-Color "     ❌ No disponible: $_" $RED
            $failed++
        }
        
        Write-Host ""
    }
    
    Write-Color "Resultados: $passed exitosos, $failed fallidos" -Color $(if ($failed -eq 0) { $GREEN } else { $YELLOW })
}

# Opción 3: Verificar conectividad
if ($CheckConnectivity) {
    Write-Section "VERIFICACIÓN DE CONECTIVIDAD"
    
    Write-Color "Verificando conectividad desde esta máquina..." $YELLOW
    Write-Host ""
    
    # Test ping (si es accesible)
    Write-Color "  🔍 Ping a IP Pública: $($config.publicIp)" $CYAN
    try {
        $ping = Test-Connection -ComputerName $config.publicIp -Count 1 -Quiet
        if ($ping) {
            Write-Color "     ✅ Host alcanzable" $GREEN
        } else {
            Write-Color "     ❌ Host no alcanzable" $RED
        }
    } catch {
        Write-Color "     ⚠️  No se pudo completar ping" $YELLOW
    }
    
    # Test port
    Write-Color "  🔍 Puerto 3000 en IP Pública: $($config.publicIp)" $CYAN
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect($config.publicIp, 3000, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(5000, $false)
        
        if ($tcpClient.Connected) {
            Write-Color "     ✅ Puerto 3000 abierto" $GREEN
        } else {
            Write-Color "     ❌ Puerto 3000 cerrado o no alcanzable" $RED
        }
        
        $tcpClient.Close()
    } catch {
        Write-Color "     ❌ Error: $_" $RED
    }
}

# Resumen final
Write-Section "RESUMEN"

Write-Color "Estado de $InstanceName:" $BLUE
Write-Host "  IP Pública: $($config.publicIp)"
Write-Host "  IP Privada: $($config.privateIp)"
Write-Host "  Puerto: $($config.port)"
Write-Host ""

Write-Color "Comandos útiles:" $BLUE
Write-Host "  Ver logs:                  .\post-deploy-monitor.ps1 -InstanceName $InstanceName -FollowLogs"
Write-Host "  Probar endpoints:          .\post-deploy-monitor.ps1 -InstanceName $InstanceName -TestEndpoints"
Write-Host "  Verificar conectividad:    .\post-deploy-monitor.ps1 -InstanceName $InstanceName -CheckConnectivity"
Write-Host ""

Write-Host "${CYAN}╔═════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${CYAN}║  ✅ MONITOREO COMPLETADO${RESET}"
Write-Host "${CYAN}╚═════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""
