const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Configurações do Oracle para o Autonomous Database
// Certifique-se de que a carteira de segurança está em um diretório acessível pelo backend.
// Recomenda-se colocar o arquivo zip da carteira no diretório raiz do projeto e descompactá-lo.
oracledb.initOracleClient({
  // Por padrão, a biblioteca 'oracledb' irá procurar por um arquivo 'sqlnet.ora'
  // na pasta TNS_ADMIN. Se você usar o 'configDir' e a 'connectString' for um TNS alias,
  // isso já deve funcionar.
  // Caso contrário, você pode especificar o caminho do instant client.
  // libDir: path.join(__dirname, 'instantclient_19_8'),
  configDir: path.join(__dirname, 'wallet') // Substitua 'wallet' pelo nome da pasta da sua carteira
});

// Configurações do banco de dados
const dbConfig = {
  user: "gustavodl",
  password: "CepasDatabase@2025",
  // A string de conexão do Autonomous Database que você forneceu.
  // Você pode escolher entre 'cepasdb_high', 'cepasdb_low', 'cepasdb_medium', 'cepasdb_tp', ou 'cepasdb_tpurgent'.
  connectString: "cepasdb_high"
};

// Rota de exemplo para listar usuários
app.get("/usuarios", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute("SELECT * FROM usuarios");
    
    // O resultado da consulta é um array de arrays. Para facilitar o consumo no frontend React,
    // é comum mapear os dados para objetos JSON mais legíveis.
    const formattedRows = result.rows.map(row => ({
      id: row[0],
      nome: row[1],
      email: row[2]
    }));
    res.json(formattedRows);
  } catch (err) {
    console.error("Erro na conexão com o banco de dados:", err);
    res.status(500).send("Erro no banco");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar a conexão:", err);
      }
    }
  }
});

// Rota de exemplo para adicionar um novo usuário
app.post("/usuarios", async (req, res) => {
  let connection;
  try {
    const { nome, email } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    const sql = "INSERT INTO usuarios (nome, email) VALUES (:1, :2)";
    const binds = [nome, email];
    await connection.execute(sql, binds, { autoCommit: true });
    res.status(201).send("Usuário adicionado com sucesso!");
  } catch (err) {
    console.error("Erro ao adicionar usuário:", err);
    res.status(500).send("Erro ao adicionar usuário");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar a conexão:", err);
      }
    }
  }
});

// Rodar o servidor
app.listen(5000, () => console.log("Backend rodando na porta 5000"));
