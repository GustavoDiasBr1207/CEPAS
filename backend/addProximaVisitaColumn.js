const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');

(async () => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log('✅ Conexão estabelecida para verificação da coluna.');

        const checkSql = `
            SELECT column_name
            FROM user_tab_columns
            WHERE table_name = 'ENTREVISTA'
              AND column_name = 'PROXIMA_VISITA'
        `;

        const checkResult = await connection.execute(checkSql);
        if (checkResult.rows && checkResult.rows.length > 0) {
            console.log('ℹ️ Coluna PROXIMA_VISITA já existe na tabela Entrevista. Nenhuma ação necessária.');
            return;
        }

        console.log('🚧 Coluna PROXIMA_VISITA não encontrada. Criando coluna...');
        await connection.execute(`ALTER TABLE Entrevista ADD (proxima_visita DATE)`);
        console.log('✅ Coluna PROXIMA_VISITA adicionada com sucesso.');
    } catch (err) {
        console.error('❌ Erro ao garantir coluna PROXIMA_VISITA na tabela Entrevista:', err);
        process.exitCode = 1;
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('🔒 Conexão encerrada.');
            } catch (closeErr) {
                console.error('⚠️ Erro ao fechar conexão:', closeErr);
            }
        }
    }
})();
