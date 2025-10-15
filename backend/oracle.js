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
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
    // Constrói a lista de colunas e variáveis de bind (ex: :1, :2), sem aspas
    const columns = Object.keys(record).map(key => key.toUpperCase()).join(', '); 
    const bindVars = Object.keys(record).map((key, index) => `:${index + 1}`).join(', ');
    const values = Object.values(record);
        
    // O nome da coluna ID é dinâmico (ex: ID_FAMILIA)
    const sql = `INSERT INTO ${tableName.toUpperCase()} (${columns}) VALUES (${bindVars}) RETURNING ID_${tableName.toUpperCase()} INTO :outputId`;

        // Passa os valores de inserção + a variável de saída para o ID
        const result = await connection.execute(sql, [...values, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }], {
            autoCommit: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const newId = result.outBinds.outputId[0];
        console.log(`✅ Registro inserido na tabela ${tableName} com ID: ${newId}`);
        return newId;
        
    } catch (err) {
        console.error(`❌ Erro ao inserir registro na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
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
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Constrói a cláusula SET usando binds nomeadas (ex: :val1, :val2), sem aspas
        const updateSetClause = Object.keys(updates).map((key, index) => 
            `${key.toUpperCase()} = :val${index + 1}`
        ).join(', ');

        const values = Object.values(updates);

        // Cria o objeto de binds: { val1: value1, val2: value2, ..., id: id }
        const bindsObject = {};
        values.forEach((val, index) => {
            bindsObject[`val${index + 1}`] = val; 
        });
        bindsObject.id = id; // O bind :id para o WHERE

        // Inclui SYSDATE na cláusula SET (assumindo que a coluna UPDATED_AT existe)
        const updateSql = `UPDATE ${tableName.toUpperCase()} SET ${updateSetClause}, UPDATED_AT = SYSDATE WHERE ID_${tableName.toUpperCase()} = :id`;

        // Executa a atualização usando o objeto de binds nomeadas
        const result = await connection.execute(updateSql, bindsObject, { autoCommit: true });

        console.log(`✅ Registro ID ${id} atualizado na tabela ${tableName}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected;
        
    } catch (err) {
        console.error(`❌ Erro ao atualizar registro ID ${id} na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
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
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

    const idColumn = `ID_${tableName.toUpperCase()}`; 
    // Uso de bind variable (:id) para segurança, sem aspas
    const sql = `DELETE FROM ${tableName.toUpperCase()} WHERE ${idColumn} = :id`;
    const binds = { id: id };
        
        const result = await connection.execute(sql, binds, { autoCommit: true });

        console.log(`✅ Tentativa de exclusão ID ${id} na tabela ${tableName}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected; 
    } catch (err) {
        console.error(`❌ Erro ao excluir registro ID ${id} da tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Erro ao fechar a conexão no deleteRecord:", err);
            }
        }
    }
}


// ----------------------------------------------------
// EXPORTAÇÕES
// ----------------------------------------------------

module.exports = {
    checkDbConnection,
    fetchTableData,
    insertRecord,
    updateRecord,
    deleteRecord 
};
