-- ========================
-- Sistema de Autenticação - VERSÃO FINAL SEM ERROS
-- ========================

-- Primeiro vamos dropar tudo que possa existir para começar limpo
BEGIN
  FOR c IN (SELECT table_name FROM user_tables WHERE table_name IN ('USUARIO', 'REFRESHTOKEN', 'LOGSISTEMA')) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || c.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

BEGIN
  FOR c IN (SELECT sequence_name FROM user_sequences WHERE sequence_name IN ('SEQ_USUARIO', 'SEQ_REFRESHTOKEN', 'SEQ_LOGSISTEMA')) LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || c.sequence_name;
  END LOOP;
END;
/

-- Remover coluna id_usuario da tabela Monitor se existir
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE Monitor DROP COLUMN id_usuario';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

-- ========================
-- Usuários
-- ========================
CREATE TABLE Usuario (
  id_usuario NUMBER PRIMARY KEY,
  username VARCHAR2(50) NOT NULL UNIQUE,
  nome_completo VARCHAR2(150) NOT NULL,
  email VARCHAR2(150) NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  tipo_usuario VARCHAR2(20) DEFAULT 'visualizador',
  ativo NUMBER(1,0) DEFAULT 1,
  ultimo_login DATE,
  tentativas_login NUMBER DEFAULT 0,
  bloqueado_ate DATE,
  token_reset VARCHAR2(255),
  token_reset_expira DATE,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

-- Adicionar constraints separadamente para evitar ORA-00907
ALTER TABLE Usuario ADD CONSTRAINT chk_tipo_usuario CHECK (tipo_usuario IN ('admin','coordenador','monitor','visualizador'));
ALTER TABLE Usuario ADD CONSTRAINT chk_ativo CHECK (ativo IN (0,1));

CREATE SEQUENCE seq_usuario START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_usuario_id
BEFORE INSERT ON Usuario
FOR EACH ROW
BEGIN
  IF :NEW.id_usuario IS NULL THEN
    :NEW.id_usuario := seq_usuario.NEXTVAL;
  END IF;
END;
/

-- ========================
-- Tokens de Refresh
-- ========================
CREATE TABLE RefreshToken (
  id_token NUMBER PRIMARY KEY,
  id_usuario NUMBER NOT NULL,
  token_hash VARCHAR2(255) NOT NULL,
  expires_at DATE NOT NULL,
  revogado NUMBER(1,0) DEFAULT 0,
  ip_address VARCHAR2(45),
  user_agent VARCHAR2(500),
  created_at DATE DEFAULT SYSDATE
);

-- Adicionar constraints separadamente
ALTER TABLE RefreshToken ADD CONSTRAINT chk_revogado CHECK (revogado IN (0,1));
ALTER TABLE RefreshToken ADD CONSTRAINT fk_refresh_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario);

CREATE SEQUENCE seq_refreshtoken START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_refreshtoken_id
BEFORE INSERT ON RefreshToken
FOR EACH ROW
BEGIN
  IF :NEW.id_token IS NULL THEN
    :NEW.id_token := seq_refreshtoken.NEXTVAL;
  END IF;
END;
/

CREATE INDEX idx_refresh_usuario ON RefreshToken(id_usuario);
CREATE INDEX idx_refresh_token ON RefreshToken(token_hash);

-- ========================
-- Log do Sistema
-- ========================
CREATE TABLE LogSistema (
  id_log NUMBER PRIMARY KEY,
  id_usuario NUMBER,
  acao VARCHAR2(100) NOT NULL,
  tabela_afetada VARCHAR2(50),
  id_registro NUMBER,
  ip_address VARCHAR2(45),
  user_agent VARCHAR2(500),
  detalhes CLOB,
  created_at DATE DEFAULT SYSDATE
);

-- Adicionar constraint separadamente
ALTER TABLE LogSistema ADD CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario);

CREATE SEQUENCE seq_logsistema START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER trg_logsistema_id
BEFORE INSERT ON LogSistema
FOR EACH ROW
BEGIN
  IF :NEW.id_log IS NULL THEN
    :NEW.id_log := seq_logsistema.NEXTVAL;
  END IF;
END;
/

CREATE INDEX idx_log_usuario ON LogSistema(id_usuario);
CREATE INDEX idx_log_acao ON LogSistema(acao);
CREATE INDEX idx_log_data ON LogSistema(created_at);

-- ========================
-- Relacionar Monitor com Usuario
-- ========================
-- Verificar se tabela Monitor existe antes de alterar
DECLARE
  table_exists NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO table_exists FROM user_tables WHERE table_name = 'MONITOR';
  
  IF table_exists > 0 THEN
    -- Adicionar coluna se não existir
    BEGIN
      EXECUTE IMMEDIATE 'ALTER TABLE Monitor ADD id_usuario NUMBER';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -1430 THEN -- Coluna já existe
          NULL;
        ELSE
          RAISE;
        END IF;
    END;
    
    -- Adicionar constraint se não existir
    BEGIN
      EXECUTE IMMEDIATE 'ALTER TABLE Monitor ADD CONSTRAINT fk_monitor_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -2275 THEN -- Constraint já existe
          NULL;
        ELSE
          RAISE;
        END IF;
    END;
  END IF;
END;
/

-- ========================
-- Dados Iniciais
-- ========================
INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('admin', 'Administrador do Sistema', 'admin@cepas.com', 'temp_admin', 'admin', 'SISTEMA');

INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('monitor1', 'Monitor', 'monitor@cepas.com', 'temp_monitor', 'monitor', 'admin');

INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('visual1', 'Visualizador', 'visualizador@cepas.com', 'temp_visual', 'visualizador', 'admin');

COMMIT;

-- Verificação final
SELECT 'Tabelas de autenticação criadas com sucesso!' as resultado FROM dual;
SELECT table_name FROM user_tables WHERE table_name IN ('USUARIO', 'REFRESHTOKEN', 'LOGSISTEMA') ORDER BY table_name;