# 🌐 Configuração de Acesso Público - Oracle Cloud

## 📋 Visão Geral

Este guia mostra como configurar seu projeto CEPAS **dockerizado** para ser acessível pela Internet através do IP público da sua VM Oracle Cloud Always Free.

### ✅ O que foi configurado automaticamente:

1. **Backend (server.js)**: CORS dinâmico que aceita requisições do IP público
2. **Docker Compose**: Variável `PUBLIC_IP` configurável
3. **Frontend**: URL da API ajustada automaticamente para o IP público
4. **Script de Firewall**: Automação da configuração do sistema

---

## 🚀 Deploy Rápido (TL;DR)

```bash
# 1. Na VM Oracle Cloud
cd ~/CEPAS

# 2. Obter IP público
export PUBLIC_IP=$(curl -s ifconfig.me)
echo "Seu IP público: $PUBLIC_IP"

# 3. Configurar firewall do sistema
sudo ./setup-firewall.sh

# 4. Deploy com IP público
PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d --build

# 5. Testar acesso
curl http://$PUBLIC_IP
curl http://$PUBLIC_IP:3001/api/ping
```

**Pronto!** Acesse de qualquer lugar: `http://SEU_IP_PUBLICO`

---

## 📖 Guia Completo Passo a Passo

### 1️⃣ Configurar Security List na Oracle Cloud Console

O **Security List** é o firewall da Oracle Cloud. Você precisa liberar as portas na console web.

#### Passo a passo:

1. **Acesse o Oracle Cloud Console:**
   - https://cloud.oracle.com

2. **Navegue até VCN:**
   - Menu ☰ → **Networking** → **Virtual Cloud Networks**

3. **Selecione sua VCN:**
   - Clique na VCN onde sua VM está (geralmente `vcn-xxxxxx`)

4. **Acesse Security Lists:**
   - No menu lateral esquerdo, clique em **Security Lists**
   - Clique no Security List associado à sua subnet (geralmente `Default Security List`)

5. **Adicionar Ingress Rules:**
   - Clique em **Add Ingress Rules**
   - **Regra 1 - HTTP (Frontend):**
     ```
     Source Type: CIDR
     Source CIDR: 0.0.0.0/0
     IP Protocol: TCP
     Destination Port Range: 80
     Description: CEPAS Frontend HTTP
     ```
   - Clique em **+ Another Ingress Rule**
   - **Regra 2 - Backend API:**
     ```
     Source Type: CIDR
     Source CIDR: 0.0.0.0/0
     IP Protocol: TCP
     Destination Port Range: 3001
     Description: CEPAS Backend API
     ```
   - Clique em **Add Ingress Rules**

6. **Verificar regras:**
   - Você deve ver as duas novas regras na lista

**⚠️ IMPORTANTE:** 
- `0.0.0.0/0` significa "qualquer IP pode acessar"
- Para mais segurança, substitua por IPs específicos se souber de onde virá o acesso
- **NÃO libere a porta 1521 (Oracle DB)** publicamente por segurança

---

### 2️⃣ Configurar Firewall do Sistema (VM)

Agora configure o firewall dentro da VM Oracle Linux.

#### Opção A: Script Automatizado (Recomendado)

```bash
# Na VM Oracle Cloud
cd ~/CEPAS

# Executar script (precisa de sudo)
sudo ./setup-firewall.sh
```

O script irá:
- ✅ Detectar firewall (firewalld ou iptables)
- ✅ Liberar portas 80 e 3001
- ✅ Configurar SELinux se necessário
- ✅ Salvar regras permanentemente

#### Opção B: Configuração Manual

**Para firewalld (Oracle Linux 8+):**

```bash
# Liberar porta 80 (HTTP - Frontend)
sudo firewall-cmd --permanent --add-port=80/tcp

# Liberar porta 3001 (Backend API)
sudo firewall-cmd --permanent --add-port=3001/tcp

# Recarregar firewall
sudo firewall-cmd --reload

# Verificar portas abertas
sudo firewall-cmd --list-ports
```

**Para iptables (Oracle Linux 7):**

```bash
# Liberar porta 80
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Liberar porta 3001
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT

# Salvar regras
sudo service iptables save
```

**Configurar SELinux (se ativo):**

```bash
# Verificar status
getenforce

# Se retornar "Enforcing", configure:
sudo semanage port -a -t http_port_t -p tcp 3001
sudo setsebool -P httpd_can_network_connect 1

# Se comando semanage não encontrado:
sudo yum install -y policycoreutils-python-utils
```

---

### 3️⃣ Obter IP Público da VM

```bash
# Método 1: ifconfig.me
curl ifconfig.me

# Método 2: ipinfo.io
curl ipinfo.io/ip

# Método 3: Oracle Cloud Console
# Menu ☰ → Compute → Instances → Sua VM → Olhe "Public IP Address"

# Salvar em variável
export PUBLIC_IP=$(curl -s ifconfig.me)
echo "Seu IP público: $PUBLIC_IP"
```

**Exemplo de saída:**
```
152.67.123.45
```

---

### 4️⃣ Deploy Docker com IP Público

#### Método 1: Com variável de ambiente (Recomendado)

```bash
cd ~/CEPAS

# Exportar IP público
export PUBLIC_IP=$(curl -s ifconfig.me)

# Deploy
PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d --build

# Verificar
docker compose -f docker-compose.oracle-cloud.yml ps
docker compose -f docker-compose.oracle-cloud.yml logs -f
```

#### Método 2: Criar arquivo .env

```bash
cd ~/CEPAS

# Criar arquivo .env
cat > .env << EOF
PUBLIC_IP=$(curl -s ifconfig.me)
EOF

# Deploy (o docker-compose lerá automaticamente o .env)
docker compose -f docker-compose.oracle-cloud.yml up -d --build
```

#### Método 3: Editar docker-compose diretamente

```bash
# Obter IP
MY_IP=$(curl -s ifconfig.me)

# Editar docker-compose.oracle-cloud.yml
nano docker-compose.oracle-cloud.yml

# Substituir ${PUBLIC_IP:-localhost} por seu IP real
# Exemplo: - PUBLIC_IP=152.67.123.45
#          - FRONTEND_URL=http://152.67.123.45

# Deploy
docker compose -f docker-compose.oracle-cloud.yml up -d --build
```

---

### 5️⃣ Verificar Acesso

#### Testar localmente na VM:

```bash
# Frontend
curl http://localhost
curl http://$PUBLIC_IP

# Backend
curl http://localhost:3001/api/ping
curl http://$PUBLIC_IP:3001/api/ping
```

#### Testar de outro computador/celular:

**No navegador:**
- Frontend: `http://SEU_IP_PUBLICO`
- Backend: `http://SEU_IP_PUBLICO:3001/api/ping`

**Com curl:**
```bash
# Substitua pelo seu IP
curl http://152.67.123.45
curl http://152.67.123.45:3001/api/ping
```

**Resposta esperada do backend:**
```json
{"status":"ok","message":"Backend CEPAS rodando!"}
```

---

## 🔧 Configurações Avançadas

### Usar Domínio Próprio (Opcional)

Se você tem um domínio (ex: `meusite.com`):

1. **Configurar DNS:**
   - No seu provedor de domínio (GoDaddy, Namecheap, etc)
   - Adicione um registro A apontando para seu IP público:
     ```
     Type: A
     Name: @ (ou www)
     Value: SEU_IP_PUBLICO
     TTL: 3600
     ```

2. **Atualizar variáveis:**
   ```bash
   export PUBLIC_IP=meusite.com
   PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d --build
   ```

3. **Acessar:** `http://meusite.com`

### Configurar HTTPS (SSL/TLS)

Para acesso seguro via HTTPS:

#### Opção 1: Nginx Reverse Proxy + Let's Encrypt

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Criar configuração Nginx
sudo tee /etc/nginx/conf.d/cepas.conf > /dev/null <<EOF
server {
    listen 80;
    server_name SEU_IP_OU_DOMINIO;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Obter certificado (se tiver domínio)
sudo certbot --nginx -d seudominio.com

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### Opção 2: Cloudflare (Gratuito)

1. Crie conta no Cloudflare
2. Adicione seu domínio
3. Configure DNS para apontar para seu IP
4. Ative SSL/TLS no modo "Flexible"
5. Acesse via `https://seudominio.com`

---

## 🔒 Segurança em Produção

### 1. Trocar Senhas Padrão

```bash
# Editar docker-compose.oracle-cloud.yml
nano docker-compose.oracle-cloud.yml

# Alterar:
- ORACLE_PASSWORD=oracle123  # TROCAR!
- DB_PASSWORD=CepasDatabase@2025  # TROCAR!
```

### 2. Configurar Autenticação

O sistema já tem JWT implementado. Configure senhas fortes:

```bash
# Gerar chave JWT forte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Adicionar ao .env
JWT_SECRET=sua_chave_gerada_aqui
```

### 3. Limitar Origens CORS (Opcional)

Se souber exatamente quais IPs/domínios acessarão:

```javascript
// backend/server.js
const allowedOrigins = [
    'http://152.67.123.45',  // Seu IP
    'http://meudominio.com'  // Seu domínio
];
// Remover: 0.0.0.0/0 do Security List
```

### 4. Rate Limiting (Já implementado)

O backend já tem rate limiting. Verifique:
```javascript
// backend/routes/authRoutes.js - já configurado
```

### 5. Monitoramento

```bash
# Monitor em tempo real
./monitor-ram-docker.sh

# Logs
docker compose -f docker-compose.oracle-cloud.yml logs -f

# Alertas de segurança
sudo tail -f /var/log/secure
```

---

## 🐛 Troubleshooting

### Problema: "Não consigo acessar de fora"

**1. Verificar Security List:**
```bash
# Na Oracle Cloud Console
# Networking → VCN → Security Lists
# Confirme que as Ingress Rules estão corretas
```

**2. Verificar Firewall da VM:**
```bash
# Listar portas abertas
sudo firewall-cmd --list-ports

# Se vazias, executar:
sudo ./setup-firewall.sh
```

**3. Verificar containers rodando:**
```bash
docker compose -f docker-compose.oracle-cloud.yml ps

# Devem estar "Up"
```

**4. Verificar se portas estão escutando:**
```bash
sudo netstat -tulpn | grep -E '80|3001'

# Deve mostrar Docker escutando nas portas
```

**5. Testar de dentro da VM:**
```bash
curl http://localhost
curl http://localhost:3001/api/ping

# Se funcionar localmente mas não externamente, é problema de firewall
```

### Problema: "CORS Error" no navegador

**Solução:**

```bash
# 1. Verificar se PUBLIC_IP está configurado
docker compose -f docker-compose.oracle-cloud.yml exec backend printenv | grep PUBLIC_IP

# 2. Se não aparecer, reconfigure:
export PUBLIC_IP=$(curl -s ifconfig.me)
docker compose -f docker-compose.oracle-cloud.yml down
PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d

# 3. Verificar logs do backend
docker compose -f docker-compose.oracle-cloud.yml logs backend | grep CORS
```

### Problema: Backend não conecta ao Oracle

```bash
# Verificar se Oracle está rodando
docker compose -f docker-compose.oracle-cloud.yml ps oracle

# Ver logs
docker compose -f docker-compose.oracle-cloud.yml logs oracle

# Reiniciar apenas Oracle
docker compose -f docker-compose.oracle-cloud.yml restart oracle

# Aguardar 30s e reiniciar backend
sleep 30
docker compose -f docker-compose.oracle-cloud.yml restart backend
```

### Problema: "502 Bad Gateway" no frontend

```bash
# Backend provavelmente está fora do ar
docker compose -f docker-compose.oracle-cloud.yml ps

# Verificar logs
docker compose -f docker-compose.oracle-cloud.yml logs backend

# Reiniciar
docker compose -f docker-compose.oracle-cloud.yml restart backend
```

### Problema: Memória insuficiente

```bash
# Verificar uso
free -h
docker stats

# Limpar recursos
docker system prune -f

# Reiniciar containers
docker compose -f docker-compose.oracle-cloud.yml restart

# Se persistir, aumentar swap:
sudo dd if=/dev/zero of=/swapfile2 bs=1M count=1024
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
```

---

## 📊 Comandos Úteis

```bash
# Obter IP público
curl ifconfig.me

# Verificar portas abertas (Security List) - via OCI CLI
oci network security-list list --compartment-id <ID>

# Verificar firewall da VM
sudo firewall-cmd --list-all

# Testar conectividade
nc -zv SEU_IP_PUBLICO 80
nc -zv SEU_IP_PUBLICO 3001

# Ver quem está acessando (logs Nginx)
docker compose -f docker-compose.oracle-cloud.yml logs frontend | grep -i "GET"

# Banir IP específico (se necessário)
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="IP_MALICIOSO" reject'
sudo firewall-cmd --reload
```

---

## 📝 Checklist de Deploy Público

- [ ] Security List configurado na Oracle Cloud Console
- [ ] Portas 80 e 3001 liberadas no Security List
- [ ] Firewall da VM configurado (firewalld/iptables)
- [ ] SELinux configurado (se aplicável)
- [ ] IP público obtido e salvo
- [ ] Variável PUBLIC_IP configurada
- [ ] Docker Compose executado com PUBLIC_IP
- [ ] Containers rodando (docker ps)
- [ ] Teste local funcionando (curl localhost)
- [ ] Teste externo funcionando (curl IP_PUBLICO)
- [ ] Frontend acessível pelo navegador
- [ ] Backend API respondendo
- [ ] CORS configurado corretamente
- [ ] Senhas padrão trocadas
- [ ] JWT_SECRET configurado
- [ ] Monitoramento ativo

---

## 🎯 URLs de Acesso

Após configuração completa:

```
Frontend:      http://SEU_IP_PUBLICO
Backend API:   http://SEU_IP_PUBLICO:3001
Health Check:  http://SEU_IP_PUBLICO:3001/api/ping
Login:         http://SEU_IP_PUBLICO/login
```

---

## ⚡ Deploy em Uma Linha

```bash
cd ~/CEPAS && export PUBLIC_IP=$(curl -s ifconfig.me) && sudo ./setup-firewall.sh && PUBLIC_IP=$PUBLIC_IP docker compose -f docker-compose.oracle-cloud.yml up -d --build && echo "✅ Deploy completo! Acesse: http://$PUBLIC_IP"
```

---

✅ **Seu projeto CEPAS agora está acessível pela Internet!**

📧 Compartilhe o link: `http://SEU_IP_PUBLICO`

🔒 Lembre-se de configurar HTTPS para produção!
