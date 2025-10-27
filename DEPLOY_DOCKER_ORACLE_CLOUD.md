# 🐳 Deploy Docker - Oracle Cloud Always Free (1GB RAM)

## 📋 Visão Geral

O projeto CEPAS foi otimizado para rodar em ambiente Docker com apenas **1GB de RAM**, perfeito para VMs Always Free da Oracle Cloud.

### ✅ Otimizações Aplicadas:

1. **Limites de Memória por Container:**
   - Oracle Database: 512MB (limite), 256MB (reserva)
   - Backend Node.js: 256MB (limite), 128MB (reserva)
   - Frontend Nginx: 128MB (limite), 64MB (reserva)

2. **Limites de CPU:**
   - Oracle: 0.5 CPUs
   - Backend: 0.3 CPUs
   - Frontend: 0.2 CPUs

3. **Pool de Conexões Oracle:**
   - Min: 1, Max: 3 (vs 10 anterior)
   - Timeout: 30s (vs 60s)

4. **Node.js Heap:**
   - Limitado a 200MB via NODE_OPTIONS

5. **Health Checks:**
   - Monitoramento automático de saúde
   - Restart automático em caso de falha

---

## 🚀 Deploy Rápido

### 1. Deploy Padrão (docker-compose.yml)

```bash
# Usar script automatizado
./deploy-docker.sh

# Ou manualmente
docker compose up -d --build
```

### 2. Deploy Oracle Cloud Otimizado (docker-compose.oracle-cloud.yml)

```bash
# Com script (escolha opção 2)
./deploy-docker.sh

# Ou manualmente
docker compose -f docker-compose.oracle-cloud.yml up -d --build
```

---

## 📦 Preparar VM Oracle Cloud

### 1. Instalar Docker

```bash
# Conectar via SSH
ssh -i sua-chave.pem opc@SEU_IP_PUBLICO

# Instalar Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 2. Configurar Firewall

```bash
# Liberar portas
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=1521/tcp
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-all
```

### 3. Configurar Swap

```bash
# Criar swap de 2GB (recomendado com Docker)
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configurar swappiness
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verificar
free -h
```

### 4. Otimizar Docker

```bash
# Criar arquivo de configuração Docker
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

# Reiniciar Docker
sudo systemctl restart docker
```

---

## 📤 Transferir Projeto para VM

### Opção 1: Via Git (Recomendado)

```bash
# Na VM
cd ~
git clone https://github.com/GustavoDiasBr1207/CEPAS.git
cd CEPAS
git checkout dockadolinux-otimizado
```

### Opção 2: Via SCP

```bash
# Na sua máquina local
tar czf cepas.tar.gz --exclude=node_modules --exclude=.git .
scp -i sua-chave.pem cepas.tar.gz opc@SEU_IP_PUBLICO:~/

# Na VM
cd ~
tar xzf cepas.tar.gz
rm cepas.tar.gz
```

---

## 🚀 Deploy na VM Oracle Cloud

### 1. Configurar Ambiente

```bash
cd ~/CEPAS

# Copiar e editar arquivo de ambiente
cp .env.example .env
nano .env

# Ajustar credenciais e URLs conforme necessário
```

### 2. Deploy com Script

```bash
# Tornar executável
chmod +x deploy-docker.sh

# Executar (escolha opção 2 para Oracle Cloud otimizado)
./deploy-docker.sh
```

### 3. Deploy Manual

```bash
# Build e start
docker compose -f docker-compose.oracle-cloud.yml up -d --build

# Verificar status
docker compose -f docker-compose.oracle-cloud.yml ps

# Ver logs
docker compose -f docker-compose.oracle-cloud.yml logs -f
```

---

## 📊 Monitoramento

### Monitor de RAM para Docker

```bash
# Executar monitor customizado
./monitor-ram-docker.sh
```

Mostra:
- Memória do sistema host
- Uso de RAM/CPU por container
- Status de cada serviço
- Alertas de uso crítico

### Comandos Docker Compose

```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f
docker compose logs -f backend
docker compose logs --tail=100 backend

# Ver uso de recursos
docker stats

# Reiniciar serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e remover volumes
docker compose down -v
```

### Health Checks

```bash
# Verificar saúde dos containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Inspecionar health
docker inspect --format='{{.State.Health.Status}}' cepas-backend
docker inspect --format='{{.State.Health.Status}}' cepas-oracle
docker inspect --format='{{.State.Health.Status}}' cepas-frontend
```

---

## 🛠️ Gerenciamento

### Iniciar

```bash
docker compose up -d
# ou
docker compose -f docker-compose.oracle-cloud.yml up -d
```

### Parar

```bash
docker compose down
```

### Reiniciar

```bash
# Todos os serviços
docker compose restart

# Apenas um serviço
docker compose restart backend
```

### Ver Logs

```bash
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f backend

# Últimas N linhas
docker compose logs --tail=50 backend
```

### Rebuild

```bash
# Rebuild sem cache
docker compose build --no-cache

# Rebuild e restart
docker compose up -d --build
```

### Limpar Recursos

```bash
# Limpar containers parados, imagens não usadas, etc
docker system prune -f

# Limpar volumes também
docker system prune -f --volumes

# Ver espaço usado
docker system df
```

---

## 🔍 Troubleshooting

### Backend não inicia

```bash
# Ver logs detalhados
docker compose logs backend

# Entrar no container
docker compose exec backend bash

# Verificar conectividade com Oracle
docker compose exec backend ping cepas-oracle
```

### Oracle Database não inicia

```bash
# Ver logs
docker compose logs oracle

# Verificar se tem memória suficiente
free -h

# Inspecionar container
docker inspect cepas-oracle
```

### Frontend não carrega

```bash
# Ver logs
docker compose logs frontend

# Testar nginx
docker compose exec frontend nginx -t

# Ver arquivos
docker compose exec frontend ls -la /usr/share/nginx/html
```

### Erro de memória (OOM)

```bash
# Ver uso atual
docker stats

# Verificar logs do sistema
sudo dmesg | grep -i "out of memory"

# Limpar recursos
docker system prune -f

# Reiniciar containers
docker compose restart
```

### Erro de conexão entre containers

```bash
# Verificar rede
docker network ls
docker network inspect cepas_cepas-network

# Testar conectividade
docker compose exec backend ping cepas-oracle
docker compose exec backend curl http://cepas-frontend:80
```

### Container reiniciando constantemente

```bash
# Ver logs
docker compose logs --tail=100 backend

# Ver política de restart
docker inspect --format='{{.HostConfig.RestartPolicy}}' cepas-backend

# Desabilitar restart temporariamente
docker update --restart=no cepas-backend
```

---

## 📈 Otimizações Adicionais

### Se ainda estiver com problemas de memória:

1. **Reduzir limites ainda mais:**

```yaml
# Editar docker-compose.oracle-cloud.yml
backend:
  mem_limit: 200m
  mem_reservation: 120m

oracle:
  mem_limit: 400m
  mem_reservation: 250m
```

2. **Desabilitar Oracle e usar banco externo:**

```yaml
# Comentar serviço oracle
# Usar Oracle Cloud Database diretamente
```

3. **Usar imagem Alpine para backend:**

```dockerfile
# Trocar em Dockerfile.backend
FROM node:18-alpine
```

---

## 🔐 Segurança em Produção

### 1. Trocar Senhas Padrão

```bash
# Editar docker-compose.oracle-cloud.yml
environment:
  - ORACLE_PASSWORD=SUA_SENHA_FORTE_AQUI
  - APP_USER_PASSWORD=OUTRA_SENHA_FORTE
```

### 2. Usar Secrets

```yaml
# docker-compose.oracle-cloud.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  backend:
    secrets:
      - db_password
```

### 3. Configurar HTTPS

```bash
# Usar nginx como reverse proxy com Let's Encrypt
# Ou usar Oracle Cloud Load Balancer
```

---

## 📊 Uso Esperado de Recursos

| Container | RAM Esperada | CPU Esperada |
|-----------|--------------|--------------|
| Oracle    | 300-450 MB   | 30-50%       |
| Backend   | 120-200 MB   | 10-20%       |
| Frontend  | 50-80 MB     | 5-10%        |
| **Total** | **~550-750 MB** | **~50-80%** |

Deixa ~250-450MB livres para o sistema operacional e cache.

---

## 🆘 Comandos de Emergência

```bash
# Parar tudo imediatamente
docker compose down --remove-orphans

# Reiniciar Docker
sudo systemctl restart docker

# Liberar memória
docker system prune -af --volumes
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Ver processos matando memória
sudo dmesg | grep -i kill

# Forçar restart de container travado
docker kill cepas-backend
docker compose up -d backend
```

---

✅ **Projeto otimizado e pronto para rodar em Docker com 1GB de RAM!**

📚 Veja também:
- `DEPLOY_ORACLE_CLOUD.md` - Deploy sem Docker
- `monitor-ram-docker.sh` - Monitor de RAM
- `deploy-docker.sh` - Script de deploy automatizado
