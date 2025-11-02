#!/bin/bash

# Deploy CEPAS com Oracle Autonomous Database (GRÁTIS)
# Este script configura o projeto para usar o banco gerenciado pela Oracle

echo "🚀 Deploy CEPAS - Oracle Autonomous Database (Always Free)"
echo "=========================================================="
echo ""

# Etapa 1: Obter IP público
echo "📍 Etapa 1/4: Obtendo IP público..."
PUBLIC_IP=$(curl -s ifconfig.me)
if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Erro: Não foi possível obter o IP público"
    exit 1
fi
echo "✅ IP público detectado: $PUBLIC_IP"
echo ""

# Etapa 2: Configurar firewall
echo "🔒 Etapa 2/4: Configurando firewall..."
echo "⚠️  Será necessário sudo para configurar o firewall"
sudo ./setup-firewall.sh
echo ""

# Etapa 3: Parar containers antigos
echo "🧹 Etapa 3/4: Parando containers antigos..."
docker compose -f docker-compose.autonomous.yml down 2>/dev/null || true
docker compose -f docker-compose.oracle-cloud.yml down 2>/dev/null || true
docker compose down 2>/dev/null || true

# Limpar build cache
echo "🗑️  Limpando build cache..."
docker builder prune -f
echo "✅ Limpeza concluída"
echo ""

# Etapa 4: Build e start
echo "🔨 Etapa 4/4: Building e iniciando containers..."
echo "ℹ️  Usando Oracle Autonomous Database (sem container Oracle local)"
echo "ℹ️  Isso pode levar alguns minutos..."
echo ""

PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.autonomous.yml up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Acessos:"
    echo "   Frontend: http://$PUBLIC_IP"
    echo "   Backend:  http://$PUBLIC_IP:3001"
    echo "   API Ping: http://$PUBLIC_IP:3001/api/ping"
    echo ""
    echo "📊 Monitorar recursos:"
    echo "   ./monitor-ram-docker.sh"
    echo ""
    echo "📋 Ver logs:"
    echo "   docker compose -f docker-compose.autonomous.yml logs -f"
    echo ""
    echo "🔍 Status dos containers:"
    docker compose -f docker-compose.autonomous.yml ps
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   1. Verifique se as credenciais do banco estão corretas"
    echo "   2. Confirme que a wallet está no diretório backend/wallet/"
    echo "   3. O DB_CONNECT_STRING está configurado (cepasdb_high)"
    echo ""
else
    echo "❌ Erro durante o deploy"
    echo "📋 Veja os logs com: docker compose -f docker-compose.autonomous.yml logs"
    exit 1
fi
