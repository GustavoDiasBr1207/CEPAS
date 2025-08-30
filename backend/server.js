// ==============================
// Backend Oracle ADB com Wallet
// ==============================

const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Define o caminho da wallet
const walletPath = 'C:\\OracleWallet';

// ------------------------------
// Verifica se a wallet existe e os arquivos essenciais
// ------------------------------
const requiredFiles = ['cwallet.sso', 'ewallet.p12', 'sqlnet.ora', 'tnsnames.ora', 'truststore.jks'];
if (!fs.existsSync(walletPath)) {
  console.error(`❌ Erro: O caminho da wallet "${walletPath}" não foi encontrado.`);
  process.exit(1);
}

for (const file of requiredFiles) {
  const filePath = path.join(walletPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Erro: Arquivo "${file}" não encontrado na wallet.`);
    process.exit(1);
  } else {
    console.log(`✅ ${file} pode ser lido.`);
  }
}

// ------------------------------
// Inicializa Oracle Client (Thick) para TCPS/Wallet
// ------------------------------
try {
  oracledb.initOracleClient({ libDir: 'C:\\Oracle\\instantclient_23_9' });
  console.log('✅ Oracle Client inicializado com sucesso.');
} catch (err) {
  console.error('❌ Erro ao inicializar o Oracle Client:', err);
  process.exit(1);
}

// ------------------------------
// Configurações de conexão
// ------------------------------
const dbConfig = {
  user: 'ADMIN',             // seu usuário
  password: 'CepasDatabase@2025', // sua senha
  connectString: 'cepasdb_high',  // tnsnames.ora
  externalAuth: false,
};

// ------------------------------
// Função para buscar dados de uma tabela
// ------------------------------
async function fetchTableData(tableName) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log(`✅ Conexão estabelecida para a tabela "${tableName}"`);

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
    console.error('❌ Erro na conexão ou query:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔒 Conexão fechada.');
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err);
      }
    }
  }
}

// ------------------------------
// Rotas da API
// ------------------------------
app.get('/tabela/:tableName', async (req, res) => {
  const tableName = req.params.tableName;
  try {
    const data = await fetchTableData(tableName);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: `Erro ao buscar dados da tabela ${tableName}: ${err.message}` });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
