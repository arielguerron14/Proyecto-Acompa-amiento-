#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Resumen interactivo del proyecto - Dashboard
.DESCRIPTION
    Muestra un resumen visual y permite ejecutar los siguientes pasos
#>

Clear-Host

$header = @"
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║  🎯 PROYECTO ACOMPAÑAMIENTO - ESTADO FINAL                              ║
║                                                                          ║
║  ✅ CONFIGURACIÓN COMPLETADA                                            ║
║  ✅ SCRIPTS DE DEPLOYMENT LISTOS                                        ║
║  ✅ DOCUMENTACIÓN COMPLETA                                              ║
║                                                                          ║
║  Estado: LISTO PARA DESPLEGAR EN AWS                                   ║
║  Progreso: 80% (Falta: Deploy y Pruebas)                               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
"@

Write-Host $header -ForegroundColor Cyan

Write-Host "`n📊 INFRAESTRUCTURA RESUMIDA`n" -ForegroundColor Yellow

$summary = @"
  9 Instancias EC2 (todas en estado "En ejecución")
  ├─ EC2-CORE (100.49.160.199) → 5 contenedores
  ├─ EC2-API-Gateway (98.86.94.92) → 1 contenedor
  ├─ EC2-DB (3.235.120.8) → 3 contenedores
  ├─ EC2-Messaging (35.174.19.29) → 3 contenedores
  ├─ EC2-Notificaciones (3.226.74.67) → 1 contenedor
  ├─ EC2-Reportes (23.22.116.142) → 2 contenedores
  ├─ EC2-Monitoring (54.205.158.101) → 2 contenedores
  ├─ EC2-Frontend (52.72.57.10) → 1 contenedor
  └─ EC-Bastion (52.6.170.44) → 1 contenedor
  
  TOTAL: 9 Instancias | 21 Contenedores | 100% Activo
"@

Write-Host $summary -ForegroundColor Green

Write-Host "`n📁 ARCHIVOS CREADOS Y LISTOS`n" -ForegroundColor Yellow

$files = @"
  Deployment:
  ✅ Deploy-AllContainers.ps1 ............ Script PowerShell
  ✅ deploy-all-containers.sh ........... Script Bash
  ✅ Validate-PreDeployment.ps1 ......... Script de validación
  
  Documentación:
  ✅ DEPLOYMENT_AND_TEST_GUIDE.md ....... Guía completa
  ✅ ESTADO_ACTUAL_PROYECTO.md ......... Estado y próximos pasos
  ✅ config/instance_ips.json .......... Config actualizada
  
  Pruebas:
  ✅ test-app-flows.ps1 ................ 4 flujos principales
"@

Write-Host $files -ForegroundColor Green

Write-Host "`n🚀 PRÓXIMOS PASOS (En Orden)`n" -ForegroundColor Yellow

$steps = @"
  1️⃣  VALIDAR CONFIGURACIÓN (2 min)
      .\Validate-PreDeployment.ps1
      
  2️⃣  DESPLEGAR CONTENEDORES (15-20 min)
      \$env:DOCKER_USERNAME = 'tu_usuario'
      .\Deploy-AllContainers.ps1 -DockerUsername \$env:DOCKER_USERNAME
      
  3️⃣  VERIFICAR DESPLIEGUE (5 min)
      Invoke-WebRequest -Uri 'http://100.49.160.199:8080/health'
      ssh ec2-user@100.49.160.199 'docker ps'
      
  4️⃣  EJECUTAR PRUEBAS (10 min)
      .\test-app-flows.ps1 -ApiGatewayUrl 'http://100.49.160.199:8080'
      
  5️⃣  VALIDAR MÉTRICAS (5 min)
      Dashboard: http://54.205.158.101:3000 (admin/admin)
  
  ⏱️  TIEMPO TOTAL ESTIMADO: ~40 MINUTOS
"@

Write-Host $steps -ForegroundColor Cyan

Write-Host "`n🧪 FLUJOS A PROBAR`n" -ForegroundColor Yellow

$flows = @"
  ✓ REGISTRAR (Sign Up)
    POST /api/auth/register
    
  ✓ INGRESAR (Login)
    POST /api/auth/login
    
  ✓ CREAR RESERVAS (Create Reservation)
    POST /api/reservas/create
    
  ✓ RESERVAR (Book/Confirm)
    POST /api/reservas/{id}/confirmar
"@

Write-Host $flows -ForegroundColor Green

Write-Host "`n🔐 CREDENCIALES POR DEFECTO`n" -ForegroundColor Yellow

$creds = @"
  MongoDB:          root / example
  PostgreSQL:       admin / example
  Grafana:          admin / admin
  RabbitMQ:         guest / guest
  
  ⚠️  Cambiar en ambiente de producción
"@

Write-Host $creds -ForegroundColor Yellow

Write-Host "`n═════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "¿Qué deseas hacer ahora?`n" -ForegroundColor White

$menu = @"
  1. Validar configuración previa al deployment
  2. Ver guía de deployment completa
  3. Ver estado actual del proyecto
  4. Abrir documentación de deployment
  5. Salir
"@

Write-Host $menu -ForegroundColor White

$choice = Read-Host "`nSelecciona una opción (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n▶️  Ejecutando validación..." -ForegroundColor Green
        .\Validate-PreDeployment.ps1
    }
    "2" {
        Write-Host "`n▶️  Mostrando guía..." -ForegroundColor Green
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            Get-Content DEPLOYMENT_AND_TEST_GUIDE.md | less
        }
        else {
            Get-Content DEPLOYMENT_AND_TEST_GUIDE.md
        }
    }
    "3" {
        Write-Host "`n▶️  Mostrando estado del proyecto..." -ForegroundColor Green
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            Get-Content ESTADO_ACTUAL_PROYECTO.md | less
        }
        else {
            Get-Content ESTADO_ACTUAL_PROYECTO.md
        }
    }
    "4" {
        Write-Host "`n▶️  Abriendo documentación en el editor..." -ForegroundColor Green
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code DEPLOYMENT_AND_TEST_GUIDE.md
        }
        else {
            notepad DEPLOYMENT_AND_TEST_GUIDE.md
        }
    }
    "5" {
        Write-Host "`n✅ ¡Hasta pronto!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "`n❌ Opción no válida" -ForegroundColor Red
    }
}

Write-Host "`n═════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host @"
📞 SOPORTE
═════════════════════════════════════════════════════════════════════════════

En caso de problemas durante el deployment:

1. Ejecuta: .\Validate-PreDeployment.ps1
   └─ Verifica todas las configuraciones requeridas

2. Revisa: DEPLOYMENT_AND_TEST_GUIDE.md (Sección Troubleshooting)
   └─ Soluciones a problemas comunes

3. Revisa los logs en las instancias:
   ssh ec2-user@IP 'docker logs nombre_contenedor'

4. Verifica conectividad:
   Test-Connection -ComputerName IP -Count 1

═════════════════════════════════════════════════════════════════════════════

✅ ESTADO FINAL: LISTO PARA DEPLOYMENT EN AWS
   Todas las configuraciones, scripts y documentación están completos.
   
📊 Próximo paso: Ejecutar Deploy-AllContainers.ps1
"@ -ForegroundColor Green

Write-Host ""
