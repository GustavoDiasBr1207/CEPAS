-- ========================
-- Sistema de Autenticação - BASEADO NA SINTAXE ORIGINAL
-- ========================

-- ========================
-- Usuários
-- ========================
CREATE TABLE Usuario (
  id_usuario NUMBER PRIMARY KEY,
  username VARCHAR2(50) NOT NULL UNIQUE,
  nome_completo VARCHAR2(150) NOT NULL,
  email VARCHAR2(150) NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  tipo_usuario VARCHAR2(20) CHECK (tipo_usuario IN ('admin','coordenador','monitor','visualizador')) DEFAULT 'visualizador',
  ativo NUMBER(1,0) CHECK (ativo IN (0,1)) DEFAULT 1,
  ultimo_login DATE,
  tentativas_login NUMBER DEFAULT 0,
  bloqueado_ate DATE,
  token_reset VARCHAR2(255),
  token_reset_expira DATE,
  created_at DATE DEFAULT SYSDATE,
  updated_at DATE,
  usuario_responsavel VARCHAR2(100)
);

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
-- Tokens de Refresh (Para JWT)
-- ========================
CREATE TABLE RefreshToken (
  id_token NUMBER PRIMARY KEY,
  id_usuario NUMBER NOT NULL,
  token_hash VARCHAR2(255) NOT NULL,
  expires_at DATE NOT NULL,
  revogado NUMBER(1,0) CHECK (revogado IN (0,1)) DEFAULT 0,
  ip_address VARCHAR2(45),
  user_agent VARCHAR2(500),
  created_at DATE DEFAULT SYSDATE,
  CONSTRAINT fk_refresh_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

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
-- Log de Ações do Sistema (Auditoria)
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
  created_at DATE DEFAULT SYSDATE,
  CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

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
-- Relacionar Monitor com Usuario (Opcional)
-- ========================
ALTER TABLE Monitor ADD id_usuario NUMBER;
ALTER TABLE Monitor ADD CONSTRAINT fk_monitor_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario);

-- ========================
-- Dados Iniciais de Usuários
-- ========================
-- Admin padrão (senha: admin123) - Hash temporário, será atualizado
INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('admin', 'Administrador do Sistema', 'admin@cepas.com', 'temp_admin', 'admin', 'SISTEMA');

-- Monitor de exemplo (senha: monitor123) - Hash temporário, será atualizado
INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('monitor1', 'Monitor', 'monitor@cepas.com', 'temp_monitor', 'monitor', 'admin');

-- Visualizador de exemplo (senha: visual123) - Hash temporário, será atualizado
INSERT INTO Usuario (username, nome_completo, email, password_hash, tipo_usuario, usuario_responsavel) 
VALUES ('visual1', 'Visualizador', 'visualizador@cepas.com', 'temp_visual', 'visualizador', 'admin');

COMMIT;