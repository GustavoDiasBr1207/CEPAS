#!/bin/bash
# Script de deploy completo para Oracle Cloud com IP público
# Sistema CEPAS - Deploy automatizado

set -e

echo "🚀 Deploy Completo CEPAS - Oracle Cloud (Acesso Público)"
echo "========================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info_blue() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "docker-compose.oracle-cloud.yml" ]; then
    log_error "docker-compose.oracle-cloud.yml não encontrado!"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado!"
    exit 1
fi

echo "📍 Etapa 1/5: Obtendo IP público..."
PUBLIC_IP=$(curl -s ifconfig.me)
if [ -z "$PUBLIC_IP" ]; then
    log_error "Não foi possível obter IP público"
    exit 1
fi
log_info "IP público detectado: $PUBLIC_IP"
export PUBLIC_IP

echo ""
echo "🔒 Etapa 2/5: Configurando firewall..."
if [ "$EUID" -eq 0 ]; then
    # Rodando como root
    ./setup-firewall.sh
else
    # Precisa de sudo
    log_warn "Será necessário sudo para configurar o firewall"
    sudo ./setup-firewall.sh
fi

echo ""
echo "🧹 Etapa 3/5: Limpando recursos antigos..."
docker compose -f docker-compose.oracle-cloud.yml down 2>/dev/null || true
docker system prune -f
log_info "Limpeza concluída"

echo ""
echo "🔨 Etapa 4/5: Building e iniciando containers..."
log_info_blue "Isso pode levar alguns minutos..."

PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d --build

echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 15

# Verificar status
echo ""
echo "📊 Etapa 5/5: Verificando serviços..."

# Backend
if docker compose -f docker-compose.oracle-cloud.yml exec -T backend curl -f http://localhost:3001/api/ping 2>/dev/null | grep -q "ok"; then
    log_info "Backend: Funcionando"
else
    log_warn "Backend: Ainda inicializando ou com problemas"
fi

# Frontend
if docker compose -f docker-compose.oracle-cloud.yml exec -T frontend wget --spider -q http://localhost:80 2>/dev/null; then
    log_info "Frontend: Funcionando"
else
    log_warn "Frontend: Ainda inicializando ou com problemas"
fi

# Oracle
if docker compose -f docker-compose.oracle-cloud.yml ps oracle | grep -q "Up"; then
    log_info "Oracle: Rodando"
else
    log_warn "Oracle: Iniciando (pode levar até 60s)"
fi

echo ""
echo "📊 Status dos containers:"
docker compose -f docker-compose.oracle-cloud.yml ps

echo ""
echo "💾 Uso de memória:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"

echo ""
echo "✅ Deploy concluído!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info_blue "🌐 Seu sistema está acessível em:"
echo ""
echo "   Frontend:      http://$PUBLIC_IP"
echo "   Backend API:   http://$PUBLIC_IP:3001"
echo "   Health Check:  http://$PUBLIC_IP:3001/api/ping"
echo ""
log_info_blue "📋 Comandos úteis:"
echo "   Ver logs:      docker compose -f docker-compose.oracle-cloud.yml logs -f"
echo "   Monitor RAM:   ./monitor-ram-docker.sh"
echo "   Parar tudo:    docker compose -f docker-compose.oracle-cloud.yml down"
echo "   Reiniciar:     docker compose -f docker-compose.oracle-cloud.yml restart"
echo ""
log_warn "⚠️  IMPORTANTE: Configure o Security List na Oracle Cloud Console!"
echo "   Veja instruções em: ACESSO_PUBLICO.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Testar acesso externo
echo ""
read -p "Testar acesso externo agora? [S/n]: " test_access
if [[ ! $test_access =~ ^[Nn]$ ]]; then
    echo ""
    echo "🔍 Testando acesso externo..."
    
    if curl -s -m 5 http://$PUBLIC_IP:3001/api/ping | grep -q "ok"; then
        log_info "✅ Backend acessível externamente!"
    else
        log_warn "⚠️  Backend não acessível externamente"
        echo "   Verifique o Security List na Oracle Cloud Console"
        echo "   Veja: ACESSO_PUBLICO.md"
    fi
    
    if curl -s -m 5 -I http://$PUBLIC_IP | grep -q "200\|301\|302"; then
        log_info "✅ Frontend acessível externamente!"
    else
        log_warn "⚠️  Frontend não acessível externamente"
        echo "   Verifique o Security List na Oracle Cloud Console"
    fi
fi

echo ""
log_info "Deploy finalizado! 🎉"
