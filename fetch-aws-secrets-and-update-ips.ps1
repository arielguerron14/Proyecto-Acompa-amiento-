# Script para obtener secrets de GitHub y actualizar IPs localmente

Write-Host "🔐 Obteniendo secretos de AWS desde GitHub..." -ForegroundColor Cyan

# Obtener los secretos desde GitHub (requiere gh CLI y permisos)
try {
    # Nota: GitHub CLI no puede leer secretos directamente, 
    # pero puedes obtenerlos desde GitHub Actions o configurarlos manualmente
    
    Write-Host "`n⚠️  Para obtener los secretos desde GitHub:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions"
    Write-Host "2. Copia el valor de cada secret:"
    Write-Host "   - AWS_ACCESS_KEY_ID"
    Write-Host "   - AWS_SECRET_ACCESS_KEY"
    Write-Host "   - AWS_SESSION_TOKEN (si es necesario)"
    Write-Host ""
    Write-Host "3. O usa el workflow de GitHub directamente:" -ForegroundColor Green
    Write-Host "   gh workflow run update-ips.yml"
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
