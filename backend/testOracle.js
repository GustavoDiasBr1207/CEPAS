// ==============================
// Teste de conexão Oracle ADB com wallet
// ==============================

// Define TNS_ADMIN dentro do Node.js para garantir que sempre use C:\OracleWallet
process.env.TNS_ADMIN = 'C:\\OracleWallet';

const oracledb = require('oracledb');
const fs = require('fs');
const path = process.env.TNS_ADMIN;

// ------------------------------
// Debug: listar arquivos da wallet
// ------------------------------
console.log('📂 Arquivos na wallet em', path);
try {
  const files = fs.readdirSync(path);
  files.forEach(file => console.log(' -', file));
} catch (err) {
  console.error('❌ Não foi possível listar os arquivos da wallet:', err);
  process.exit(1);
}

// ------------------------------
// Debug: testar leitura dos arquivos críticos
// ------------------------------
['cwallet.sso','ewallet.p12','sqlnet.ora','tnsnames.ora','truststore.jks'].forEach(file => {
  try {
    fs.accessSync(`${path}\\${file}`, fs.constants.R_OK);
    console.log(`✅ ${file} pode ser lido.`);
  } catch(err) {
    console.error(`❌ ${file} NÃO pode ser lido:`, err.message);
  }
});

// Inicializar Oracle Client (modo Thick) para suportar TCPS/Wallet
try {
  oracledb.initOracleClient({ libDir: 'C:\\Oracle\\instantclient_23_9' });
  console.log('✅ Oracle Client inicializado com sucesso.');
} catch (err) {
  console.error('❌ Erro ao inicializar Oracle Client:', err);
  process.exit(1);
}

// ------------------------------
// Função de teste de conexão
// ------------------------------
async function testConnection() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: 'ADMIN',              // usuário Oracle
      password: 'CepasDatabase@2025', // senha Oracle
      connectString: 'cepasdb_high'   // connect string do tnsnames.ora
    });

    console.log('✅ Conexão bem-sucedida!');

    const result = await connection.execute(
      `SELECT table_name FROM user_tables ORDER BY table_name`
    );

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ Nenhuma tabela encontrada para o usuário.');
    } else {
      console.log('📋 Tabelas do usuário:');
      result.rows.forEach(row => console.log(' -', row[0]));
    }

  } catch (err) {
    if (err.errorNum === 28759) {
      console.error('❌ Erro ORA-28759: Problema ao abrir arquivos da wallet.');
    } else if (err.code === 'NJS-511') {
      console.error('❌ Erro NJS-511: Conexão recusada pelo listener.');
    } else {
      console.error('❌ Erro na conexão:', err);
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔒 Conexão encerrada com sucesso.');
      } catch (err) {
        console.error('❌ Erro ao fechar a conexão:', err);
      }
    }
  }
}

// Executa o teste de conexão
testConnection();
