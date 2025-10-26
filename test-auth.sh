#!/bin/bash

echo "🧪 Testando Sistema de Autenticação CEPAS"
echo "========================================="

# Esperar o backend estar online
echo "⏳ Aguardando backend estar disponível..."
while ! curl -s http://localhost:3001/api/ping > /dev/null; do
    sleep 2
done
echo "✅ Backend está online!"

# Teste 1: Login com credenciais válidas
echo "🔐 Teste 1: Login com admin"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Resposta: $RESPONSE"

if echo "$RESPONSE" | grep -q "accessToken"; then
    echo "✅ Login do admin funcionou!"
    
    # Extrair token para próximos testes
    TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 Token obtido: ${TOKEN:0:20}..."
    
    # Teste 2: Acessar endpoint protegido
    echo "🛡️ Teste 2: Acessando endpoint protegido"
    PROTECTED_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/me \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Resposta: $PROTECTED_RESPONSE"
    
    if echo "$PROTECTED_RESPONSE" | grep -q "admin"; then
        echo "✅ Acesso autorizado funcionou!"
    else
        echo "❌ Erro no acesso autorizado"
    fi
    
else
    echo "❌ Falha no login do admin"
fi

# Teste 3: Login com credenciais inválidas
echo "🚫 Teste 3: Login com credenciais inválidas"
INVALID_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senhaerrada"}')

echo "Resposta: $INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q "inválidas"; then
    echo "✅ Rejeição de credenciais inválidas funcionou!"
else
    echo "❌ Erro na validação de credenciais"
fi

# Teste 4: Testar acesso sem token
echo "🚪 Teste 4: Acesso sem token"
NO_TOKEN_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/me)

echo "Resposta: $NO_TOKEN_RESPONSE"

if echo "$NO_TOKEN_RESPONSE" | grep -q "Token.*requerido"; then
    echo "✅ Proteção de endpoint funcionou!"
else
    echo "❌ Endpoint não está protegido corretamente"
fi

echo "========================================="
echo "🎉 Testes de autenticação concluídos!"