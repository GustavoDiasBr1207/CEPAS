#!/bin/bash
# Script de deploy Docker otimizado para Oracle Cloud Always Free (1GB RAM)
# Autor: Sistema CEPAS
# Data: 2025-10-27

set -e

echo "🚀 Deploy CEPAS Docker - Oracle Cloud Always Free"
echo "=================================================="
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

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado! Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose não encontrado! Instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado!"
    log_error "Execute este script a partir do diretório raiz do projeto CEPAS"
    exit 1
fi

# Escolher versão do docker-compose
echo "Escolha a versão do Docker Compose:"
echo "1) Padrão (docker-compose.yml)"
echo "2) Oracle Cloud Otimizado (docker-compose.oracle-cloud.yml)"
read -p "Opção [1-2]: " choice

case $choice in
    2)
        COMPOSE_FILE="docker-compose.oracle-cloud.yml"
        log_info "Usando configuração otimizada para Oracle Cloud"
        ;;
    *)
        COMPOSE_FILE="docker-compose.yml"
        log_info "Usando configuração padrão"
        ;;
esac

# Mostrar uso de memória atual
echo ""
echo "📊 Memória atual do sistema:"
free -h | grep -E "Mem|Swap"
echo ""

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || true
log_info "Containers parados"

# Limpar recursos não utilizados
echo "🧹 Limpando recursos Docker não utilizados..."
docker system prune -f --volumes 2>/dev/null || true
log_info "Limpeza concluída"

# Criar diretório de dados se não existir (para oracle-cloud.yml)
if [ "$COMPOSE_FILE" == "docker-compose.oracle-cloud.yml" ]; then
    mkdir -p ./data/oracle
    log_info "Diretório de dados criado"
fi

# Rebuild apenas se necessário
read -p "Rebuild das imagens? [s/N]: " rebuild
if [[ $rebuild =~ ^[Ss]$ ]]; then
    echo "🔨 Rebuilding imagens..."
    docker compose -f $COMPOSE_FILE build --no-cache
    log_info "Build concluído"
fi

# Iniciar containers
echo ""
echo "🚀 Iniciando containers otimizados..."
docker compose -f $COMPOSE_FILE up -d

# Aguardar containers iniciarem
echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker compose -f $COMPOSE_FILE ps

# Verificar logs do backend
echo ""
echo "📋 Últimas linhas do log do backend:"
docker compose -f $COMPOSE_FILE logs --tail=20 backend

# Verificar uso de memória dos containers
echo ""
echo "📊 Uso de memória dos containers:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"

# Verificar saúde dos serviços
echo ""
echo "🏥 Verificando saúde dos serviços..."
sleep 5

# Backend
if docker compose -f $COMPOSE_FILE exec -T backend curl -f http://localhost:3001/api/ping 2>/dev/null; then
    log_info "Backend: Respondendo"
else
    log_warn "Backend: Não respondeu ao health check"
fi

# Frontend
if docker compose -f $COMPOSE_FILE exec -T frontend wget --spider -q http://localhost:80 2>/dev/null; then
    log_info "Frontend: Respondendo"
else
    log_warn "Frontend: Não respondeu ao health check"
fi

echo ""
echo "✅ Deploy concluído!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info_blue "🔗 Frontend: http://localhost"
log_info_blue "🔗 Backend: http://localhost:3001"
log_info_blue "📊 Monitorar logs: docker compose -f $COMPOSE_FILE logs -f"
log_info_blue "📊 Monitor RAM: ./monitor-ram-docker.sh"
log_info_blue "🛑 Parar: docker compose -f $COMPOSE_FILE down"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
