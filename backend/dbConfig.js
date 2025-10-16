const oracledb = require('oracledb');
const path = require('path'); // Novo módulo importado

// ----------------------------------------------------
// Configuração do Oracle Client (modo Thick)
// ----------------------------------------------------

// Define TNS_ADMIN - permite sobrescrever via env var em Docker/produção
process.env.TNS_ADMIN = process.env.TNS_ADMIN || path.join(__dirname, 'wallet');
console.log(`Configuração TNS_ADMIN definida como: ${process.env.TNS_ADMIN}`);

// Caminho para o Oracle Instant Client - pode ser sobrescrito por INSTANT_CLIENT_LIB
const instantClientPath = process.env.INSTANT_CLIENT_LIB || path.join(__dirname, 'instant');

try {
    oracledb.initOracleClient({ libDir: instantClientPath });
    console.log('✅ [dbConfig] Oracle Client inicializado com sucesso.');
    console.log(`Path do Instant Client (libDir): ${instantClientPath}`);
} catch (err) {
    console.error('❌ [dbConfig] Erro ao inicializar Oracle Client. Verifique o caminho libDir:', err.message);
    // Não lançar aqui; a falha será observada ao tentar `getConnection`.
}


// ----------------------------------------------------
// 2. Objeto de Configuração para Conexão (lê variáveis de ambiente)
// ----------------------------------------------------
const dbConfig = {
    // Credenciais: preferir variáveis de ambiente para produção
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASS || 'CepasDatabase@2025',

    // connectionString resolve para o alias dentro do tnsnames.ora (em TNS_ADMIN)
    connectionString: process.env.DB_CONN || 'cepasdb_high',

    // Configurações do Pool
    poolMin: parseInt(process.env.DB_POOL_MIN || '10', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    poolIncrement: parseInt(process.env.DB_POOL_INCREMENT || '0', 10),
    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '60', 10),
};

// ----------------------------------------------------
// Exportação
// ----------------------------------------------------

module.exports = dbConfig;
