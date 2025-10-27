const oracledb = require('oracledb');
const path = require('path'); // Novo módulo importado

// ----------------------------------------------------
// 1. Configurações Globais do Oracle Client (Modo Thick)
// ----------------------------------------------------

// Define TNS_ADMIN de forma PORTÁTIL, mas respeita variável de ambiente existente
// __dirname aponta para o diretório atual (backend/). 
// Isso resolve para: <repo>/backend/wallet
if (!process.env.TNS_ADMIN) {
    process.env.TNS_ADMIN = path.join(__dirname, 'wallet');
}
console.log(`Configuração TNS_ADMIN: ${process.env.TNS_ADMIN}`);

// Tratar CLOBs como string por padrão (evita streams no Node)
try {
    oracledb.fetchAsString = [oracledb.CLOB];
    console.log('✅ [dbConfig] Configurado oracledb.fetchAsString para CLOB');
} catch (e) {
    console.log('⚠️ [dbConfig] Não foi possível configurar fetchAsString para CLOB:', e.message);
}


// Caminho para o Oracle Instant Client. 
// É recomendado usar uma variável de ambiente, mas manteremos a sua como fallback.
const instantClientPath = path.join(__dirname, 'instant'); 

try {
    // Só inicializa o Oracle Client se não estiver já inicializado
    if (!oracledb.oracleClientVersion) {
        oracledb.initOracleClient({ libDir: instantClientPath });
        console.log('✅ [dbConfig] Oracle Client (modo thick) inicializado.');
        console.log(`Path do Instant Client (libDir): ${instantClientPath}`);
    } else {
        console.log('✅ [dbConfig] Oracle Client já estava inicializado.');
    }
} catch (err) {
    // Se já estiver inicializado, ignora o erro DPI-1047
    if (err.message.includes('DPI-1047') || err.message.includes('already been initialized')) {
        console.log('✅ [dbConfig] Oracle Client já estava inicializado (ignorando DPI-1047).');
    } else {
        console.error('❌ [dbConfig] Erro ao inicializar Oracle Client. Verifique o caminho libDir:', err.message);
    }
    // IMPORTANTE: Não lançar erro aqui. A falha real ocorrerá em getConnection.
}


// ----------------------------------------------------
// 2. Objeto de Configuração para Conexão
// ----------------------------------------------------
const dbConfig = {
    // Credenciais (use variáveis de ambiente quando presentes)
    user: process.env.DB_USER || 'ADMIN',
    password: process.env.DB_PASSWORD || 'CepasDatabase@2025', 
    
    // connectionString resolve para o alias dentro do tnsnames.ora (em TNS_ADMIN)
    connectionString: process.env.DB_CONNECT_STRING || 'cepasdb_high',
    
    // Configurações do Pool (OTIMIZADO PARA 1GB RAM)
    poolMin: Number(process.env.DB_POOL_MIN || 1),      // Reduzido: 10 → 1
    poolMax: Number(process.env.DB_POOL_MAX || 3),      // Reduzido: 10 → 3
    poolIncrement: Number(process.env.DB_POOL_INCREMENT || 1),  // Ajustado: 0 → 1
    poolTimeout: Number(process.env.DB_POOL_TIMEOUT || 30),     // Reduzido: 60 → 30
    
    // Statement cache reduzido para economizar memória
    stmtCacheSize: 10  // Padrão é 30
};

console.log('✅ [dbConfig] Pool otimizado para 1GB RAM:', {
    poolMin: dbConfig.poolMin,
    poolMax: dbConfig.poolMax,
    poolTimeout: dbConfig.poolTimeout + 's',
    stmtCacheSize: dbConfig.stmtCacheSize
});

// ----------------------------------------------------
// Exportação
// ----------------------------------------------------

module.exports = dbConfig; 
