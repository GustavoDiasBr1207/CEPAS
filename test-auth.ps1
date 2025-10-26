# Script de teste do sistema de autenticação CEPAS
Write-Host "🧪 Testando Sistema de Autenticação CEPAS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Esperar o backend estar online
Write-Host "⏳ Aguardando backend estar disponível..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 2
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:3001/api/ping" -Method GET -ErrorAction Stop
        $backendOnline = $true
    } catch {
        $backendOnline = $false
    }
} while (-not $backendOnline)

Write-Host "✅ Backend está online!" -ForegroundColor Green

# Teste 1: Login com credenciais válidas
Write-Host "🔐 Teste 1: Login com admin" -ForegroundColor Cyan
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    
    Write-Host "Resposta recebida com sucesso" -ForegroundColor Green
    
    if ($loginResponse.tokens.accessToken) {
        Write-Host "✅ Login do admin funcionou!" -ForegroundColor Green
        $token = $loginResponse.tokens.accessToken
        Write-Host "🔑 Token obtido: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Yellow
        
        # Teste 2: Acessar endpoint protegido
        Write-Host "🛡️ Teste 2: Acessando endpoint protegido" -ForegroundColor Cyan
        $headers = @{ Authorization = "Bearer $token" }
        
        try {
            $protectedResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $headers
            
            if ($protectedResponse.user.username -eq "admin") {
                Write-Host "✅ Acesso autorizado funcionou!" -ForegroundColor Green
            } else {
                Write-Host "❌ Erro no acesso autorizado" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Erro no acesso autorizado: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Token não encontrado na resposta" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Falha no login do admin: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Login com credenciais inválidas
Write-Host "🚫 Teste 3: Login com credenciais inválidas" -ForegroundColor Cyan
try {
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"senhaerrada"}' -ErrorAction Stop
    Write-Host "❌ Login inválido não foi rejeitado!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Rejeição de credenciais inválidas funcionou!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro inesperado na validação: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 4: Testar acesso sem token
Write-Host "🚪 Teste 4: Acesso sem token" -ForegroundColor Cyan
try {
    $noTokenResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method GET -ErrorAction Stop
    Write-Host "❌ Endpoint não está protegido corretamente" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Proteção de endpoint funcionou!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Testes de autenticação concluídos!" -ForegroundColor Green