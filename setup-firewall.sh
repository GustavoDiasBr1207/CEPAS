#!/bin/bash
# Script para configurar firewall e expor serviço publicamente
# Oracle Cloud Always Free - Sistema CEPAS
# Data: 2025-10-27

set -e

echo "🔒 Configuração de Firewall - Oracle Cloud"
echo "=========================================="
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

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado com sudo"
    echo "Use: sudo ./setup-firewall.sh"
    exit 1
fi

echo "📋 Este script irá:"
echo "   1. Configurar firewall do sistema (firewalld/iptables)"
echo "   2. Liberar portas HTTP (80) e Backend (3001)"
echo "   3. Configurar regras permanentes"
echo ""
read -p "Continuar? [S/n]: " confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    echo "Operação cancelada"
    exit 0
fi

echo ""
echo "🔧 Configurando firewall do sistema..."

# Detectar qual firewall está ativo
if systemctl is-active --quiet firewalld; then
    FIREWALL="firewalld"
    log_info "Detectado: firewalld"
elif command -v iptables &> /dev/null; then
    FIREWALL="iptables"
    log_info "Detectado: iptables"
else
    log_error "Nenhum firewall detectado"
    exit 1
fi

# Configurar firewalld
if [ "$FIREWALL" = "firewalld" ]; then
    echo ""
    echo "🔥 Configurando firewalld..."
    
    # Liberar porta 80 (HTTP - Frontend)
    firewall-cmd --permanent --add-port=80/tcp
    log_info "Porta 80 (HTTP) liberada"
    
    # Liberar porta 3001 (Backend API)
    firewall-cmd --permanent --add-port=3001/tcp
    log_info "Porta 3001 (Backend API) liberada"
    
    # Liberar porta 1521 (Oracle - opcional, apenas se quiser acesso externo ao DB)
    read -p "Liberar porta 1521 (Oracle Database)? [s/N]: " oracle_port
    if [[ $oracle_port =~ ^[Ss]$ ]]; then
        firewall-cmd --permanent --add-port=1521/tcp
        log_info "Porta 1521 (Oracle) liberada"
    else
        log_warn "Porta 1521 NÃO liberada (recomendado)"
    fi
    
    # Recarregar firewall
    firewall-cmd --reload
    log_info "Firewall recarregado"
    
    # Mostrar portas abertas
    echo ""
    echo "📊 Portas abertas:"
    firewall-cmd --list-ports
fi

# Configurar iptables
if [ "$FIREWALL" = "iptables" ]; then
    echo ""
    echo "🔥 Configurando iptables..."
    
    # Liberar porta 80
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    log_info "Porta 80 (HTTP) liberada"
    
    # Liberar porta 3001
    iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
    log_info "Porta 3001 (Backend API) liberada"
    
    # Salvar regras
    if command -v iptables-save &> /dev/null; then
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
        iptables-save > /etc/sysconfig/iptables 2>/dev/null
        log_info "Regras salvas permanentemente"
    fi
fi

# Verificar SELinux
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    echo ""
    echo "🛡️  SELinux Status: $SELINUX_STATUS"
    
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        log_warn "SELinux está ativo em modo Enforcing"
        echo ""
        echo "Para permitir que Docker use as portas, execute:"
        echo "  sudo semanage port -a -t http_port_t -p tcp 3001"
        echo "  sudo setsebool -P httpd_can_network_connect 1"
        echo ""
        read -p "Configurar SELinux agora? [s/N]: " selinux_config
        if [[ $selinux_config =~ ^[Ss]$ ]]; then
            if command -v semanage &> /dev/null; then
                semanage port -a -t http_port_t -p tcp 3001 2>/dev/null || \
                semanage port -m -t http_port_t -p tcp 3001
                setsebool -P httpd_can_network_connect 1
                log_info "SELinux configurado"
            else
                log_warn "Instale policycoreutils-python-utils primeiro"
                echo "  sudo yum install -y policycoreutils-python-utils"
            fi
        fi
    fi
fi

echo ""
echo "✅ Configuração do firewall concluída!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info_blue "Próximos passos:"
echo ""
echo "1️⃣  Configure o Security List na Oracle Cloud Console:"
echo "   - Acesse: Networking > Virtual Cloud Networks"
echo "   - Selecione sua VCN > Security Lists"
echo "   - Adicione Ingress Rules:"
echo "     • Porta 80 (TCP) - Source: 0.0.0.0/0"
echo "     • Porta 3001 (TCP) - Source: 0.0.0.0/0"
echo ""
echo "2️⃣  Obtenha seu IP público:"
echo "   curl ifconfig.me"
echo ""
echo "3️⃣  Configure o deploy com IP público:"
echo "   export PUBLIC_IP=\$(curl -s ifconfig.me)"
echo "   docker compose -f docker-compose.oracle-cloud.yml up -d"
echo ""
echo "📚 Veja o guia completo: ACESSO_PUBLICO.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
