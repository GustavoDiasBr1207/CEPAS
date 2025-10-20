-- ========================
-- SCHEMA CEPAS SUPER COMPLETO
-- Sistema de Gestão Social Integrada
-- ========================

-- ========================
-- Usuários do Sistema
-- ========================
CREATE TABLE Usuario (
  id_usuario NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_completo VARCHAR2(200) NOT NULL,
  email VARCHAR2(150) NOT NULL UNIQUE,
  senha_hash VARCHAR2(255) NOT NULL,
  cpf VARCHAR2(14) UNIQUE,
  telefone VARCHAR2(20),
  cargo VARCHAR2(100),
  perfil VARCHAR2(50) CHECK (perfil IN ('ADMIN','COORDENADOR','MONITOR','ASSISTENTE_SOCIAL','USUARIO')) DEFAULT 'USUARIO',
  status VARCHAR2(20) CHECK (status IN ('ATIVO','INATIVO','SUSPENSO')) DEFAULT 'ATIVO',
  ultimo_acesso DATE,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE
);

-- ========================
-- Regiões/Territóriosa
-- ========================
CREATE TABLE Regiao (
  id_regiao NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_regiao VARCHAR2(100) NOT NULL,
  codigo_regiao VARCHAR2(20) UNIQUE,
  descricao VARCHAR2(300),
  coordenador_id NUMBER,
  created_at DATE DEFAULT SYSDATE,
  CONSTRAINT fk_regiao_coordenador FOREIGN KEY (coordenador_id) REFERENCES Usuario(id_usuario)
);

-- ========================
-- Áreas (Expandida)
-- ========================
CREATE TABLE Area (
  id_area NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_area VARCHAR2(80) NOT NULL,
  codigo_area VARCHAR2(20) UNIQUE,
  id_regiao NUMBER,
  cep_inicial VARCHAR2(10),
  cep_final VARCHAR2(10),
  descricao VARCHAR2(200),
  populacao_estimada NUMBER,
  nivel_vulnerabilidade VARCHAR2(20) CHECK (nivel_vulnerabilidade IN ('BAIXO','MEDIO','ALTO','MUITO_ALTO')),
  coordenadas_gps VARCHAR2(100), -- latitude,longitude
  status VARCHAR2(20) CHECK (status IN ('ATIVA','INATIVA')) DEFAULT 'ATIVA',
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  CONSTRAINT fk_area_regiao FOREIGN KEY (id_regiao) REFERENCES Regiao(id_regiao)
);

-- ========================
-- Monitores (Expandida)
-- ========================
CREATE TABLE Monitor (
  id_monitor NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario NUMBER UNIQUE, -- Referência ao usuário do sistema
  nome VARCHAR2(150) NOT NULL,
  cpf VARCHAR2(14) UNIQUE,
  telefone VARCHAR2(30),
  telefone_emergencia VARCHAR2(30),
  email VARCHAR2(150) NOT NULL,
  endereco_completo VARCHAR2(300),
  id_area_responsavel NUMBER,
  especializacao VARCHAR2(200),
  nivel_escolaridade VARCHAR2(50),
  data_contratacao DATE,
  salario NUMBER(10,2),
  carga_horaria NUMBER(3),
  status VARCHAR2(20) CHECK (status IN ('ATIVO','LICENCA','FERIAS','DEMITIDO')) DEFAULT 'ATIVO',
  observacao VARCHAR2(500),
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  CONSTRAINT fk_monitor_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
  CONSTRAINT fk_monitor_area FOREIGN KEY (id_area_responsavel) REFERENCES Area(id_area)
);

-- ========================
-- Família (Expandida com dados do responsável)
-- ========================
CREATE TABLE Familia (
  id_familia NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Dados Básicos da Família
  nome_familia VARCHAR2(150) NOT NULL,
  codigo_familia VARCHAR2(20) UNIQUE, -- Código interno do sistema
  
  -- Dados do Responsável Principal
  nome_responsavel VARCHAR2(200) NOT NULL,
  cpf_responsavel VARCHAR2(14),
  rg_responsavel VARCHAR2(20),
  telefone_responsavel VARCHAR2(20),
  telefone_alternativo VARCHAR2(20),
  email_responsavel VARCHAR2(150),
  data_nascimento_resp DATE,
  
  -- Informações Socioeconômicas
  renda_familiar NUMBER(10,2),
  fonte_renda VARCHAR2(200),
  numero_membros NUMBER DEFAULT 1,
  situacao_emprego_resp VARCHAR2(100),
  
  -- Dados de Migração
  migracao VARCHAR2(50),
  estado_origem VARCHAR2(80),
  cidade_origem VARCHAR2(80),
  motivo_migracao VARCHAR2(300),
  ano_chegada NUMBER(4),
  
  -- Benefícios Sociais
  recebe_beneficio NUMBER(1,0) NOT NULL CHECK (recebe_beneficio IN (0,1)) DEFAULT 0,
  tipos_beneficio VARCHAR2(300), -- Ex: "Bolsa Família, Auxílio Brasil, BPC"
  valor_beneficios NUMBER(10,2),
  
  -- Saúde
  possui_plano_saude NUMBER(1,0) NOT NULL CHECK (possui_plano_saude IN (0,1)) DEFAULT 0,
  convenio VARCHAR2(120),
  unidade_saude_referencia VARCHAR2(200),
  
  -- Situação de Vulnerabilidade
  nivel_vulnerabilidade VARCHAR2(20) CHECK (nivel_vulnerabilidade IN ('BAIXO','MEDIO','ALTO','CRITICO')),
  situacao_violencia NUMBER(1,0) CHECK (situacao_violencia IN (0,1)) DEFAULT 0,
  tipos_violencia VARCHAR2(300),
  
  -- Status e Acompanhamento
  status_familia VARCHAR2(30) CHECK (status_familia IN ('ATIVA','INATIVA','TRANSFERIDA','MUDOU_SE')) DEFAULT 'ATIVA',
  data_cadastro DATE DEFAULT SYSDATE,
  data_ultima_visita DATE,
  frequencia_acompanhamento VARCHAR2(50), -- Semanal, Quinzenal, Mensal
  
  -- Observações e Notas
  observacoes CLOB,
  observacoes_internas CLOB, -- Notas apenas para equipe técnica
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  monitor_responsavel NUMBER,
  
  CONSTRAINT fk_familia_monitor FOREIGN KEY (monitor_responsavel) REFERENCES Monitor(id_monitor)
);

-- ========================
-- Endereço (Expandido)
-- ========================
CREATE TABLE Endereco (
  id_endereco NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  id_area NUMBER,
  
  -- Endereço Completo
  cep VARCHAR2(10),
  logradouro VARCHAR2(150),
  numero_casa VARCHAR2(20),
  complemento VARCHAR2(100),
  bairro VARCHAR2(100),
  cidade VARCHAR2(100),
  estado VARCHAR2(2),
  quadra VARCHAR2(30),
  lote VARCHAR2(30),
  
  -- Localização
  ponto_referencia VARCHAR2(200),
  coordenadas_gps VARCHAR2(100),
  
  -- Situação do Imóvel
  tipo_imovel VARCHAR2(50) CHECK (tipo_imovel IN ('CASA','APARTAMENTO','COMODO','BARRACO','OUTRO')),
  situacao_imovel VARCHAR2(50) CHECK (situacao_imovel IN ('PROPRIO','ALUGADO','CEDIDO','FINANCIADO','OCUPACAO')),
  valor_aluguel NUMBER(10,2),
  tempo_residencia_meses NUMBER,
  
  -- Validação
  endereco_validado NUMBER(1,0) CHECK (endereco_validado IN (0,1)) DEFAULT 0,
  data_validacao DATE,
  
  CONSTRAINT fk_endereco_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_endereco_area FOREIGN KEY (id_area) REFERENCES Area(id_area)
);

-- ========================
-- Membros da Família (Expandida)
-- ========================
CREATE TABLE Membro (
  id_membro NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  
  -- Dados Pessoais
  nome VARCHAR2(150) NOT NULL,
  nome_social VARCHAR2(150), -- Para pessoas trans
  cpf VARCHAR2(14),
  rg VARCHAR2(20),
  data_nascimento DATE,
  idade_calculada NUMBER GENERATED ALWAYS AS (TRUNC((SYSDATE - data_nascimento)/365.25)),
  
  -- Relacionamento
  relacao VARCHAR2(80), -- Responsável, Cônjuge, Filho(a), Pai/Mãe, Avô/Avó, etc.
  is_responsavel NUMBER(1,0) CHECK (is_responsavel IN (0,1)) DEFAULT 0,
  
  -- Características Pessoais
  sexo VARCHAR2(20) CHECK (sexo IN ('MASCULINO','FEMININO','NAO_BINARIO','PREFERE_NAO_INFORMAR')),
  identidade_genero VARCHAR2(50),
  orientacao_sexual VARCHAR2(50),
  cor_raca VARCHAR2(50) CHECK (cor_raca IN ('BRANCA','PRETA','PARDA','AMARELA','INDIGENA','NAO_DECLARADA')),
  estado_civil VARCHAR2(40),
  religiao VARCHAR2(80),
  
  -- Educação
  alfabetizado NUMBER(1,0) NOT NULL CHECK (alfabetizado IN (0,1)),
  escolaridade VARCHAR2(100),
  escola_atual VARCHAR2(200),
  turno_escola VARCHAR2(20),
  necessidade_especial NUMBER(1,0) CHECK (necessidade_especial IN (0,1)) DEFAULT 0,
  tipo_necessidade VARCHAR2(200),
  
  -- Trabalho e Renda
  ocupacao VARCHAR2(120),
  situacao_trabalho VARCHAR2(100), -- Empregado, Desempregado, Aposentado, Estudante, etc.
  renda_individual NUMBER(10,2),
  contribui_renda NUMBER(1,0) CHECK (contribui_renda IN (0,1)) DEFAULT 0,
  
  -- Documentação
  possui_certidao_nascimento NUMBER(1,0) CHECK (possui_certidao_nascimento IN (0,1)) DEFAULT 0,
  possui_cpf NUMBER(1,0) CHECK (possui_cpf IN (0,1)) DEFAULT 0,
  possui_rg NUMBER(1,0) CHECK (possui_rg IN (0,1)) DEFAULT 0,
  possui_titulo_eleitor NUMBER(1,0) CHECK (possui_titulo_eleitor IN (0,1)) DEFAULT 0,
  possui_carteira_trabalho NUMBER(1,0) CHECK (possui_carteira_trabalho IN (0,1)) DEFAULT 0,
  
  -- Status
  status_membro VARCHAR2(30) CHECK (status_membro IN ('ATIVO','INATIVO','MUDOU_SE','FALECEU')) DEFAULT 'ATIVO',
  data_saida DATE,
  motivo_saida VARCHAR2(200),
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_membro_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE INDEX idx_membro_familia ON Membro(id_familia);
CREATE INDEX idx_membro_responsavel ON Membro(is_responsavel);

-- ========================
-- Saúde dos Membros (Expandida)
-- ========================
CREATE TABLE SaudeMembro (
  id_saude NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_membro NUMBER NOT NULL UNIQUE,
  
  -- Condições Crônicas
  hipertensao NUMBER(1,0) NOT NULL CHECK (hipertensao IN (0,1)) DEFAULT 0,
  diabetes NUMBER(1,0) NOT NULL CHECK (diabetes IN (0,1)) DEFAULT 0,
  doenca_cardiaca NUMBER(1,0) CHECK (doenca_cardiaca IN (0,1)) DEFAULT 0,
  doenca_respiratoria NUMBER(1,0) CHECK (doenca_respiratoria IN (0,1)) DEFAULT 0,
  doenca_renal NUMBER(1,0) CHECK (doenca_renal IN (0,1)) DEFAULT 0,
  cancer NUMBER(1,0) CHECK (cancer IN (0,1)) DEFAULT 0,
  
  -- Hábitos e Comportamentos
  tabagismo NUMBER(1,0) NOT NULL CHECK (tabagismo IN (0,1)) DEFAULT 0,
  etilismo NUMBER(1,0) NOT NULL CHECK (etilismo IN (0,1)) DEFAULT 0,
  uso_drogas NUMBER(1,0) CHECK (uso_drogas IN (0,1)) DEFAULT 0,
  sedentarismo NUMBER(1,0) NOT NULL CHECK (sedentarismo IN (0,1)) DEFAULT 0,
  
  -- Condições Específicas
  obesidade NUMBER(1,0) NOT NULL CHECK (obesidade IN (0,1)) DEFAULT 0,
  desnutricao NUMBER(1,0) CHECK (desnutricao IN (0,1)) DEFAULT 0,
  deficiencia_fisica NUMBER(1,0) CHECK (deficiencia_fisica IN (0,1)) DEFAULT 0,
  deficiencia_mental NUMBER(1,0) CHECK (deficiencia_mental IN (0,1)) DEFAULT 0,
  doenca_mental NUMBER(1,0) CHECK (doenca_mental IN (0,1)) DEFAULT 0,
  
  -- Saúde Reprodutiva
  gestante NUMBER(1,0) NOT NULL CHECK (gestante IN (0,1)) DEFAULT 0,
  meses_gestacao NUMBER(2),
  lactante NUMBER(1,0) CHECK (lactante IN (0,1)) DEFAULT 0,
  
  -- Histórico Médico
  hospitalizacao NUMBER(1,0) NOT NULL CHECK (hospitalizacao IN (0,1)) DEFAULT 0,
  data_ultima_hospitalizacao DATE,
  cirurgias NUMBER(1,0) NOT NULL CHECK (cirurgias IN (0,1)) DEFAULT 0,
  descricao_cirurgias VARCHAR2(500),
  
  -- Prevenção
  vacinacao_em_dia NUMBER(1,0) NOT NULL CHECK (vacinacao_em_dia IN (0,1)) DEFAULT 0,
  data_ultima_consulta DATE,
  medicamento_continuo NUMBER(1,0) CHECK (medicamento_continuo IN (0,1)) DEFAULT 0,
  lista_medicamentos VARCHAR2(1000),
  
  -- Outras Condições
  outras_condicoes CLOB,
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_saude_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

-- ========================
-- Estrutura da Habitação (Expandida)
-- ========================
CREATE TABLE EstruturaHabitacao (
  id_estrutura NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  
  -- Tipo e Características
  tipo_habitacao VARCHAR2(50),
  area_construida NUMBER(8,2), -- metros quadrados
  area_terreno NUMBER(8,2),
  numero_pavimentos NUMBER(2) DEFAULT 1,
  
  -- Situação da Moradia
  tipo_lote VARCHAR2(50),
  situacao_convivencia VARCHAR2(50),
  divide_imovel NUMBER(1,0) CHECK (divide_imovel IN (0,1)) DEFAULT 0,
  numero_familias_imovel NUMBER DEFAULT 1,
  
  -- Infraestrutura
  energia_eletrica NUMBER(1,0) NOT NULL CHECK (energia_eletrica IN (0,1)) DEFAULT 0,
  tipo_ligacao_energia VARCHAR2(50), -- Regular, Clandestina, Comunitária
  abastecimento_agua VARCHAR2(50), -- Rede pública, Poço, Cisterna, etc.
  qualidade_agua VARCHAR2(50),
  
  -- Materiais de Construção
  material_parede VARCHAR2(50),
  material_piso VARCHAR2(50),
  material_cobertura VARCHAR2(50),
  estado_conservacao VARCHAR2(50) CHECK (estado_conservacao IN ('OTIMO','BOM','REGULAR','RUIM','PESSIMO')),
  
  -- Cômodos e Mobiliário
  qtd_quartos NUMBER,
  qtd_salas NUMBER,
  qtd_banheiros NUMBER,
  qtd_cozinhas NUMBER,
  qtd_camas NUMBER,
  tipo_camas VARCHAR2(100),
  
  -- Equipamentos
  possui_geladeira NUMBER(1,0) CHECK (possui_geladeira IN (0,1)) DEFAULT 0,
  possui_fogao NUMBER(1,0) CHECK (possui_fogao IN (0,1)) DEFAULT 0,
  possui_tv NUMBER(1,0) CHECK (possui_tv IN (0,1)) DEFAULT 0,
  possui_radio NUMBER(1,0) CHECK (possui_radio IN (0,1)) DEFAULT 0,
  possui_maquina_lavar NUMBER(1,0) CHECK (possui_maquina_lavar IN (0,1)) DEFAULT 0,
  possui_computador NUMBER(1,0) CHECK (possui_computador IN (0,1)) DEFAULT 0,
  possui_internet NUMBER(1,0) CHECK (possui_internet IN (0,1)) DEFAULT 0,
  possui_telefone_fixo NUMBER(1,0) CHECK (possui_telefone_fixo IN (0,1)) DEFAULT 0,
  
  -- Riscos Ambientais
  risco_enchente NUMBER(1,0) CHECK (risco_enchente IN (0,1)) DEFAULT 0,
  risco_deslizamento NUMBER(1,0) CHECK (risco_deslizamento IN (0,1)) DEFAULT 0,
  poluicao_sonora NUMBER(1,0) CHECK (poluicao_sonora IN (0,1)) DEFAULT 0,
  poluicao_ar NUMBER(1,0) CHECK (poluicao_ar IN (0,1)) DEFAULT 0,
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_estrutura_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Recursos de Saneamento (Expandida)
-- ========================
CREATE TABLE RecursoSaneamento (
  id_recurso NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  
  -- Produção de Alimentos
  horta NUMBER(1,0) NOT NULL CHECK (horta IN (0,1)) DEFAULT 0,
  tamanho_horta VARCHAR2(50),
  tipos_cultivo VARCHAR2(200),
  arvore_frutifera NUMBER(1,0) NOT NULL CHECK (arvore_frutifera IN (0,1)) DEFAULT 0,
  tipos_frutas VARCHAR2(200),
  criacao_animais_quintal NUMBER(1,0) CHECK (criacao_animais_quintal IN (0,1)) DEFAULT 0,
  
  -- Saneamento Básico
  tem_banheiro NUMBER(1,0) NOT NULL CHECK (tem_banheiro IN (0,1)) DEFAULT 0,
  banheiro_dentro_casa NUMBER(1,0) CHECK (banheiro_dentro_casa IN (0,1)) DEFAULT 0,
  tipo_vaso_sanitario VARCHAR2(50),
  como_escoa VARCHAR2(50),
  fossa_septica NUMBER(1,0) CHECK (fossa_septica IN (0,1)) DEFAULT 0,
  
  -- Gestão de Resíduos
  dest_lixo VARCHAR2(20) CHECK (dest_lixo IN ('Coleta pública','Céu aberto','Enterra','Queima')),
  frequencia_coleta VARCHAR2(50),
  separacao_lixo NUMBER(1,0) CHECK (separacao_lixo IN (0,1)) DEFAULT 0,
  compostagem NUMBER(1,0) CHECK (compostagem IN (0,1)) DEFAULT 0,
  
  -- Água e Tratamento
  bebe_agua VARCHAR2(20) CHECK (bebe_agua IN ('Filtrada','Fervida','Tratada','Sem tratamento')),
  trata_agua VARCHAR2(20) CHECK (trata_agua IN ('Fervida','Coleta','Cisterna','Poço')),
  armazena_agua NUMBER(1,0) CHECK (armazena_agua IN (0,1)) DEFAULT 0,
  tipo_armazenamento VARCHAR2(100),
  qualidade_agua_percebida VARCHAR2(50),
  
  -- Drenagem
  problemas_drenagem NUMBER(1,0) CHECK (problemas_drenagem IN (0,1)) DEFAULT 0,
  alagamento_temporada_chuva NUMBER(1,0) CHECK (alagamento_temporada_chuva IN (0,1)) DEFAULT 0,
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_saneamento_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Animais da Família (Expandida)
-- ========================
CREATE TABLE Animal (
  id_animal NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  tem_animal NUMBER(1,0) NOT NULL CHECK (tem_animal IN (0,1)) DEFAULT 0,
  qtd_animais NUMBER,
  
  -- Tipos de Animais (campos separados para melhor controle)
  qtd_caes NUMBER DEFAULT 0,
  qtd_gatos NUMBER DEFAULT 0,
  qtd_aves NUMBER DEFAULT 0,
  qtd_porcos NUMBER DEFAULT 0,
  qtd_cabras NUMBER DEFAULT 0,
  qtd_bovinos NUMBER DEFAULT 0,
  qtd_equinos NUMBER DEFAULT 0,
  outros_animais VARCHAR2(200),
  
  -- Cuidados Veterinários
  animais_vacinados NUMBER(1,0) CHECK (animais_vacinados IN (0,1)) DEFAULT 0,
  animais_castrados NUMBER(1,0) CHECK (animais_castrados IN (0,1)) DEFAULT 0,
  acesso_veterinario NUMBER(1,0) CHECK (acesso_veterinario IN (0,1)) DEFAULT 0,
  
  -- Finalidade
  finalidade_criacao VARCHAR2(200), -- Companhia, Alimentação, Venda, Trabalho
  fonte_renda NUMBER(1,0) CHECK (fonte_renda IN (0,1)) DEFAULT 0,
  
  -- Condições
  local_abrigo VARCHAR2(100),
  condicoes_higiene VARCHAR2(50) CHECK (condicoes_higiene IN ('OTIMAS','BOAS','REGULARES','RUINS','PESSIMAS')),
  
  CONSTRAINT fk_animal_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Entrevistas (Expandida)
-- ========================
CREATE TABLE Entrevista (
  id_entrevista NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  codigo_entrevista VARCHAR2(30) UNIQUE,
  
  -- Dados da Entrevista
  data_entrevista DATE NOT NULL,
  hora_inicio TIMESTAMP,
  hora_fim TIMESTAMP,
  duracao_minutos NUMBER GENERATED ALWAYS AS (EXTRACT(HOUR FROM (hora_fim - hora_inicio)) * 60 + EXTRACT(MINUTE FROM (hora_fim - hora_inicio))),
  
  -- Tipo e Local
  tipo_entrevista VARCHAR2(50) CHECK (tipo_entrevista IN ('CADASTRO_INICIAL','ACOMPANHAMENTO','EMERGENCIAL','RECADASTRAMENTO','DESLIGAMENTO')),
  local_entrevista VARCHAR2(100) CHECK (local_entrevista IN ('DOMICILIO','CEPAS','COMUNIDADE','ESCOLA','UBS','OUTRO')),
  outro_local VARCHAR2(150),
  
  -- Participantes
  entrevistado VARCHAR2(150),
  relacao_entrevistado VARCHAR2(100),
  telefone_contato VARCHAR2(30),
  outras_pessoas_presentes VARCHAR2(300),
  
  -- Situação da Família
  situacao_encontrada VARCHAR2(50) CHECK (situacao_encontrada IN ('NORMAL','VULNERABILIDADE_LEVE','VULNERABILIDADE_GRAVE','SITUACAO_RISCO','EMERGENCIAL')),
  demandas_identificadas VARCHAR2(1000),
  encaminhamentos_realizados VARCHAR2(1000),
  
  -- Próximos Passos
  proxima_visita DATE,
  acoes_planejadas VARCHAR2(1000),
  responsavel_acoes VARCHAR2(200),
  
  -- Observações
  observacoes CLOB,
  observacoes_tecnicas CLOB, -- Apenas para equipe
  
  -- Status
  status_entrevista VARCHAR2(30) CHECK (status_entrevista IN ('AGENDADA','REALIZADA','CANCELADA','REAGENDADA')) DEFAULT 'AGENDADA',
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_entrevista_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE INDEX idx_entrevista_familia ON Entrevista(id_familia);
CREATE INDEX idx_entrevista_data ON Entrevista(data_entrevista);
CREATE INDEX idx_entrevista_tipo ON Entrevista(tipo_entrevista);

-- ========================
-- Entrevista x Monitor (Expandida)
-- ========================
CREATE TABLE EntrevistaMonitor (
  id_entrevista_monitor NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_entrevista NUMBER NOT NULL,
  id_monitor NUMBER NOT NULL,
  funcao_entrevista VARCHAR2(50) CHECK (funcao_entrevista IN ('RESPONSAVEL','ACOMPANHANTE','SUPERVISOR','TRADUTOR')) DEFAULT 'RESPONSAVEL',
  presente NUMBER(1,0) CHECK (presente IN (0,1)) DEFAULT 1,
  observacoes VARCHAR2(300),
  
  CONSTRAINT fk_em_entrevista FOREIGN KEY (id_entrevista) REFERENCES Entrevista(id_entrevista),
  CONSTRAINT fk_em_monitor FOREIGN KEY (id_monitor) REFERENCES Monitor(id_monitor),
  CONSTRAINT uq_em UNIQUE (id_entrevista, id_monitor)
);

-- ========================
-- Programas e Benefícios
-- ========================
CREATE TABLE Programa (
  id_programa NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_programa VARCHAR2(200) NOT NULL,
  codigo_programa VARCHAR2(50) UNIQUE,
  descricao CLOB,
  orgao_responsavel VARCHAR2(200),
  tipo_programa VARCHAR2(50) CHECK (tipo_programa IN ('FEDERAL','ESTADUAL','MUNICIPAL','ONG','PRIVADO')),
  area_atuacao VARCHAR2(100), -- Saúde, Educação, Assistência Social, etc.
  valor_beneficio NUMBER(10,2),
  periodicidade VARCHAR2(30),
  criterios_elegibilidade CLOB,
  documentos_necessarios CLOB,
  status VARCHAR2(20) CHECK (status IN ('ATIVO','SUSPENSO','ENCERRADO')) DEFAULT 'ATIVO',
  data_inicio DATE,
  data_fim DATE,
  
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

-- ========================
-- Família x Programas
-- ========================
CREATE TABLE FamiliaPrograma (
  id_familia_programa NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  id_programa NUMBER NOT NULL,
  
  -- Status da Participação
  status_participacao VARCHAR2(30) CHECK (status_participacao IN ('INSCRITA','APROVADA','ATIVA','SUSPENSA','CANCELADA','CONCLUIDA')) DEFAULT 'INSCRITA',
  data_inscricao DATE NOT NULL,
  data_aprovacao DATE,
  data_inicio_beneficio DATE,
  data_fim_beneficio DATE,
  
  -- Valores e Pagamentos
  valor_mensal NUMBER(10,2),
  valor_total_recebido NUMBER(10,2) DEFAULT 0,
  
  -- Motivos e Observações
  motivo_inscricao VARCHAR2(500),
  motivo_cancelamento VARCHAR2(500),
  observacoes VARCHAR2(1000),
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_fp_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_fp_programa FOREIGN KEY (id_programa) REFERENCES Programa(id_programa),
  CONSTRAINT uq_familia_programa UNIQUE (id_familia, id_programa)
);

-- ========================
-- Crianças atendidas no CEPAS (Expandida)
-- ========================
CREATE TABLE CriancaCepas (
  id_crianca NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_membro NUMBER NOT NULL,
  codigo_crianca VARCHAR2(30) UNIQUE,
  
  -- Período de Atendimento
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status_atendimento VARCHAR2(30) CHECK (status_atendimento IN ('ATIVA','TRANSFERIDA','DESLIGADA','CONCLUIDA','EVADIDA')) DEFAULT 'ATIVA',
  
  -- Modalidade de Atendimento
  turno VARCHAR2(20) CHECK (turno IN ('Manhã','Tarde','Integral')),
  programa_especifico VARCHAR2(150),
  atividade VARCHAR2(150),
  grupo_idade VARCHAR2(50),
  
  -- Educação
  escola_origem VARCHAR2(200),
  serie_escolar VARCHAR2(50),
  situacao_escolar VARCHAR2(100),
  dificuldades_aprendizagem NUMBER(1,0) CHECK (dificuldades_aprendizagem IN (0,1)) DEFAULT 0,
  tipo_dificuldade VARCHAR2(300),
  
  -- Desenvolvimento
  nivel_desenvolvimento VARCHAR2(50) CHECK (nivel_desenvolvimento IN ('ADEQUADO','LEVE_ATRASO','MODERADO_ATRASO','GRAVE_ATRASO')),
  necessidades_especiais NUMBER(1,0) CHECK (necessidades_especiais IN (0,1)) DEFAULT 0,
  tipos_necessidades VARCHAR2(300),
  
  -- Comportamento Social
  comportamento_social VARCHAR2(50) CHECK (comportamento_social IN ('ADEQUADO','TIMIDO','AGRESSIVO','HIPERATIVO','INTROVERTIDO')),
  relacionamento_pares VARCHAR2(200),
  relacionamento_adultos VARCHAR2(200),
  
  -- Participação da Família
  frequencia_familia VARCHAR2(50) CHECK (frequencia_familia IN ('ALTA','MEDIA','BAIXA','AUSENTE')),
  participacao_reunioes NUMBER(1,0) CHECK (participacao_reunioes IN (0,1)) DEFAULT 0,
  
  -- Resultados
  objetivos_trabalhados VARCHAR2(1000),
  progressos_observados VARCHAR2(1000),
  desafios_enfrentados VARCHAR2(1000),
  
  -- Desligamento
  motivo_desligamento VARCHAR2(300),
  encaminhamentos_realizados VARCHAR2(500),
  
  -- Observações
  observacoes CLOB,
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_crianca_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

CREATE INDEX idx_crianca_membro ON CriancaCepas(id_membro);
CREATE INDEX idx_crianca_status ON CriancaCepas(status_atendimento);
CREATE INDEX idx_crianca_data_inicio ON CriancaCepas(data_inicio);

-- ========================
-- Acompanhamento e Avaliações
-- ========================
CREATE TABLE Avaliacao (
  id_avaliacao NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  id_crianca_cepas NUMBER, -- Opcional, se for avaliação específica de criança
  
  -- Dados da Avaliação
  data_avaliacao DATE NOT NULL,
  tipo_avaliacao VARCHAR2(50) CHECK (tipo_avaliacao IN ('INICIAL','PERIODICA','FINAL','EXTRAORDINARIA')),
  periodo_referencia VARCHAR2(100), -- Ex: "Janeiro-Março 2024"
  
  -- Dimensões Avaliadas
  dimensao_habitacao NUMBER(1) CHECK (dimensao_habitacao BETWEEN 1 AND 5), -- 1=Péssimo, 5=Ótimo
  dimensao_saude NUMBER(1) CHECK (dimensao_saude BETWEEN 1 AND 5),
  dimensao_educacao NUMBER(1) CHECK (dimensao_educacao BETWEEN 1 AND 5),
  dimensao_renda NUMBER(1) CHECK (dimensao_renda BETWEEN 1 AND 5),
  dimensao_social NUMBER(1) CHECK (dimensao_social BETWEEN 1 AND 5),
  dimensao_documentacao NUMBER(1) CHECK (dimensao_documentacao BETWEEN 1 AND 5),
  
  -- Pontuação Geral
  pontuacao_total NUMBER(3,1) GENERATED ALWAYS AS ((NVL(dimensao_habitacao,0) + NVL(dimensao_saude,0) + NVL(dimensao_educacao,0) + NVL(dimensao_renda,0) + NVL(dimensao_social,0) + NVL(dimensao_documentacao,0))/6),
  
  -- Observações por Dimensão
  obs_habitacao VARCHAR2(500),
  obs_saude VARCHAR2(500),
  obs_educacao VARCHAR2(500),
  obs_renda VARCHAR2(500),
  obs_social VARCHAR2(500),
  obs_documentacao VARCHAR2(500),
  
  -- Plano de Ação
  objetivos_proxima_avaliacao VARCHAR2(1000),
  acoes_prioritarias VARCHAR2(1000),
  responsavel_acompanhamento VARCHAR2(200),
  data_proxima_avaliacao DATE,
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_avaliacao_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_avaliacao_crianca FOREIGN KEY (id_crianca_cepas) REFERENCES CriancaCepas(id_crianca)
);

CREATE INDEX idx_avaliacao_familia ON Avaliacao(id_familia);
CREATE INDEX idx_avaliacao_data ON Avaliacao(data_avaliacao);

-- ========================
-- Encaminhamentos
-- ========================
CREATE TABLE Encaminhamento (
  id_encaminhamento NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  id_membro NUMBER, -- Opcional, se for encaminhamento específico
  
  -- Dados do Encaminhamento
  data_encaminhamento DATE NOT NULL,
  tipo_servico VARCHAR2(100), -- Saúde, Educação, Documentação, etc.
  orgao_destino VARCHAR2(200),
  contato_orgao VARCHAR2(200),
  telefone_orgao VARCHAR2(30),
  
  -- Motivo e Descrição
  motivo_encaminhamento VARCHAR2(500),
  urgencia VARCHAR2(20) CHECK (urgencia IN ('BAIXA','MEDIA','ALTA','URGENTE')) DEFAULT 'MEDIA',
  
  -- Acompanhamento
  status_encaminhamento VARCHAR2(30) CHECK (status_encaminhamento IN ('ENVIADO','EM_ANDAMENTO','ATENDIDO','NAO_ATENDIDO','CANCELADO')) DEFAULT 'ENVIADO',
  data_retorno DATE,
  resultado_obtido VARCHAR2(1000),
  
  -- Documentos
  documento_enviado VARCHAR2(200),
  numero_protocolo VARCHAR2(50),
  
  -- Observações
  observacoes VARCHAR2(1000),
  
  -- Auditoria
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  
  CONSTRAINT fk_encaminhamento_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_encaminhamento_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

CREATE INDEX idx_encaminhamento_familia ON Encaminhamento(id_familia);
CREATE INDEX idx_encaminhamento_status ON Encaminhamento(status_encaminhamento);
CREATE INDEX idx_encaminhamento_data ON Encaminhamento(data_encaminhamento);

-- ========================
-- Histórico de Alterações (Auditoria)
-- ========================
CREATE TABLE HistoricoAlteracao (
  id_historico NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabela_alterada VARCHAR2(50) NOT NULL,
  id_registro NUMBER NOT NULL,
  tipo_operacao VARCHAR2(10) CHECK (tipo_operacao IN ('INSERT','UPDATE','DELETE')),
  campos_alterados VARCHAR2(1000), -- JSON com campos que mudaram
  valores_anteriores CLOB, -- JSON com valores antigos
  valores_novos CLOB, -- JSON com valores novos
  data_alteracao DATE DEFAULT SYSDATE,
  usuario_alteracao VARCHAR2(100),
  ip_origem VARCHAR2(45),
  motivo_alteracao VARCHAR2(300)
);

CREATE INDEX idx_historico_tabela_id ON HistoricoAlteracao(tabela_alterada, id_registro);
CREATE INDEX idx_historico_data ON HistoricoAlteracao(data_alteracao);
CREATE INDEX idx_historico_usuario ON HistoricoAlteracao(usuario_alteracao);

-- ========================
-- VIEWS PARA RELATÓRIOS
-- ========================

-- View: Resumo Completo da Família
CREATE OR REPLACE VIEW vw_familia_completa AS
SELECT 
    f.id_familia,
    f.nome_familia,
    f.codigo_familia,
    f.nome_responsavel,
    f.cpf_responsavel,
    f.telefone_responsavel,
    f.renda_familiar,
    f.numero_membros,
    f.nivel_vulnerabilidade,
    f.status_familia,
    f.data_cadastro,
    f.data_ultima_visita,
    
    -- Endereço
    e.logradouro || ', ' || e.numero_casa || ' - ' || e.bairro || ', ' || e.cidade || '/' || e.estado AS endereco_completo,
    a.nome_area,
    r.nome_regiao,
    
    -- Monitor
    m.nome AS monitor_responsavel,
    m.telefone AS telefone_monitor,
    
    -- Estatísticas
    (SELECT COUNT(*) FROM Membro mb WHERE mb.id_familia = f.id_familia AND mb.status_membro = 'ATIVO') AS total_membros_ativo,
    (SELECT COUNT(*) FROM CriancaCepas cc JOIN Membro mb2 ON cc.id_membro = mb2.id_membro WHERE mb2.id_familia = f.id_familia AND cc.status_atendimento = 'ATIVA') AS criancas_cepas_ativas,
    (SELECT COUNT(*) FROM Entrevista ent WHERE ent.id_familia = f.id_familia) AS total_entrevistas,
    (SELECT MAX(ent2.data_entrevista) FROM Entrevista ent2 WHERE ent2.id_familia = f.id_familia) AS data_ultima_entrevista

FROM Familia f
LEFT JOIN Endereco e ON f.id_familia = e.id_familia
LEFT JOIN Area a ON e.id_area = a.id_area
LEFT JOIN Regiao r ON a.id_regiao = r.id_regiao
LEFT JOIN Monitor m ON f.monitor_responsavel = m.id_monitor
WHERE f.status_familia = 'ATIVA';

-- View: Dashboard de Indicadores
CREATE OR REPLACE VIEW vw_dashboard_indicadores AS
SELECT 
    -- Totais Gerais
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA') AS total_familias_ativas,
    (SELECT COUNT(*) FROM Membro m JOIN Familia f ON m.id_familia = f.id_familia WHERE m.status_membro = 'ATIVO' AND f.status_familia = 'ATIVA') AS total_membros_ativos,
    (SELECT COUNT(*) FROM CriancaCepas WHERE status_atendimento = 'ATIVA') AS total_criancas_cepas,
    
    -- Por Nível de Vulnerabilidade
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND nivel_vulnerabilidade = 'CRITICO') AS familias_vulnerabilidade_critica,
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND nivel_vulnerabilidade = 'ALTO') AS familias_vulnerabilidade_alta,
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND nivel_vulnerabilidade = 'MEDIO') AS familias_vulnerabilidade_media,
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND nivel_vulnerabilidade = 'BAIXO') AS familias_vulnerabilidade_baixa,
    
    -- Indicadores de Saúde
    (SELECT COUNT(DISTINCT sm.id_membro) FROM SaudeMembro sm JOIN Membro m ON sm.id_membro = m.id_membro JOIN Familia f ON m.id_familia = f.id_familia WHERE f.status_familia = 'ATIVA' AND (sm.hipertensao = 1 OR sm.diabetes = 1)) AS membros_doencas_cronicas,
    
    -- Indicadores Habitacionais
    (SELECT COUNT(*) FROM Familia f JOIN EstruturaHabitacao eh ON f.id_familia = eh.id_familia WHERE f.status_familia = 'ATIVA' AND eh.energia_eletrica = 0) AS familias_sem_energia,
    (SELECT COUNT(*) FROM Familia f JOIN RecursoSaneamento rs ON f.id_familia = rs.id_familia WHERE f.status_familia = 'ATIVA' AND rs.tem_banheiro = 0) AS familias_sem_banheiro,
    
    -- Indicadores Socioeconômicos
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND renda_familiar < 300) AS familias_extrema_pobreza,
    (SELECT COUNT(*) FROM Familia WHERE status_familia = 'ATIVA' AND recebe_beneficio = 1) AS familias_com_beneficio
FROM DUAL;

-- ========================
-- TRIGGERS DE AUDITORIA
-- ========================

-- Trigger para manter histórico de alterações na tabela Família
CREATE OR REPLACE TRIGGER trg_familia_audit
AFTER INSERT OR UPDATE OR DELETE ON Familia
FOR EACH ROW
DECLARE
    v_operacao VARCHAR2(10);
    v_id_registro NUMBER;
BEGIN
    IF INSERTING THEN
        v_operacao := 'INSERT';
        v_id_registro := :NEW.id_familia;
    ELSIF UPDATING THEN
        v_operacao := 'UPDATE';
        v_id_registro := :NEW.id_familia;
    ELSIF DELETING THEN
        v_operacao := 'DELETE';
        v_id_registro := :OLD.id_familia;
    END IF;
    
    INSERT INTO HistoricoAlteracao (
        tabela_alterada, id_registro, tipo_operacao, 
        data_alteracao, usuario_alteracao
    ) VALUES (
        'Familia', v_id_registro, v_operacao,
        SYSDATE, USER
    );
END;
/

-- ========================
-- ÍNDICES PARA PERFORMANCE
-- ========================

-- Família
CREATE INDEX idx_familia_status ON Familia(status_familia);
CREATE INDEX idx_familia_vulnerabilidade ON Familia(nivel_vulnerabilidade);
CREATE INDEX idx_familia_data_cadastro ON Familia(data_cadastro);
CREATE INDEX idx_familia_monitor ON Familia(monitor_responsavel);
CREATE INDEX idx_familia_cpf_resp ON Familia(cpf_responsavel);

-- Membro
CREATE INDEX idx_membro_status ON Membro(status_membro);
CREATE INDEX idx_membro_responsavel ON Membro(is_responsavel);
CREATE INDEX idx_membro_cpf ON Membro(cpf);
CREATE INDEX idx_membro_data_nasc ON Membro(data_nascimento);

-- Endereço
CREATE INDEX idx_endereco_cep ON Endereco(cep);
CREATE INDEX idx_endereco_cidade ON Endereco(cidade);
CREATE INDEX idx_endereco_validado ON Endereco(endereco_validado);

-- Performance para consultas frequentes
CREATE INDEX idx_familia_programa_status ON FamiliaPrograma(status_participacao);
CREATE INDEX idx_encaminhamento_urgencia ON Encaminhamento(urgencia);

-- ========================
-- COMENTÁRIOS NAS TABELAS
-- ========================

COMMENT ON TABLE Familia IS 'Tabela principal com dados das famílias atendidas, incluindo informações do responsável e situação socioeconômica';
COMMENT ON TABLE Membro IS 'Membros de cada família com dados pessoais, educação, trabalho e documentação';
COMMENT ON TABLE SaudeMembro IS 'Informações detalhadas de saúde de cada membro da família';
COMMENT ON TABLE EstruturaHabitacao IS 'Características da moradia, infraestrutura e equipamentos disponíveis';
COMMENT ON TABLE RecursoSaneamento IS 'Condições de saneamento, gestão de resíduos e recursos para produção de alimentos';
COMMENT ON TABLE Entrevista IS 'Registro de todas as entrevistas e visitas realizadas às famílias';
COMMENT ON TABLE CriancaCepas IS 'Dados específicos das crianças atendidas nos programas do CEPAS';
COMMENT ON TABLE Programa IS 'Cadastro dos programas e benefícios sociais disponíveis';
COMMENT ON TABLE FamiliaPrograma IS 'Vínculo das famílias com os programas sociais e status de participação';
COMMENT ON TABLE Avaliacao IS 'Avaliações periódicas das famílias em múltiplas dimensões sociais';
COMMENT ON TABLE Encaminhamento IS 'Registro de encaminhamentos para serviços públicos e acompanhamento dos resultados';

-- ========================
-- DADOS INICIAIS BÁSICOS
-- ========================

-- Inserir usuário administrador padrão
INSERT INTO Usuario (nome_completo, email, senha_hash, perfil) 
VALUES ('Administrador Sistema', 'admin@cepas.org', 'hash_senha_admin', 'ADMIN');

-- Inserir algumas áreas exemplo
INSERT INTO Area (nome_area, codigo_area, nivel_vulnerabilidade) VALUES 
('Centro da Cidade', 'AREA001', 'BAIXO'),
('Periferia Norte', 'AREA002', 'ALTO'),
('Zona Rural', 'AREA003', 'MEDIO');

-- Inserir alguns programas sociais básicos
INSERT INTO Programa (nome_programa, codigo_programa, tipo_programa, area_atuacao, status) VALUES 
('Bolsa Família', 'BF2024', 'FEDERAL', 'Assistência Social', 'ATIVO'),
('Auxílio Brasil', 'AB2024', 'FEDERAL', 'Assistência Social', 'ATIVO'),
('Vale Gás', 'VG2024', 'FEDERAL', 'Assistência Social', 'ATIVO');

COMMIT;