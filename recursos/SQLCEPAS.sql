-- ========================
-- Monitores
-- ========================
CREATE TABLE Monitor (
  id_monitor NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR2(150) NOT NULL,
  telefone VARCHAR2(30),
  email VARCHAR2(150) NOT NULL,
  observacao VARCHAR2(200),
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

-- ========================
-- Áreas
-- ========================
CREATE TABLE Area (
  id_area NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_area VARCHAR2(80) NOT NULL UNIQUE,
  descricao VARCHAR2(200)
);

-- ========================
-- Família
-- ========================
CREATE TABLE Familia (
  id_familia NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_familia VARCHAR2(150) NOT NULL,
  migracao VARCHAR2(50),
  estado_origem VARCHAR2(80),
  cidade_origem VARCHAR2(80),
  recebe_beneficio NUMBER(1,0) NOT NULL CHECK (recebe_beneficio IN (0,1)),
  possui_plano_saude NUMBER(1,0) NOT NULL CHECK (possui_plano_saude IN (0,1)),
  convenio VARCHAR2(120),
  observacoes CLOB,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

-- ========================
-- Entrevista
-- ========================
CREATE TABLE Entrevista (
  id_entrevista NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  data_entrevista DATE NOT NULL,
  entrevistado VARCHAR2(150),
  telefone_contato VARCHAR2(30),
  observacoes CLOB,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  CONSTRAINT fk_entrevista_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE INDEX idx_entrevista_familia ON Entrevista(id_familia);

-- ========================
-- Entrevista x Monitor
-- ========================
CREATE TABLE EntrevistaMonitor (
  id_entrevista_monitor NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_entrevista NUMBER NOT NULL,
  id_monitor NUMBER NOT NULL,
  CONSTRAINT fk_em_entrevista FOREIGN KEY (id_entrevista) REFERENCES Entrevista(id_entrevista),
  CONSTRAINT fk_em_monitor FOREIGN KEY (id_monitor) REFERENCES Monitor(id_monitor),
  CONSTRAINT uq_em UNIQUE (id_entrevista, id_monitor)
);

-- ========================
-- Endereço (1:1 Família)
-- ========================
CREATE TABLE Endereco (
  id_endereco NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  id_area NUMBER,
  quadra VARCHAR2(30),
  rua VARCHAR2(100),
  numero_casa VARCHAR2(20),
  complemento VARCHAR2(150),
  CONSTRAINT fk_endereco_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_endereco_area FOREIGN KEY (id_area) REFERENCES Area(id_area)
);

-- ========================
-- Membros da Família
-- ========================
CREATE TABLE Membro (
  id_membro NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  nome VARCHAR2(150) NOT NULL,
  data_nascimento DATE,
  relacao VARCHAR2(80),
  ocupacao VARCHAR2(120),
  sexo VARCHAR2(20),
  cor VARCHAR2(50),
  estado_civil VARCHAR2(40),
  alfabetizado NUMBER(1,0) NOT NULL CHECK (alfabetizado IN (0,1)),
  religiao VARCHAR2(80),
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  CONSTRAINT fk_membro_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE INDEX idx_membro_familia ON Membro(id_familia);

-- ========================
-- Animais da Família (1:1 Família)
-- ========================
CREATE TABLE Animal (
  id_animal NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  tem_animal NUMBER(1,0) NOT NULL CHECK (tem_animal IN (0,1)),
  qtd_animais NUMBER,
  qual_animal VARCHAR2(30),
  CONSTRAINT fk_animal_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Estrutura da Habitação (1:1 Família)
-- ========================
CREATE TABLE EstruturaHabitacao (
  id_estrutura NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  tipo_habitacao VARCHAR2(50),
  tipo_lote VARCHAR2(50),
  situacao_convivencia VARCHAR2(50),
  energia_eletrica NUMBER(1,0) NOT NULL CHECK (energia_eletrica IN (0,1)),
  material_parede VARCHAR2(50),
  material_piso VARCHAR2(50),
  material_cobertura VARCHAR2(50),
  qtd_quartos NUMBER,
  qtd_camas NUMBER,
  tipo_camas VARCHAR2(100),
  CONSTRAINT fk_estrutura_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Recursos de Saneamento (1:1 Família)
-- ========================
CREATE TABLE RecursoSaneamento (
  id_recurso NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  horta NUMBER(1,0) NOT NULL CHECK (horta IN (0,1)),
  arvore_frutifera NUMBER(1,0) NOT NULL CHECK (arvore_frutifera IN (0,1)),
  como_escoa VARCHAR2(50),
  tem_banheiro NUMBER(1,0) NOT NULL CHECK (tem_banheiro IN (0,1)),
  dest_lixo VARCHAR2(20) CHECK (dest_lixo IN ('Coleta pública','Céu aberto','Enterra','Queima')),
  bebe_agua VARCHAR2(20) CHECK (bebe_agua IN ('Filtrada','Fervida','Tratada','Sem tratamento')),
  trata_agua VARCHAR2(20) CHECK (trata_agua IN ('Fervida','Coleta','Cisterna','Poço')),
  CONSTRAINT fk_saneamento_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

-- ========================
-- Saúde dos Membros
-- ========================
CREATE TABLE SaudeMembro (
  id_saude NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_membro NUMBER NOT NULL UNIQUE,
  hipertensao NUMBER(1,0) NOT NULL CHECK (hipertensao IN (0,1)),
  diabetes NUMBER(1,0) NOT NULL CHECK (diabetes IN (0,1)),
  tabagismo NUMBER(1,0) NOT NULL CHECK (tabagismo IN (0,1)),
  etilismo NUMBER(1,0) NOT NULL CHECK (etilismo IN (0,1)),
  sedentarismo NUMBER(1,0) NOT NULL CHECK (sedentarismo IN (0,1)),
  hospitalizacao NUMBER(1,0) NOT NULL CHECK (hospitalizacao IN (0,1)),
  vacinacao_em_dia NUMBER(1,0) NOT NULL CHECK (vacinacao_em_dia IN (0,1)),
  cirurgias NUMBER(1,0) NOT NULL CHECK (cirurgias IN (0,1)),
  obesidade NUMBER(1,0) NOT NULL CHECK (obesidade IN (0,1)),
  gestante NUMBER(1,0) NOT NULL CHECK (gestante IN (0,1)),
  outras_condicoes CLOB,
  CONSTRAINT fk_saude_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

-- ========================
-- Crianças atendidas no CEPAS
-- ========================
CREATE TABLE CriancaCepas (
  id_crianca NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_membro NUMBER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  turno VARCHAR2(20) CHECK (turno IN ('Manhã','Tarde','Integral')),
  atividade VARCHAR2(150),
  observacoes CLOB,
  CONSTRAINT fk_crianca_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

CREATE INDEX idx_crianca_membro ON CriancaCepas(id_membro);
