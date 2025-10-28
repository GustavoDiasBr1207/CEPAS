#!/bin/bash
# Monitor de uso de RAM para Sistema CEPAS
# Atualiza a cada 5 segundos

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para obter uso de RAM em %
get_ram_usage() {
    free | grep Mem | awk '{print int($3/$2 * 100)}'
}

# Função para limpar tela de forma compatível
clear_screen() {
    printf "\033c"
}

# Loop infinito de monitoramento
while true; do
    clear_screen
    
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          📊 Monitor de RAM - Sistema CEPAS                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🕐 $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # Memória total do sistema
    echo -e "${BLUE}━━━ 💾 Memória do Sistema ━━━${NC}"
    free -h | grep -E "Mem|Swap" | awk '{
        if ($1 == "Mem:") {
            printf "   RAM    Total: %-8s Usado: %-8s Livre: %-8s Disponível: %-8s\n", $2, $3, $4, $7
        } else if ($1 == "Swap:") {
            printf "   SWAP   Total: %-8s Usado: %-8s Livre: %-8s\n", $2, $3, $4
        }
    }'
    echo ""
    
    # Processos Node.js
    echo -e "${BLUE}━━━ 🚀 Processos Node.js ━━━${NC}"
    NODE_PROCESSES=$(ps aux | grep -E "node|npm" | grep -v grep | grep -v "monitor-ram")
    if [ -z "$NODE_PROCESSES" ]; then
        echo "   Nenhum processo Node.js encontrado"
    else
        echo "$NODE_PROCESSES" | awk '{
            printf "   %-10s PID: %-8s RAM: %-8s CPU: %-6s CMD: %s\n", 
                   $1, $2, sprintf("%.1f MB", $6/1024), $3"%", substr($0, index($0,$11))
        }'
    fi
    echo ""
    
    # Top 5 processos por memória
    echo -e "${BLUE}━━━ 📈 Top 5 Processos (Uso de RAM) ━━━${NC}"
    ps aux --sort=-%mem | head -6 | tail -5 | awk '{
        printf "   %-20s RAM: %-8s CPU: %-6s PID: %s\n", 
               $11, sprintf("%.1f MB", $6/1024), $3"%", $2
    }'
    echo ""
    
    # Alertas de uso de RAM
    USED_PERCENT=$(get_ram_usage)
    echo -e "${BLUE}━━━ ⚡ Status do Sistema ━━━${NC}"
    
    if [ $USED_PERCENT -gt 90 ]; then
        echo -e "   ${RED}⚠️  ALERTA CRÍTICO: Uso de RAM em ${USED_PERCENT}%!${NC}"
        echo -e "   ${YELLOW}   Recomendação: Reinicie o backend urgentemente${NC}"
    elif [ $USED_PERCENT -gt 80 ]; then
        echo -e "   ${YELLOW}⚠️  ATENÇÃO: Uso de RAM em ${USED_PERCENT}%${NC}"
        echo -e "   ${YELLOW}   Recomendação: Monitore de perto${NC}"
    elif [ $USED_PERCENT -gt 70 ]; then
        echo -e "   ${YELLOW}⚡ Uso de RAM: ${USED_PERCENT}% (Moderado)${NC}"
    else
        echo -e "   ${GREEN}✅ Uso de RAM: ${USED_PERCENT}% (Normal)${NC}"
    fi
    
    # Verificar se backend está rodando
    if pgrep -f "node.*server.js" > /dev/null; then
        echo -e "   ${GREEN}✅ Backend: Rodando${NC}"
    else
        echo -e "   ${RED}❌ Backend: Parado${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Pressione Ctrl+C para sair | Atualizando a cada 5s...${NC}"
    
    # Aguardar 5 segundos
    sleep 5
done
