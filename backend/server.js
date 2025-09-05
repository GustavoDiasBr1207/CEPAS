const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Inicializa o Instant Client corretamente (apenas uma vez, no início)
try {
  oracledb.initOracleClient({ libDir: 'C:\\Oracle\\instantclient_23_9' });
} catch (err) {
  console.error('❌ Erro ao inicializar o Instant Client:', err);
  process.exit(1); 
}

// Configurando o caminho da wallet dentro do diretório do backend
const walletPath = path.join(__dirname, 'wallet'); 

// Adiciona uma verificação para garantir que a pasta da wallet existe
if (!fs.existsSync(walletPath)) {
  console.error(`❌ Erro: O caminho da wallet "${walletPath}" não foi encontrado. Por favor, certifique-se de que a pasta existe.`);
  process.exit(1);
}

// Tenta ler o conteúdo da wallet manualmente
try {
  const tnsnamesContent = fs.readFileSync(path.join(walletPath, 'tnsnames.ora'), 'utf8');
  const sqlnetContent = fs.readFileSync(path.join(walletPath, 'sqlnet.ora'), 'utf8');
} catch (err) {
  console.error(`❌ Erro ao ler os arquivos da wallet. Por favor, verifique as permissões da pasta "${walletPath}". Detalhes:`, err.message);
  process.exit(1);
}

// Configurações de conexão (usando as credenciais do banco)
const dbConfig = {
  user: 'ADMIN', 
  password: 'CepasDatabase@2025',
  connectString: 'cepasdb_high',
  // Propriedades para usar a wallet em vez do TNS_ADMIN
  externalAuth: false,
  walletLocation: walletPath 
};

/**
 * Conecta ao banco de dados Oracle e executa uma query simples.
 * @returns {Promise<Array>} A lista de usuários ou um erro.
 */
async function fetchTableData(tableName) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

    const result = await connection.execute(
      `SELECT * FROM "${tableName}"`
    );

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

// Rota da API para buscar dados de forma dinâmica
app.get('/tabela/:tableName', async (req, res) => {
  const tableName = req.params.tableName;
  try {
    const data = await fetchTableData(tableName);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).send(`Erro ao buscar dados da tabela ${tableName}: ${err.message}`);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
