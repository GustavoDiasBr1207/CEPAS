# Sistema CEPAS - Cadastro Completo de Famílias

## 📋 Visão Geral

O Sistema CEPAS agora possui um sistema completo e robusto de cadastro de famílias que integra todas as tabelas do schema Oracle. O sistema permite o cadastro abrangente de famílias incluindo dados de endereço, estrutura habitacional, saneamento, animais, múltiplos membros com dados de saúde e programa CEPAS, além de informações de entrevista.

## 🏗️ Arquitetura do Sistema

### Schema do Banco (Oracle)
- **12 Tabelas Principais**: Familia, Endereco, Membro, SaudeMembro, CriancaCepas, Animal, EstruturaHabitacao, RecursoSaneamento, Entrevista, EntrevistaMonitor, Monitor, Area
- **Compatibilidade Universal**: Schema compatível com Oracle 9i até 21c usando padrão SEQUENCE + TRIGGER
- **Integridade Referencial**: Todas as relações de chave estrangeira implementadas

### Frontend (React)
- **Componente Principal**: `Formulario.js` - Formulário principal de cadastro
- **Componente de Membros**: `MembroForm.js` - Formulário detalhado para cada membro
- **Gerenciamento de Membros**: `MembrosList.js` - Interface para gerenciar múltiplos membros
- **Validação Robusta**: `validationHelpers.js` - Validações completas de todos os dados

### Backend (Node.js + Express)
- **Endpoint Principal**: `/api/familia-completa` - Processa cadastro completo
- **CRUD Completo**: Endpoints para todas as operações de todas as tabelas
- **Tratamento de Erros**: Logs detalhados e respostas estruturadas

## 🚀 Funcionalidades Implementadas

### 1. Cadastro da Família Principal
- Nome da família
- Origem (migração/nova)
- Situação (ativa/inativa)
- Observações gerais

### 2. Dados de Endereço
- Quadra, rua, número
- Complemento e referências
- CEP

### 3. Estrutura Habitacional
- Tipo de construção (alvenaria, madeira, etc.)
- Acabamentos (piso, parede, cobertura)
- Área construída e total
- Valor estimado
- Número de cômodos

### 4. Recursos de Saneamento
- Abastecimento de água
- Tratamento de água
- Destino do esgoto
- Coleta de lixo
- Informações sobre banheiros

### 5. Animais da Família
- Tipo de animal
- Nome e idade
- Descrição e observações

### 6. Membros da Família (Completo)
#### Dados Básicos:
- Nome, sexo, data de nascimento
- Relação com o chefe da família
- Estado civil, escolaridade
- Ocupação e religião

#### Dados de Saúde:
- ✅ Hipertensão
- ✅ Diabetes
- ✅ Doenças cardíacas
- ✅ Doenças respiratórias
- ✅ Depressão
- ✅ Deficiências
- ✅ Alcoolismo
- ✅ Uso de drogas
- ✅ Gestação
- ✅ Vacinação em dia
- ✅ Cirurgias
- ✅ Obesidade
- ✅ Outras condições

#### Programa CEPAS para Crianças:
- Participação ativa no programa
- Data de início e fim
- Turno (manhã/tarde)
- Tipo de atividade
- Observações específicas

### 7. Dados da Entrevista
- Data da entrevista
- Nome do entrevistado
- Telefone de contato
- Observações da entrevista

## 🔧 Como Usar o Sistema

### 1. Executar o Sistema

```bash
# Subir o banco Oracle
docker-compose up -d

# Instalar dependências do backend
cd backend
npm install

# Iniciar o servidor backend
npm start

# Em outro terminal, instalar dependências do frontend
cd ..
npm install

# Iniciar o frontend
npm start
```

### 2. Acessar o Sistema
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Página de cadastro: `http://localhost:3000/cadastro`

### 3. Cadastrar uma Família

1. **Preencher dados básicos** da família
2. **Adicionar endereço** (opcional mas recomendado)
3. **Configurar estrutura habitacional** (opcional)
4. **Definir recursos de saneamento** (opcional)
5. **Adicionar animais** (se houver)
6. **Gerenciar membros da família**:
   - Clicar em "Adicionar Membro"
   - Preencher dados pessoais
   - Configurar dados de saúde
   - Se for criança, configurar participação no CEPAS
   - Salvar o membro
   - Repetir para todos os membros
7. **Preencher dados da entrevista**
8. **Submeter o formulário**

## 🧪 Testes do Sistema

### Script de Teste Automatizado
Execute o teste completo do sistema:

```bash
node test-complete-registration.js
```

Este script testa:
- ✅ Conexão com o servidor
- ✅ Cadastro completo de família com 4 membros
- ✅ Dados de saúde e CEPAS para crianças
- ✅ Verificação dos dados inseridos
- ✅ Integridade das relações entre tabelas
- ✅ Listagem de famílias

### Dados de Teste
O script inclui uma família completa com:
- **4 membros**: Pai, mãe gestante, filho com asma (CEPAS), filha (CEPAS)
- **2 animais**: Cachorro e gato
- **Dados completos**: Endereço, estrutura, saneamento, entrevista
- **Condições de saúde**: Gestação, asma, vacinação
- **Programa CEPAS**: 2 crianças participando

## 📊 Validações Implementadas

### Validações do Frontend
- **Campos obrigatórios**: Nome da família, dados básicos dos membros
- **Formatos**: Datas, telefones, CEP
- **Limites de caracteres**: Todos os campos respeitam os limites do banco
- **Lógica de negócio**: Idades, datas futuras, relacionamentos

### Validações do Backend
- **Integridade dos dados**: Verificação antes da inserção
- **Relacionamentos**: Validação de chaves estrangeiras
- **Logs detalhados**: Rastreamento completo de operações
- **Tratamento de erros Oracle**: Mensagens específicas para diferentes tipos de erro

## 🔄 Fluxo de Dados Completo

### 1. Frontend → Backend
```
Formulario.js → handleSubmit() → fetch('/api/familia-completa') → apiRoutes.js
```

### 2. Processamento no Backend
```
1. Inserir Familia → obter ID_FAMILIA
2. Inserir Endereco (se fornecido)
3. Inserir Animal (sempre - dados padrão se necessário)
4. Inserir EstruturaHabitacao (se fornecido)
5. Inserir RecursoSaneamento (se fornecido)
6. Para cada membro:
   - Inserir Membro → obter ID_MEMBRO
   - Inserir SaudeMembro (dados de saúde)
   - Inserir CriancaCepas (se ativa)
7. Inserir Entrevista (se fornecido)
8. Retornar resumo completo
```

### 3. Resposta Estruturada
```json
{
  "success": true,
  "message": "Família cadastrada com sucesso!",
  "id_familia": 123,
  "dados_processados": {
    "familia": true,
    "endereco": true,
    "animal": true,
    "estrutura": true,
    "saneamento": true,
    "membros": 4,
    "entrevista": true
  },
  "detalhes": {
    "membros_inseridos": [...],
    "id_entrevista": 456
  }
}
```

## 🚨 Tratamento de Erros

### Tipos de Erro Tratados
1. **Erros de Conexão**: Banco indisponível
2. **Erros de Validação**: Dados inválidos ou faltantes
3. **Erros Oracle Específicos**: 
   - ORA-00001: Violação de chave única
   - ORA-02292: Violação de integridade referencial
   - ORA-01400: Valor nulo em campo obrigatório
4. **Erros de Aplicação**: Falhas na lógica de negócio

### Logs Detalhados
- **Início e fim** de cada operação
- **Dados recebidos** (sanitizados)
- **IDs gerados** para cada inserção
- **Erros completos** com stack trace
- **Timestamp** de todas as operações

## 📱 Interface do Usuário

### Design Responsivo
- **Mobile First**: Interface otimizada para dispositivos móveis
- **Cards Organizados**: Seções claras e bem definidas
- **Feedback Visual**: Indicadores de carregamento e sucesso
- **Validação em Tempo Real**: Feedback imediato para o usuário

### Componentes Principais

#### MembroForm.js
- Formulário modal para cada membro
- Tabs organizadas: Dados Pessoais, Saúde, CEPAS
- Validações específicas por idade
- Cálculo automático de idade

#### MembrosList.js
- Lista visual dos membros cadastrados
- Cards com informações resumidas
- Indicadores de saúde e participação CEPAS
- Botões de edição e exclusão

#### Formulario.js
- Formulário principal integrado
- Seções colapsáveis
- Gerenciamento de estado centralizado
- Submissão unificada

## 🔐 Segurança e Auditoria

### Campos de Auditoria
Todos os registros incluem:
- **CREATED_AT**: Data/hora de criação
- **UPDATED_AT**: Data/hora da última atualização  
- **USUARIO_RESPONSAVEL**: Usuário que realizou a operação

### Logs de Sistema
- Todas as operações são logadas
- Rastreabilidade completa de mudanças
- Identificação do usuário responsável

## 📈 Próximos Passos

### Melhorias Sugeridas
1. **Dashboard Analítico**: Visualização de dados das famílias
2. **Relatórios**: Geração de relatórios em PDF/Excel
3. **Busca Avançada**: Filtros complexos para consulta
4. **Backup Automático**: Rotinas de backup dos dados
5. **API de Integração**: Endpoints para sistemas externos

### Otimizações
1. **Cache de Dados**: Redis para dados frequentemente acessados
2. **Paginação**: Para listagens grandes
3. **Compressão**: Otimização de imagens e assets
4. **CDN**: Distribuição de conteúdo estático

## 🤝 Contribuição

### Estrutura de Desenvolvimento
- **Frontend**: React + CSS modules
- **Backend**: Node.js + Express + Oracle
- **Banco**: Oracle com Docker
- **Testes**: Scripts automatizados

### Padrões Adotados
- **Naming Convention**: snake_case para banco, camelCase para JS
- **Error Handling**: Try-catch com logs detalhados
- **Validation**: Frontend + Backend (dupla validação)
- **Documentation**: Comentários em português, código em inglês

---

**Sistema CEPAS v2.0 - Cadastro Completo de Famílias**  
*Desenvolvido para atender todas as necessidades de registro e acompanhamento familiar do programa CEPAS*