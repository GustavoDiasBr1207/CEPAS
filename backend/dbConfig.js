/**
 * dbConfig.js
 * * Configurações de conexão para o OracleDB usando o modo Thick (Client) 
 * com Oracle Wallet e TNS_ADMIN.
 */

// 1. Configurações Globais do Oracle Client
// Você deve definir essas variáveis antes de qualquer chamada ao oracledb
// para garantir que o cliente saiba onde procurar os arquivos de conexão (Wallet)
// e a biblioteca Instant Client (Modo Thick).

// Define TNS_ADMIN no ambiente Node.js. 
// Isso substitui a necessidade de "walletLocation" no objeto de conexão.
process.env.TNS_ADMIN = 'C:\\OracleWallet';

// Inicializa o Oracle Client no modo Thick para usar TCPS/Wallet
// Esta linha é crucial e deve ser executada antes de qualquer chamada oracledb.getConnection
try {
    const oracledb = require('oracledb');
    // Ajuste o caminho para o seu Instant Client
    oracledb.initOracleClient({ libDir: 'C:\\Oracle\\instantclient_23_9' });
    console.log('✅ [dbConfig] Oracle Client inicializado com sucesso.');
} catch (err) {
    // Apenas loga o erro, mas não encerra. Se o cliente não iniciar, 
    // a conexão principal irá falhar.
    console.error('❌ [dbConfig] Erro ao inicializar Oracle Client:', err.message);
}


// 2. Objeto de Configuração para Conexão
// Este objeto será usado pela função oracledb.getConnection(config).
const dbConfig = {
    // ⚠️ Recomenda-se usar process.env.DB_USER/DB_PASSWORD para credenciais reais!
    user: 'ADMIN',             
    password: 'CepasDatabase@2025', 
    
    // O valor de connectString deve corresponder a um alias dentro do tnsnames.ora
    // que está localizado na pasta definida por TNS_ADMIN.
    connectionString: 'cepasdb_high',
    
    // Configurações do Pool (Boas práticas para um Backend/API)
    poolMin: 10,
    poolMax: 10,
    poolIncrement: 0,
    poolTimeout: 60,
};

// ----------------------------------------------------
// Exportação
// ----------------------------------------------------

module.exports = dbConfig;