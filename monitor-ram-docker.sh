#!/bin/bash
# Monitor de RAM para containers Docker - Sistema CEPAS

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para obter uso de RAM em %
get_ram_usage() {
    free | grep Mem | awk '{print int($3/$2 * 100)}'
}

# Função para limpar tela
clear_screen() {
    printf "\033c"
}

# Loop infinito de monitoramento
while true; do
    clear_screen
    
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     📊 Monitor de RAM Docker - Sistema CEPAS                         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🕐 $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # Memória do sistema
    echo -e "${BLUE}━━━ 💾 Memória do Sistema Host ━━━${NC}"
    free -h | grep -E "Mem|Swap" | awk '{
        if ($1 == "Mem:") {
            printf "   RAM    Total: %-8s Usado: %-8s Livre: %-8s Disponível: %-8s\n", $2, $3, $4, $7
        } else if ($1 == "Swap:") {
            printf "   SWAP   Total: %-8s Usado: %-8s Livre: %-8s\n", $2, $3, $4
        }
    }'
    echo ""
    
    # Containers Docker
    echo -e "${BLUE}━━━ 🐳 Containers Docker ━━━${NC}"
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "cepas"; then
        docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}" | grep -E "CONTAINER|cepas"
    else
        echo "   Nenhum container CEPAS rodando"
    fi
    echo ""
    
    # Detalhes dos containers
    echo -e "${BLUE}━━━ 📊 Detalhes dos Containers CEPAS ━━━${NC}"
    
    # Backend
    if docker ps | grep -q "cepas-backend"; then
        BACKEND_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" cepas-backend 2>/dev/null)
        BACKEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" cepas-backend 2>/dev/null)
        echo -e "   ${GREEN}✅ Backend:${NC}  RAM: $BACKEND_MEM | CPU: $BACKEND_CPU"
    else
        echo -e "   ${RED}❌ Backend:${NC}  Parado"
    fi
    
    # Oracle
    if docker ps | grep -q "cepas-oracle"; then
        ORACLE_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" cepas-oracle 2>/dev/null)
        ORACLE_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" cepas-oracle 2>/dev/null)
        echo -e "   ${GREEN}✅ Oracle:${NC}   RAM: $ORACLE_MEM | CPU: $ORACLE_CPU"
    else
        echo -e "   ${RED}❌ Oracle:${NC}   Parado"
    fi
    
    # Frontend
    if docker ps | grep -q "cepas-frontend"; then
        FRONTEND_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" cepas-frontend 2>/dev/null)
        FRONTEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" cepas-frontend 2>/dev/null)
        echo -e "   ${GREEN}✅ Frontend:${NC} RAM: $FRONTEND_MEM | CPU: $FRONTEND_CPU"
    else
        echo -e "   ${RED}❌ Frontend:${NC} Parado"
    fi
    echo ""
    
    # Total de memória Docker
    echo -e "${BLUE}━━━ 📈 Uso Total Docker ━━━${NC}"
    TOTAL_DOCKER=$(docker stats --no-stream --format "{{.MemUsage}}" | awk -F'/' '{sum+=$1} END {print sum}')
    echo "   Total usado pelos containers: $(echo $TOTAL_DOCKER | numfmt --to=iec 2>/dev/null || echo 'N/A')"
    echo ""
    
    # Alertas do sistema
    USED_PERCENT=$(get_ram_usage)
    echo -e "${BLUE}━━━ ⚡ Status do Sistema ━━━${NC}"
    
    if [ $USED_PERCENT -gt 90 ]; then
        echo -e "   ${RED}⚠️  ALERTA CRÍTICO: RAM em ${USED_PERCENT}%!${NC}"
        echo -e "   ${YELLOW}   Ação: docker compose restart backend${NC}"
    elif [ $USED_PERCENT -gt 80 ]; then
        echo -e "   ${YELLOW}⚠️  ATENÇÃO: RAM em ${USED_PERCENT}%${NC}"
        echo -e "   ${YELLOW}   Monitore de perto${NC}"
    elif [ $USED_PERCENT -gt 70 ]; then
        echo -e "   ${YELLOW}⚡ RAM: ${USED_PERCENT}% (Moderado)${NC}"
    else
        echo -e "   ${GREEN}✅ RAM: ${USED_PERCENT}% (Normal)${NC}"
    fi
    
    # Verificar containers rodando
    RUNNING_COUNT=$(docker ps --filter "name=cepas" --format "{{.Names}}" | wc -l)
    if [ $RUNNING_COUNT -eq 3 ]; then
        echo -e "   ${GREEN}✅ Todos os containers rodando (3/3)${NC}"
    elif [ $RUNNING_COUNT -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  Apenas $RUNNING_COUNT/3 containers rodando${NC}"
    else
        echo -e "   ${RED}❌ Nenhum container rodando${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Ctrl+C para sair | Atualizando a cada 5s${NC}"
    echo -e "${BLUE}Comandos úteis:${NC}"
    echo -e "  ${GREEN}docker compose logs -f${NC}           - Ver logs em tempo real"
    echo -e "  ${GREEN}docker compose restart backend${NC}   - Reiniciar backend"
    echo -e "  ${GREEN}docker system prune -f${NC}           - Limpar recursos não usados"
    
    sleep 5
done
