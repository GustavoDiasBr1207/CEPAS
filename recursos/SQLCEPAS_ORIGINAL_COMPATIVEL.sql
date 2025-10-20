-- ========================
-- Monitores
-- ========================
CREATE TABLE Monitor (
  id_monitor NUMBER PRIMARY KEY,
  nome VARCHAR2(150) NOT NULL,
  telefone VARCHAR2(30),
  email VARCHAR2(150) NOT NULL,
  observacao VARCHAR2(200),
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

CREATE SEQUENCE seq_monitor START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_monitor_id
BEFORE INSERT ON Monitor
FOR EACH ROW
BEGIN
  IF :NEW.id_monitor IS NULL THEN
    :NEW.id_monitor := seq_monitor.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Áreas
-- ========================
CREATE TABLE Area (
  id_area NUMBER PRIMARY KEY,
  nome_area VARCHAR2(80) NOT NULL UNIQUE,
  descricao VARCHAR2(200)
);

CREATE SEQUENCE seq_area START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_area_id
BEFORE INSERT ON Area
FOR EACH ROW
BEGIN
  IF :NEW.id_area IS NULL THEN
    :NEW.id_area := seq_area.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Família
-- ========================
CREATE TABLE Familia (
  id_familia NUMBER PRIMARY KEY,
  nome_familia VARCHAR2(150) NOT NULL,
  migracao VARCHAR2(50),
  estado_origem VARCHAR2(80),
  cidade_origem VARCHAR2(80),
  recebe_beneficio NUMBER(1,0) CHECK (recebe_beneficio IN (0,1)),
  possui_plano_saude NUMBER(1,0) CHECK (possui_plano_saude IN (0,1)),
  convenio VARCHAR2(120),
  observacoes CLOB,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

CREATE SEQUENCE seq_familia START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_familia_id
BEFORE INSERT ON Familia
FOR EACH ROW
BEGIN
  IF :NEW.id_familia IS NULL THEN
    :NEW.id_familia := seq_familia.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Entrevista
-- ========================
CREATE TABLE Entrevista (
  id_entrevista NUMBER PRIMARY KEY,
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

CREATE SEQUENCE seq_entrevista START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_entrevista_id
BEFORE INSERT ON Entrevista
FOR EACH ROW
BEGIN
  IF :NEW.id_entrevista IS NULL THEN
    :NEW.id_entrevista := seq_entrevista.NEXTVAL;
  END IF;
END;
/

CREATE INDEX idx_entrevista_familia ON Entrevista(id_familia);

-- ========================
-- Entrevista x Monitor
-- ========================
CREATE TABLE EntrevistaMonitor (
  id_entrevista_monitor NUMBER PRIMARY KEY,
  id_entrevista NUMBER NOT NULL,
  id_monitor NUMBER NOT NULL,
  CONSTRAINT fk_em_entrevista FOREIGN KEY (id_entrevista) REFERENCES Entrevista(id_entrevista),
  CONSTRAINT fk_em_monitor FOREIGN KEY (id_monitor) REFERENCES Monitor(id_monitor),
  CONSTRAINT uq_em UNIQUE (id_entrevista, id_monitor)
);

CREATE SEQUENCE seq_entrevistamonitor START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_entrevistamonitor_id
BEFORE INSERT ON EntrevistaMonitor
FOR EACH ROW
BEGIN
  IF :NEW.id_entrevista_monitor IS NULL THEN
    :NEW.id_entrevista_monitor := seq_entrevistamonitor.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Endereço (1:1 Família)
-- ========================
CREATE TABLE Endereco (
  id_endereco NUMBER PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  id_area NUMBER,
  quadra VARCHAR2(30),
  rua VARCHAR2(100),
  numero_casa VARCHAR2(20),
  complemento VARCHAR2(150),
  CONSTRAINT fk_endereco_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia),
  CONSTRAINT fk_endereco_area FOREIGN KEY (id_area) REFERENCES Area(id_area)
);

CREATE SEQUENCE seq_endereco START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_endereco_id
BEFORE INSERT ON Endereco
FOR EACH ROW
BEGIN
  IF :NEW.id_endereco IS NULL THEN
    :NEW.id_endereco := seq_endereco.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Membros da Família
-- ========================
CREATE TABLE Membro (
  id_membro NUMBER PRIMARY KEY,
  id_familia NUMBER NOT NULL,
  nome VARCHAR2(150) NOT NULL,
  data_nascimento DATE,
  relacao VARCHAR2(80),
  ocupacao VARCHAR2(120),
  sexo VARCHAR2(20),
  cor VARCHAR2(50),
  estado_civil VARCHAR2(40),
  alfabetizado NUMBER(1,0) CHECK (alfabetizado IN (0,1)),
  religiao VARCHAR2(80),
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100),
  CONSTRAINT fk_membro_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE SEQUENCE seq_membro START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_membro_id
BEFORE INSERT ON Membro
FOR EACH ROW
BEGIN
  IF :NEW.id_membro IS NULL THEN
    :NEW.id_membro := seq_membro.NEXTVAL;
  END IF;
END;
/

CREATE INDEX idx_membro_familia ON Membro(id_familia);

-- ========================
-- Animais da Família (1:1 Família)
-- ========================
CREATE TABLE Animal (
  id_animal NUMBER PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  tem_animal NUMBER(1,0) CHECK (tem_animal IN (0,1)),
  qtd_animais NUMBER,
  qual_animal VARCHAR2(30),
  CONSTRAINT fk_animal_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE SEQUENCE seq_animal START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_animal_id
BEFORE INSERT ON Animal
FOR EACH ROW
BEGIN
  IF :NEW.id_animal IS NULL THEN
    :NEW.id_animal := seq_animal.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Estrutura da Habitação (1:1 Família)
-- ========================
CREATE TABLE EstruturaHabitacao (
  id_estrutura NUMBER PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  tipo_habitacao VARCHAR2(50),
  tipo_lote VARCHAR2(50),
  situacao_convivencia VARCHAR2(50),
  energia_eletrica NUMBER(1,0) CHECK (energia_eletrica IN (0,1)),
  material_parede VARCHAR2(50),
  material_piso VARCHAR2(50),
  material_cobertura VARCHAR2(50),
  qtd_quartos NUMBER,
  qtd_camas NUMBER,
  tipo_camas VARCHAR2(100),
  CONSTRAINT fk_estrutura_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE SEQUENCE seq_estruturahabitacao START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_estruturahabitacao_id
BEFORE INSERT ON EstruturaHabitacao
FOR EACH ROW
BEGIN
  IF :NEW.id_estrutura IS NULL THEN
    :NEW.id_estrutura := seq_estruturahabitacao.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Recursos de Saneamento (1:1 Família)
-- ========================
CREATE TABLE RecursoSaneamento (
  id_recurso NUMBER PRIMARY KEY,
  id_familia NUMBER NOT NULL UNIQUE,
  horta NUMBER(1,0) CHECK (horta IN (0,1)),
  arvore_frutifera NUMBER(1,0) CHECK (arvore_frutifera IN (0,1)),
  como_escoa VARCHAR2(50),
  tem_banheiro NUMBER(1,0) CHECK (tem_banheiro IN (0,1)),
  dest_lixo VARCHAR2(20) CHECK (dest_lixo IN ('Coleta pública','Céu aberto','Enterra','Queima')),
  bebe_agua VARCHAR2(20) CHECK (bebe_agua IN ('Filtrada','Fervida','Tratada','Sem tratamento')),
  trata_agua VARCHAR2(20) CHECK (trata_agua IN ('Fervida','Coleta','Cisterna','Poço')),
  CONSTRAINT fk_saneamento_familia FOREIGN KEY (id_familia) REFERENCES Familia(id_familia)
);

CREATE SEQUENCE seq_recursosaneamento START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_recursosaneamento_id
BEFORE INSERT ON RecursoSaneamento
FOR EACH ROW
BEGIN
  IF :NEW.id_recurso IS NULL THEN
    :NEW.id_recurso := seq_recursosaneamento.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Saúde dos Membros
-- ========================
CREATE TABLE SaudeMembro (
  id_saude NUMBER PRIMARY KEY,
  id_membro NUMBER NOT NULL UNIQUE,
  hipertensao NUMBER(1,0) CHECK (hipertensao IN (0,1)),
  diabetes NUMBER(1,0) CHECK (diabetes IN (0,1)),
  tabagismo NUMBER(1,0) CHECK (tabagismo IN (0,1)),
  etilismo NUMBER(1,0) CHECK (etilismo IN (0,1)),
  sedentarismo NUMBER(1,0) CHECK (sedentarismo IN (0,1)),
  hospitalizacao NUMBER(1,0) CHECK (hospitalizacao IN (0,1)),
  vacinacao_em_dia NUMBER(1,0) CHECK (vacinacao_em_dia IN (0,1)),
  cirurgias NUMBER(1,0) CHECK (cirurgias IN (0,1)),
  obesidade NUMBER(1,0) CHECK (obesidade IN (0,1)),
  gestante NUMBER(1,0) CHECK (gestante IN (0,1)),
  outras_condicoes CLOB,
  CONSTRAINT fk_saude_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

CREATE SEQUENCE seq_saudemembro START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_saudemembro_id
BEFORE INSERT ON SaudeMembro
FOR EACH ROW
BEGIN
  IF :NEW.id_saude IS NULL THEN
    :NEW.id_saude := seq_saudemembro.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Crianças atendidas no CEPAS
-- ========================
CREATE TABLE CriancaCepas (
  id_crianca NUMBER PRIMARY KEY,
  id_membro NUMBER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  turno VARCHAR2(20) CHECK (turno IN ('Manhã','Tarde','Integral')),
  atividade VARCHAR2(150),
  observacoes CLOB,
  CONSTRAINT fk_crianca_membro FOREIGN KEY (id_membro) REFERENCES Membro(id_membro)
);

CREATE SEQUENCE seq_criancacepas START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_criancacepas_id
BEFORE INSERT ON CriancaCepas
FOR EACH ROW
BEGIN
  IF :NEW.id_crianca IS NULL THEN
    :NEW.id_crianca := seq_criancacepas.NEXTVAL;
  END IF;
END;
/

CREATE INDEX idx_crianca_membro ON CriancaCepas(id_membro);

COMMIT;