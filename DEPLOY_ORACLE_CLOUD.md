# 🚀 Guia de Deploy - Oracle Cloud Always Free (1GB RAM)

## 📋 Resumo das Otimizações

O projeto CEPAS foi otimizado para rodar em VMs com apenas 1GB de RAM:

### ✅ Otimizações Implementadas:

1. **Pool de Conexões Oracle**: Reduzido de 10→3 conexões máximas
2. **Statement Cache**: Reduzido de 30→10 statements  
3. **Compressão HTTP**: Ativada para reduzir tráfego
4. **Limite de Payload**: 2MB máximo por requisição
5. **Conexões Simultâneas**: Limitado a 50 conexões
6. **Timeout**: 30s para requisições longas
7. **Node.js Heap**: Limitado a 256MB
8. **Graceful Shutdown**: Libera recursos corretamente

### 📊 Uso Esperado de RAM:
- **Backend Node.js**: ~150-200MB
- **Oracle Instant Client**: ~50-80MB  
- **Sistema Operacional**: ~300-400MB
- **Buffer/Cache**: ~200-300MB
- **Total**: ~700-900MB (deixa ~100MB de folga)

---

## 🔧 Preparar VM Oracle Cloud (Primeira Vez)

### 1. Conectar via SSH
```bash
ssh -i sua-chave.pem opc@SEU_IP_PUBLICO
```

### 2. Instalar Node.js 18 LTS
```bash
# Atualizar sistema
sudo yum update -y

# Adicionar repositório NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Instalar Node.js
sudo yum install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar PM2 (Gerenciador de Processos)
```bash
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

### 4. Criar diretório do projeto
```bash
mkdir -p ~/cepas
cd ~/cepas
```

### 5. Configurar Firewall
```bash
# Liberar porta 3001 (backend)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-all
```

### 6. Configurar Swap (Aumentar memória virtual)
```bash
# Criar arquivo swap de 1GB
sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configurar swappiness (menos agressivo)
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verificar
free -h
```

---

## 📦 Transferir Projeto para VM

### Opção 1: Via SCP (da sua máquina local)
```bash
# Transferir diretório backend
scp -i sua-chave.pem -r ./backend opc@SEU_IP_PUBLICO:~/cepas/

# Transferir scripts
scp -i sua-chave.pem deploy-always-free.sh opc@SEU_IP_PUBLICO:~/cepas/
scp -i sua-chave.pem monitor-ram.sh opc@SEU_IP_PUBLICO:~/cepas/
scp -i sua-chave.pem ecosystem.config.js opc@SEU_IP_PUBLICO:~/cepas/

# Transferir arquivo de ambiente (edite antes!)
scp -i sua-chave.pem .env.example opc@SEU_IP_PUBLICO:~/cepas/backend/.env
```

### Opção 2: Via Git (recomendado)
```bash
# Na VM
cd ~/cepas
git clone https://github.com/GustavoDiasBr1207/CEPAS.git .

# Trocar para branch otimizada
git checkout dockadolinux-otimizado
```

---

## 🚀 Deploy do Backend

### Método 1: Script Automatizado (Recomendado para Teste)

```bash
cd ~/cepas
./deploy-always-free.sh
```

Esse script:
- Para processos anteriores
- Limpa cache do npm
- Instala dependências otimizadas
- Inicia o backend com limitações de RAM
- Mostra uso de memória

### Método 2: PM2 (Recomendado para Produção)

```bash
cd ~/cepas

# Instalar dependências
cd backend
npm install --production
cd ..

# Copiar arquivo de configuração (edite antes!)
cp .env.example backend/.env
nano backend/.env  # Editar credenciais

# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Ver status
pm2 status

# Ver logs
pm2 logs cepas-backend

# Monitorar em tempo real
pm2 monit
```

### Configurar PM2 para iniciar no boot
```bash
# Gerar script de startup
pm2 startup

# Copie e execute o comando que aparecer, exemplo:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# Salvar configuração atual
pm2 save
```

---

## 📊 Monitoramento

### Monitor de RAM (Script Customizado)
```bash
./monitor-ram.sh
```

Mostra em tempo real:
- Memória do sistema (RAM/SWAP)
- Processos Node.js
- Top 5 processos por RAM
- Alertas de uso crítico

### Comandos PM2
```bash
# Status dos processos
pm2 status

# Logs em tempo real
pm2 logs cepas-backend

# Monitor interativo (CPU/RAM)
pm2 monit

# Reiniciar
pm2 restart cepas-backend

# Parar
pm2 stop cepas-backend

# Deletar
pm2 delete cepas-backend
```

### Comandos do Sistema
```bash
# Ver uso de RAM
free -h

# Ver processos por memória
ps aux --sort=-%mem | head -10

# Ver processos Node.js
ps aux | grep node

# Uso de disco
df -h

# Monitor interativo
htop  # ou top
```

---

## 🛑 Gerenciamento do Backend

### Parar Backend

**Com script:**
```bash
kill $(cat logs/backend.pid)
```

**Com PM2:**
```bash
pm2 stop cepas-backend
```

**Manualmente:**
```bash
pkill -f "node.*server.js"
```

### Reiniciar Backend

**Com PM2:**
```bash
pm2 restart cepas-backend
```

**Manualmente:**
```bash
pkill -f "node.*server.js"
./deploy-always-free.sh
```

### Ver Logs

**Script:**
```bash
tail -f logs/backend.log
```

**PM2:**
```bash
pm2 logs cepas-backend
```

---

## 🔍 Troubleshooting

### Backend não inicia

1. **Ver logs completos:**
```bash
cat logs/backend.log
# ou
pm2 logs cepas-backend --lines 100
```

2. **Verificar porta em uso:**
```bash
sudo netstat -tulpn | grep :3001
```

3. **Verificar memória disponível:**
```bash
free -h
```

4. **Limpar processos órfãos:**
```bash
pkill -f node
pm2 kill
```

### Erro: "Cannot find module 'compression'"

```bash
cd ~/cepas/backend
npm install compression --save
```

### Erro: Sem memória disponível

1. **Verificar swap:**
```bash
free -h
sudo swapon --show
```

2. **Limpar cache do sistema:**
```bash
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

3. **Reiniciar backend:**
```bash
pm2 restart cepas-backend
```

### Erro: Conexão com Oracle falha

1. **Verificar credenciais em `.env`:**
```bash
nano ~/cepas/backend/.env
```

2. **Testar conexão:**
```bash
cd ~/cepas/backend
node testOracle.js
```

3. **Verificar wallet Oracle:**
```bash
ls -la ~/cepas/backend/wallet/
```

### Performance lenta

1. **Verificar uso de CPU/RAM:**
```bash
./monitor-ram.sh
# ou
pm2 monit
```

2. **Ver processos pesados:**
```bash
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

3. **Reiniciar com limites mais baixos:**
```bash
pm2 restart cepas-backend --update-env
```

---

## 🔐 Segurança (Importante!)

### 1. Trocar JWT_SECRET
```bash
nano ~/cepas/backend/.env

# Gerar secret aleatório:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Configurar senha do banco
```bash
nano ~/cepas/backend/.env
# Editar DB_PASSWORD
```

### 3. Firewall - Liberar apenas portas necessárias
```bash
# Ver regras atuais
sudo firewall-cmd --list-all

# Remover portas desnecessárias
sudo firewall-cmd --permanent --remove-port=PORTA/tcp
sudo firewall-cmd --reload
```

### 4. Manter sistema atualizado
```bash
sudo yum update -y
```

---

## 📈 Otimizações Adicionais (Se Necessário)

### Se ainda estiver com pouca memória:

1. **Reduzir pool ainda mais:**
```bash
nano ~/cepas/backend/dbConfig.js
# Mudar poolMax para 2
```

2. **Reduzir heap do Node.js:**
```bash
nano ~/cepas/ecosystem.config.js
# Mudar max_memory_restart para '200M'
# Mudar NODE_OPTIONS para '--max-old-space-size=200'
```

3. **Desabilitar logs em produção:**
```bash
nano ~/cepas/ecosystem.config.js
# Adicionar: log: false
```

---

## 📝 Comandos Rápidos

```bash
# Deploy completo
cd ~/cepas && ./deploy-always-free.sh

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Ver status
pm2 status

# Logs
pm2 logs cepas-backend

# Monitor
./monitor-ram.sh

# Reiniciar
pm2 restart cepas-backend

# Parar
pm2 stop cepas-backend

# Ver uso de RAM
free -h
```

---

## 🆘 Suporte

Se continuar com problemas:

1. Verifique logs: `pm2 logs cepas-backend`
2. Verifique memória: `./monitor-ram.sh`
3. Teste conexão Oracle: `node backend/testOracle.js`
4. Verifique portas: `sudo netstat -tulpn | grep 3001`

---

✅ **Projeto otimizado e pronto para Oracle Cloud Always Free (1GB RAM)!**
