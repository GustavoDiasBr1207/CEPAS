const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');

// ----------------------------------------------------
// FUNÇÕES DE SERVIÇO (Ping e Fetch Geral)
// ----------------------------------------------------

/**
 * Checa a conexão com o banco de dados.
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
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
    }
}

/**
 * Busca dados de uma tabela ou executa uma query customizada.
 * @param {string} tableName - Nome da tabela (usado quando não for passada customQuery).
 * @param {string|null} customQuery - SQL customizado a ser executado (opcional).
 */
async function fetchTableData(tableName, customQuery = null, binds = {}) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        let sql;
        if (customQuery && typeof customQuery === 'string' && customQuery.trim() !== '') {
            sql = customQuery;
        } else {
            const safeTableName = String(tableName).toUpperCase();
            sql = `SELECT * FROM ${safeTableName}`;
        }

    console.log(`Executando consulta SQL: ${sql}`);
    console.log(`Com binds: ${JSON.stringify(binds)}`);
    const result = await connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        console.log(`✅ Consulta realizada. Registros: ${result.rows ? result.rows.length : 0}`);
        return result.rows || [];
    } catch (err) {
        console.error(`❌ Erro ao executar consulta (${tableName}):`, err);
        throw new Error(`Falha na consulta ${tableName || ''}: ${err.message}`);
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
    }
}


// ----------------------------------------------------
// FUNÇÕES CRUD
// ----------------------------------------------------

/**
 * Converte datas para o formato correto do Oracle
 */
function formatDateForOracle(value, key) {
    // Lista de campos que são datas
    const dateFields = ['data_nascimento', 'data_entrevista', 'data_inicio', 'data_fim'];
    
    if (dateFields.includes(key.toLowerCase()) && value && value !== '') {
        // Se o valor é uma string de data no formato YYYY-MM-DD
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return `TO_DATE('${value}', 'YYYY-MM-DD')`;
        }
    }
    
    return value;
}

/**
 * Insere um novo registro e retorna o ID gerado (usando RETURNING INTO).
 */
async function insertRecord(tableName, record) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

            const keys = Object.keys(record || {});
            if (keys.length === 0) throw new Error('Nenhum dado fornecido para inserção');

            const columns = keys.map(key => key.toUpperCase()).join(', ');
            const dateFields = ['data_nascimento', 'data_entrevista', 'data_inicio', 'data_fim'];

            // Monta binds nomeados
            const bindsObj = {};
            keys.forEach((key) => {
                const rawVal = record[key];
                const bindKey = key.replace(/[^a-zA-Z0-9_]/g, '');

                if (dateFields.includes(key.toLowerCase()) && rawVal && rawVal !== '') {
                    if (typeof rawVal === 'string' && rawVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        bindsObj[bindKey] = new Date(rawVal + 'T00:00:00.000Z');
                    } else {
                        bindsObj[bindKey] = rawVal;
                    }
                } else {
                    bindsObj[bindKey] = rawVal;
                }
            });

            const bindVarsString = keys.map(k => `:${k.replace(/[^a-zA-Z0-9_]/g, '')}`).join(', ');

        const idColumnMap = {
            'MONITOR': 'ID_MONITOR',
            'AREA': 'ID_AREA',
            'FAMILIA': 'ID_FAMILIA',
            'ENTREVISTA': 'ID_ENTREVISTA',
            'ENTREVISTAMONITOR': 'ID_ENTREVISTA_MONITOR',
            'ENDERECO': 'ID_ENDERECO',
            'MEMBRO': 'ID_MEMBRO',
            'ANIMAL': 'ID_ANIMAL',
            'ESTRUTURAHABITACAO': 'ID_ESTRUTURA',
            'RECURSOSANEAMENTO': 'ID_RECURSO',
            'SAUDEMEMBRO': 'ID_SAUDE',
            'CRIANCACEPAS': 'ID_CRIANCA',
            'USUARIO': 'ID_USUARIO',
            'REFRESHTOKEN': 'ID_TOKEN',
            'LOGSISTEMA': 'ID_LOG'
        };

        const tableNameUpper = String(tableName).toUpperCase();
        const idColumn = idColumnMap[tableNameUpper] || `ID_${tableNameUpper}`;

    const sql = `INSERT INTO ${tableNameUpper} (${columns}) VALUES (${bindVarsString}) RETURNING ${idColumn} INTO :outputId`;

    // adicionar bind de saída
    bindsObj.outputId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };

    console.log(`Executando SQL: ${sql}`);
    console.log(`Com binds: ${JSON.stringify(bindsObj, null, 2)}`);

    const result = await connection.execute(sql, bindsObj, { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('Resultado da execução:', JSON.stringify(result, null, 2));

        let newId = result.outBinds && result.outBinds.outputId;
        if (Array.isArray(newId)) newId = newId[0];
        if (!newId) throw new Error('Não foi possível recuperar o ID do registro inserido');

        console.log(`✅ Registro inserido na tabela ${tableNameUpper} com ID: ${newId}`);
        return newId;

    } catch (err) {
        console.error(`❌ Erro ao inserir registro na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
    }
}

/**
 * Atualiza um registro pelo ID.
 */
async function updateRecord(tableName, id, updates) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const keys = Object.keys(updates || {});
        if (keys.length === 0) return 0;

        const updateSetClause = keys.map((key, index) => `${key.toUpperCase()} = :val${index + 1}`).join(', ');
        const dateFields = ['data_nascimento', 'data_entrevista', 'data_inicio', 'data_fim'];

        const bindsObject = {};
        keys.forEach((key, index) => {
            const val = updates[key];
            if (dateFields.includes(String(key).toLowerCase()) && val && val !== '') {
                if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    bindsObject[`val${index + 1}`] = new Date(val + 'T00:00:00.000Z');
                } else {
                    bindsObject[`val${index + 1}`] = val;
                }
            } else {
                bindsObject[`val${index + 1}`] = val;
            }
        });
        bindsObject.id = id;

        const idColumnMap = {
            'FAMILIA': 'ID_FAMILIA',
            'ENDERECO': 'ID_ENDERECO',
            'ANIMAL': 'ID_ANIMAL',
            'ESTRUTURAHABITACAO': 'ID_ESTRUTURA',
            'RECURSOSANEAMENTO': 'ID_RECURSO',
            'MEMBRO': 'ID_MEMBRO',
            'AREA': 'ID_AREA',
            'MONITOR': 'ID_MONITOR',
            'ENTREVISTA': 'ID_ENTREVISTA',
            'ENTREVISTAMONITOR': 'ID_ENTREVISTA_MONITOR',
            'SAUDEMEMBRO': 'ID_SAUDE',
            'CRIANCACEPAS': 'ID_CRIANCA'
        };

        const tableNameUpper = String(tableName).toUpperCase();
        const idColumn = idColumnMap[tableNameUpper] || `ID_${tableNameUpper}`;

        const updateSql = `UPDATE ${tableNameUpper} SET ${updateSetClause} WHERE ${idColumn} = :id`;
        const result = await connection.execute(updateSql, bindsObject, { autoCommit: true });

        console.log(`✅ Registro ID ${id} atualizado na tabela ${tableNameUpper}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected;

    } catch (err) {
        console.error(`❌ Erro ao atualizar registro ID ${id} na tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
    }
}

/**
 * Exclui um registro por ID (aceita nome de coluna customizado).
 */
async function deleteRecord(tableName, id, customIdColumn = null) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const idColumn = customIdColumn || `ID_${String(tableName).toUpperCase()}`;
        const sql = `DELETE FROM ${String(tableName).toUpperCase()} WHERE ${idColumn} = :id`;
        const binds = { id };

        const result = await connection.execute(sql, binds, { autoCommit: true });
        console.log(`✅ Tentativa de exclusão ID ${id} na tabela ${tableName}. Linhas afetadas: ${result.rowsAffected}`);
        return result.rowsAffected;
    } catch (err) {
        console.error(`❌ Erro ao excluir registro ID ${id} da tabela ${tableName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
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
