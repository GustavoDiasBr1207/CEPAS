console.log('🚀 Iniciando backend...');

const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Define o caminho para o Oracle Instant Client dentro do contêiner Docker
const instantClientPath = '/usr/src/app/instant';

// Inicializa o Instant Client
try {
  oracledb.initOracleClient({ libDir: instantClientPath });
  console.log('✅ Oracle Instant Client inicializado com sucesso.');
} catch (err) {
  console.error('❌ Erro ao inicializar o Instant Client. Verifique se a pasta "instant" está no diretório correto.', err);
  process.exit(1); 
}

// Configuração de conexão com o banco Oracle
const dbConfig = {
  user: 'ADMIN', 
  password: 'CepasDatabase@2025',
  connectString: 'cepasdb_high',
};

// Função para buscar dados de uma tabela
async function fetchTableData(tableName) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

    const result = await connection.execute(`SELECT * FROM "${tableName}"`);

    const rows = result.rows.map(row => {
      const obj = {};
      result.metaData.forEach((column, index) => {
        obj[column.name.toLowerCase()] = row[index];
      });
      return obj;
    });

    return rows;

  } catch (err) {
    console.error('❌ Erro na conexão ou na query:', err);
    throw err; 
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('✅ Conexão com o banco de dados fechada.');
      } catch (err) {
        console.error('❌ Erro ao fechar a conexão:', err);
      }
    }
  }
}

// Rota para buscar dados de uma tabela específica
app.get('/tabela/:tableName', async (req, res) => {
  const tableName = req.params.tableName;
  try {
    const data = await fetchTableData(tableName);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).send(`Erro ao buscar dados da tabela ${tableName}: ${err.message}`);
  }
});

// Rota /ping para teste de conexão com o banco
app.get('/ping', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute('SELECT 1 FROM DUAL');
    await connection.close();
    res.status(200).send('✅ Conexão com o banco Oracle está OK!');
  } catch (err) {
    console.error('❌ Erro na rota /ping:', err);
    res.status(500).send('❌ Falha na conexão com o banco Oracle.');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
