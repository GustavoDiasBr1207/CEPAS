# Sistema CEPAS - Cadastro Completo de Família

## 📋 Descrição

Este sistema permite o cadastro completo de famílias no CEPAS, incluindo:
- **Dados básicos da família** (nome, origem, benefícios, plano de saúde)
- **Endereço completo** (área, quadra, rua, número, complemento)
- **Informações sobre animais** (posse, quantidade, tipos)
- **Estrutura da habitação** (tipo, materiais, infraestrutura)
- **Recursos de saneamento** (água, esgoto, lixo, horta)

## 🚀 Como executar com Docker

### 1. Construir e executar os containers

```bash
docker-compose up --build
```

### 2. Acessar o sistema

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3001/api

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **Familia** - Dados básicos da família
2. **Endereco** - Endereço da família (1:1 com Familia)
3. **Animal** - Informações sobre animais (1:1 com Familia)
4. **EstruturaHabitacao** - Dados da habitação (1:1 com Familia)
5. **RecursoSaneamento** - Dados de saneamento (1:1 com Familia)

### Outras Tabelas

- **Area** - Áreas/regiões cadastradas
- **Monitor** - Monitores do sistema
- **Entrevista** - Entrevistas realizadas
- **Membro** - Membros das famílias
- **SaudeMembro** - Informações de saúde dos membros
- **CriancaCepas** - Crianças atendidas no CEPAS

## 🔧 API Endpoints

### Cadastro de Família Completa

```http
POST /api/familia-completa
Content-Type: application/json
x-user: nome_usuario

{
  "nome_familia": "Família Silva",
  "migracao": "Rural para urbana",
  "estado_origem": "Ceará",
  "cidade_origem": "Fortaleza",
  "recebe_beneficio": 1,
  "possui_plano_saude": 0,
  "convenio": "",
  "observacoes": "Família participativa",
  
  "endereco": {
    "id_area": 1,
    "quadra": "A",
    "rua": "Rua das Flores",
    "numero_casa": "123",
    "complemento": "Próximo ao mercado"
  },
  
  "animal": {
    "tem_animal": 1,
    "qtd_animais": 2,
    "qual_animal": "Cães"
  },
  
  "estrutura": {
    "tipo_habitacao": "Casa",
    "tipo_lote": "Próprio",
    "situacao_convivencia": "Somente a família",
    "energia_eletrica": 1,
    "material_parede": "Tijolo",
    "material_piso": "Cimento",
    "material_cobertura": "Telha",
    "qtd_quartos": 3,
    "qtd_camas": 4,
    "tipo_camas": "Solteiro e Casal"
  },
  
  "saneamento": {
    "horta": 1,
    "arvore_frutifera": 1,
    "como_escoa": "Fossa séptica",
    "tem_banheiro": 1,
    "dest_lixo": "Coleta pública",
    "bebe_agua": "Filtrada",
    "trata_agua": "Coleta"
  }
}
```

### CRUD Genérico

```http
# Listar registros
GET /api/dados/{tableName}

# Criar registro
POST /api/dados/{tableName}

# Atualizar registro
PUT /api/dados/{tableName}/{id}

# Deletar registro
DELETE /api/dados/{tableName}/{id}
```

## 💻 Componentes Frontend

### 1. Formulario.js
- Formulário completo com todas as seções
- Validação de campos obrigatórios
- Interface responsiva
- Campos condicionais (ex: convênio só aparece se possui plano de saúde)

### 2. CadastroFamilia.js
- Página principal de cadastro
- Feedback de sucesso/erro
- Loading durante envio
- Tratamento de erros

### 3. Formulario.css
- Estilos responsivos
- Layout em grid
- Campos organizados em seções
- Animações suaves

## 🔐 Recursos de Segurança

- **Tabelas permitidas**: Lista restrita de tabelas acessíveis via API
- **Auditoria**: Campos `usuario_responsavel`, `created_at`, `updated_at`
- **Validação**: Campos obrigatórios e tipos de dados
- **Integridade**: Chaves estrangeiras e constraints

## 📱 Interface de Usuário

### Seções do Formulário

1. **Dados Básicos da Família**
   - Nome da família (obrigatório)
   - Migração, estado e cidade de origem
   - Benefícios sociais e plano de saúde
   - Observações gerais

2. **Endereço**
   - Seleção de área
   - Quadra, rua, número e complemento

3. **Animais**
   - Checkbox para posse de animais
   - Quantidade e tipos (condicional)

4. **Estrutura da Habitação**
   - Tipo de habitação e lote
   - Situação de convivência
   - Materiais de construção
   - Quantidade de quartos e camas

5. **Saneamento**
   - Recursos disponíveis (horta, árvores)
   - Esgotamento sanitário
   - Destino do lixo
   - Tratamento de água

## 🎨 Design e UX

- **Layout responsivo** para desktop, tablet e mobile
- **Campos organizados** em seções lógicas
- **Feedback visual** para ações do usuário
- **Validação em tempo real** dos campos
- **Estados de loading** durante operações
- **Mensagens de erro/sucesso** claras

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente

**Frontend (.env):**
```env
REACT_APP_API_BASE_URL=http://backend:3001/api
```

**Backend:**
- Configuração do Oracle no arquivo `dbConfig.js`
- Wallet de conexão na pasta `wallet/`

## 📝 Logs e Monitoramento

- Logs detalhados no backend para cada operação
- Console logs no frontend para debug
- Tratamento de erros do Oracle Database
- Rastreamento de usuário responsável por cada ação

## 🚨 Tratamento de Erros

### Frontend
- Try/catch em todas as chamadas de API
- Mensagens de erro amigáveis ao usuário
- Estado de loading durante operações

### Backend
- Validação de dados de entrada
- Tratamento de erros do Oracle
- Logs detalhados de erros
- Respostas HTTP apropriadas

## 📈 Próximos Passos

1. **Autenticação real** (substituir login mock)
2. **Relatórios** de famílias cadastradas
3. **Cadastro de membros** da família
4. **Edição** de famílias existentes
5. **Busca e filtros** avançados
6. **Dashboard** com estatísticas

## 🤝 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste localmente com Docker
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do Docker
- Consulte a documentação da API
- Teste a conexão com o banco Oracle