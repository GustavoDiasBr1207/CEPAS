const oracledb = require('oracledb');
const path = require('path'); // Novo módulo importado

// ----------------------------------------------------
// 1. Configurações Globais do Oracle Client (Modo Thick)
// ----------------------------------------------------

// Define TNS_ADMIN de forma PORTÁTIL.
// __dirname aponta para o diretório atual (backend/). 
// Isso resolve para: C:\Users\gusta\Downloads\CEPAS-1\backend\wallet
process.env.TNS_ADMIN = path.join(__dirname, 'wallet');
console.log(`Configuração TNS_ADMIN definida como: ${process.env.TNS_ADMIN}`);


// Caminho para o Oracle Instant Client. 
// É recomendado usar uma variável de ambiente, mas manteremos a sua como fallback.
const instantClientPath = path.join(__dirname, 'instant'); 

try {
    oracledb.initOracleClient({ libDir: instantClientPath });
    console.log('✅ [dbConfig] Oracle Client inicializado com sucesso.');
    console.log(`Path do Instant Client (libDir): ${instantClientPath}`);
} catch (err) {
    console.error('❌ [dbConfig] Erro ao inicializar Oracle Client. Verifique o caminho libDir:', err.message);
    // IMPORTANTE: Não lançar erro aqui. A falha real ocorrerá em getConnection.
}


// ----------------------------------------------------
// 2. Objeto de Configuração para Conexão
// ----------------------------------------------------
const dbConfig = {
    // Credenciais (Recomenda-se usar process.env para produção)
    user: 'ADMIN',
    password: 'CepasDatabase@2025', 
    
    // connectionString resolve para o alias dentro do tnsnames.ora (em TNS_ADMIN)
    connectionString: 'cepasdb_high',
    
    // Configurações do Pool
    poolMin: 10,
    poolMax: 10,
    poolIncrement: 0,
    poolTimeout: 60,
};

// ----------------------------------------------------
// Exportação
// ----------------------------------------------------

module.exports = dbConfig; 
