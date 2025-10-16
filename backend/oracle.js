const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');

// ----------------------------------------------------
// FUNÇÕES DE SERVIÇO (Ping e Fetch Geral)
// ----------------------------------------------------

/**
 * Checa a conexão com o banco de dados.
 * Abre e fecha uma conexão de teste para validar o acesso.
 */
async function checkDbConnection() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log('✅ Conexão com o DB estabelecida com sucesso.');
        return true; 
    } catch (err) {
        console.error('❌ Falha ao conectar ao banco de dados:', err);
        return false;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

/**
 * Executa um SELECT * FROM "tableName" de forma dinâmica.
 * @param {string} tableName - O nome da tabela.
 * @returns {Array} Array de objetos representando os registros.
 */
async function fetchTableData(tableName) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
    // Usa o nome da tabela em maiúsculas, sem aspas
    const safeTableName = tableName.toUpperCase();
    const sql = `SELECT * FROM ${safeTableName}`;

        const result = await connection.execute(sql, [], {
            // Retorna os dados como objetos JavaScript (JSON-friendly)
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        console.log(`✅ Consulta realizada na tabela ${safeTableName}. Registros: ${result.rows.length}`);
        return result.rows || []; 
    } catch (err) {
        console.error(`❌ Erro ao consultar a tabela ${tableName}:`, err);
        // Lança um erro customizado para ser capturado pela rota Express
        throw new Error(`Falha na consulta da tabela ${tableName}: ${err.message}`);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}


// ----------------------------------------------------
// FUNÇÕES CRUD
// ----------------------------------------------------

/**
 * Insere um novo registro e retorna o ID gerado (usando RETURNING INTO).
 * @param {string} tableName - O nome da tabela.
 * @param {object} record - Os dados a serem inseridos.
 * @returns {number} O ID do novo registro.
 */
async function insertRecord(tableName, record) {
    // Permite passar uma conexão opcional para agrupar múltiplos inserts/updates em uma transação
    // Se você passar record.__connection, será utilizada (não será feito commit automaticamente)
    let connection = record && record.__connection ? record.__connection : null;
    const providedConnection = !!connection;
    try {
        if (!providedConnection) connection = await oracledb.getConnection(dbConfig);

        // Cria um payload sem a propriedade __connection
        const payload = { ...record };
        delete payload.__connection;

        // Constrói a lista de colunas e bind variables
        const columns = Object.keys(payload).map(key => key.toUpperCase()).join(', ');
        const bindVars = Object.keys(payload).map((key, index) => `:${index + 1}`).join(', ');
        const values = Object.values(payload);

        const sql = `INSERT INTO ${tableName.toUpperCase()} (${columns}) VALUES (${bindVars}) RETURNING ID_${tableName.toUpperCase()} INTO :outputId`;

        const binds = [...values, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }];
        const execOptions = { autoCommit: providedConnection ? false : true, outFormat: oracledb.OUT_FORMAT_OBJECT };

        const result = await connection.execute(sql, binds, execOptions);
        const newId = result.outBinds.outputId[0];
        console.log(`✅ Registro inserido na tabela ${tableName} com ID: ${newId}`);

        return { id: newId, connection };
    } catch (err) {
        console.error(`❌ Erro ao inserir registro na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (!providedConnection && connection) {
            try { await connection.close(); } catch (e) { console.error('Erro fechando conexão:', e); }
        }
    }
}

/**
 * Atualiza um registro pelo ID.
 * @param {string} tableName - O nome da tabela.
 * @param {number} id - O ID do registro a ser atualizado.
 * @param {object} updates - Os campos e novos valores.
 * @returns {number} O número de linhas afetadas.
 */
async function updateRecord(tableName, id, updates) {
    // Permite passar uma conexão opcional em updates.__connection
    let connection = updates && updates.__connection ? updates.__connection : null;
    const providedConnection = !!connection;
    try {
        if (!providedConnection) connection = await oracledb.getConnection(dbConfig);

        const payload = { ...updates };
        delete payload.__connection;

        const updateSetClause = Object.keys(payload).map((key, index) => 
            `${key.toUpperCase()} = :val${index + 1}`
        ).join(', ');

        const values = Object.values(payload);

        const bindsObject = {};
        values.forEach((val, index) => {
            bindsObject[`val${index + 1}`] = val; 
        });
        bindsObject.id = id;

        const updateSql = `UPDATE ${tableName.toUpperCase()} SET ${updateSetClause}, UPDATED_AT = SYSDATE WHERE ID_${tableName.toUpperCase()} = :id`;

        const result = await connection.execute(updateSql, bindsObject, { autoCommit: providedConnection ? false : true });

        console.log(`✅ Registro ID ${id} atualizado na tabela ${tableName}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected;
    } catch (err) {
        console.error(`❌ Erro ao atualizar registro ID ${id} na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (!providedConnection && connection) {
            try { await connection.close(); } catch (e) { console.error('Erro fechando conexão:', e); }
        }
    }
}


/**
 * Função para Excluir (DELETE) um registro de uma tabela pelo ID.
 * @param {string} tableName - O nome da tabela.
 * @param {number} id - O ID do registro a ser excluído.
 * @returns {number} O número de linhas afetadas.
 */
async function deleteRecord(tableName, id) {
    // Permite passar id como objeto { value: id, __connection: conn } para usar conexão passada
    let connection = null;
    let providedConnection = false;
    try {
        if (id && typeof id === 'object' && id.__connection) {
            providedConnection = true;
            connection = id.__connection;
            id = id.value;
        }

        if (!providedConnection) connection = await oracledb.getConnection(dbConfig);

        const idColumn = `ID_${tableName.toUpperCase()}`;
        const sql = `DELETE FROM ${tableName.toUpperCase()} WHERE ${idColumn} = :id`;
        const binds = { id: id };

        const result = await connection.execute(sql, binds, { autoCommit: providedConnection ? false : true });

        console.log(`✅ Tentativa de exclusão ID ${id} na tabela ${tableName}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected;
    } catch (err) {
        console.error(`❌ Erro ao excluir registro ID ${id} da tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (!providedConnection && connection) {
            try { await connection.close(); } catch (e) { console.error('Erro fechando conexão:', e); }
        }
    }
}

// Helpers para transação
async function beginTransaction() {
    const connection = await oracledb.getConnection(dbConfig);
    return connection;
}

async function commit(connection) {
    if (connection) await connection.commit();
}

async function rollback(connection) {
    if (connection) await connection.rollback();
}


// ----------------------------------------------------
// EXPORTAÇÕES
// ----------------------------------------------------

module.exports = {
    checkDbConnection,
    fetchTableData,
    insertRecord,
    updateRecord,
    deleteRecord,
    beginTransaction,
    commit,
    rollback
};

