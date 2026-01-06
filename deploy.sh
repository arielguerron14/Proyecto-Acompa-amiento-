#!/bin/bash

# 🚀 Deployment Script para Proyecto Acompañamiento
# Uso: ./deploy.sh [check|deploy|status|logs]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
success() { echo -e "${GREEN}✅ $* ${NC}"; }
error() { echo -e "${RED}❌ $* ${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $* ${NC}"; }
info() { echo -e "${CYAN}ℹ️  $* ${NC}"; }

check_requirements() {
    info "Verificando requisitos..."
    
    # Check gh CLI
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI no instalado"
        info "Instala con: brew install gh (Mac) o apt-get install gh (Linux)"
        return 1
    fi
    success "GitHub CLI instalado"
    
    # Check authentication
    if ! gh auth status &> /dev/null; then
        error "No autenticado con GitHub"
        info "Ejecuta: gh auth login"
        return 1
    fi
    success "GitHub CLI autenticado"
    
    # Check SSH key in GitHub
    info "Verificando AWS_EC2_DB_SSH_PRIVATE_KEY secret..."
    if gh secret list --repo arielguerron14/Proyecto-Acompa-amiento- | grep -q AWS_EC2_DB_SSH_PRIVATE_KEY; then
        success "Secret AWS_EC2_DB_SSH_PRIVATE_KEY encontrado"
    else
        error "Secret AWS_EC2_DB_SSH_PRIVATE_KEY NO encontrado en GitHub"
        warning "Ve a Settings → Secrets and variables → Actions"
        warning "Crea nuevo secret: AWS_EC2_DB_SSH_PRIVATE_KEY"
        return 1
    fi
    
    return 0
}

deploy_all_services() {
    info "Ejecutando Deploy All Services..."
    
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  🚀 Iniciando Full Stack Deployment                ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    
    # Trigger workflow
    gh workflow run deploy-all-services.yml \
        --repo arielguerron14/Proyecto-Acompa-amiento- \
        -f skip_db=false \
        -f skip_messaging=false
    
    success "Workflow ejecutado exitosamente"
    info "Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
    echo ""
    warning "⏱️  Tiempo estimado: 45 minutos"
    echo ""
}

get_deployment_status() {
    info "Obteniendo estado del deployment..."
    
    echo ""
    gh run list \
        --repo arielguerron14/Proyecto-Acompa-amiento- \
        --workflow deploy-all-services.yml \
        --limit 1
    echo ""
}

open_logs() {
    info "Abriendo logs en el navegador..."
    
    if command -v open &> /dev/null; then
        # macOS
        open "https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
    else
        info "Ve manualmente a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
    fi
    success "Abriendo GitHub Actions..."
}

# Main
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🚀 DEPLOYMENT SCRIPT                      ║"
echo "║         Proyecto Acompañamiento - AWS EC2 Deploy           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ACTION=${1:-check}

case $ACTION in
    check)
        info "Ejecutando verificaciones..."
        echo ""
        
        if check_requirements; then
            echo ""
            success "✅ Todos los requisitos están OK"
            info "Puedes ejecutar: ./deploy.sh deploy"
            echo ""
        else
            echo ""
            error "❌ No se pueden cumplir los requisitos"
            info "Soluciona los problemas anteriores e intenta de nuevo"
            echo ""
            exit 1
        fi
        ;;
    
    deploy)
        if check_requirements; then
            echo ""
            warning "⚠️  Iniciando deployment de TODOS los servicios (45 min aprox)"
            echo ""
            
            read -p "¿Continuar? (s/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Ss]$ ]]; then
                info "Cancelado"
                exit 0
            fi
            
            echo ""
            deploy_all_services
            success "✅ Deployment iniciado"
            info "Monitorea el progreso en GitHub Actions"
            echo ""
        else
            exit 1
        fi
        ;;
    
    status)
        echo ""
        get_deployment_status
        success "✅ Status obtenido"
        ;;
    
    logs)
        echo ""
        open_logs
        success "✅ Abriendo logs"
        echo ""
        ;;
    
    *)
        error "Acción desconocida: $ACTION"
        info "Uso: $0 [check|deploy|status|logs]"
        exit 1
        ;;
esac

echo ""
