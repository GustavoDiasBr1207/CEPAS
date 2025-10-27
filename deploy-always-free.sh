#!/bin/bash
# Script de deploy otimizado para Oracle Cloud Always Free (1GB RAM)
# Autor: Sistema CEPAS
# Data: 2025-10-27

set -e  # Sair em caso de erro

echo "🚀 Deploy CEPAS - Oracle Cloud Always Free"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log com cores
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar se está no diretório correto
if [ ! -f "backend/server.js" ]; then
    log_error "Arquivo backend/server.js não encontrado!"
    log_error "Execute este script a partir do diretório raiz do projeto CEPAS"
    exit 1
fi

# 2. Parar processos existentes
echo "📌 Parando processos anteriores..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
sleep 2
log_info "Processos anteriores finalizados"

# 3. Limpar cache para liberar RAM
echo "🧹 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true
log_info "Cache limpo"

# 4. Criar diretório de logs se não existir
mkdir -p logs
log_info "Diretório de logs criado/verificado"

# 5. Instalar dependências do backend (sem devDependencies)
echo "📦 Instalando dependências do backend..."
cd backend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado em backend/"
    exit 1
fi

# Instalar apenas dependências de produção
npm install --production --no-optional --loglevel=error

# Verificar se compression foi instalado
if ! npm list compression >/dev/null 2>&1; then
    log_warn "Instalando compression..."
    npm install compression --save --loglevel=error
fi

cd ..
log_info "Dependências instaladas"

# 6. Verificar uso de memória antes de iniciar
echo ""
echo "📊 Memória disponível:"
free -h | grep -E "Mem|Swap"
echo ""

# 7. Iniciar backend em modo otimizado
echo "🚀 Iniciando backend em modo otimizado..."

# Definir variáveis de ambiente
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=256"

# Iniciar em background com nohup
nohup node backend/server.js > logs/backend.log 2>&1 &
BACKEND_PID=$!

log_info "Backend iniciado (PID: $BACKEND_PID)"

# 8. Aguardar backend estar pronto
echo "⏳ Aguardando backend inicializar..."
sleep 5

# 9. Verificar se está rodando
if ps -p $BACKEND_PID > /dev/null; then
    log_info "Backend rodando com sucesso!"
    echo ""
    echo "📊 Uso de memória do processo:"
    ps aux | grep "node.*server.js" | grep -v grep | awk '{print "   PID: " $2 " | RAM: " $6/1024 " MB | CPU: " $3"%"}'
else
    log_error "Erro ao iniciar backend!"
    echo ""
    echo "📋 Últimas 30 linhas do log:"
    tail -30 logs/backend.log
    exit 1
fi

# 10. Salvar PID para facilitar gerenciamento
echo $BACKEND_PID > logs/backend.pid
log_info "PID salvo em logs/backend.pid"

echo ""
echo "✅ Deploy concluído!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Backend: http://localhost:3001"
echo "📊 Monitorar logs: tail -f logs/backend.log"
echo "📊 Monitor RAM: ./monitor-ram.sh"
echo "🛑 Parar backend: kill \$(cat logs/backend.pid)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
