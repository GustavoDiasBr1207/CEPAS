// backend/oracle.js

const oracledb = require('oracledb');
// Assumindo que dbConfig é carregado de um arquivo de configuração ou do ambiente
const dbConfig = require('./dbConfig'); // <-- Ajuste o caminho se necessário

// ----------------------------------------------------
// FUNÇÕES DE SERVIÇO (Ping e Fetch Geral)
// ----------------------------------------------------

// NOTE: Estas são placeholders, assumindo que já existem no seu projeto.
async function checkDbConnection() {
    // ... Implementação real para checar a conexão (como a da rota /ping)
    return true; 
}

async function fetchTableData(tableName) {
    // ... Implementação real para SELECT * FROM "tableName"
    return []; 
}

// ----------------------------------------------------
// FUNÇÕES CRUD
// ----------------------------------------------------

async function insertRecord(tableName, record) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const columns = Object.keys(record).map(key => `"${key}"`).join(', '); // Adicione aspas para nomes de coluna
        // :1, :2, :3, ... são placeholders de binding para segurança contra SQL Injection
        const bindVars = Object.keys(record).map((key, index) => `:${index + 1}`).join(', ');
        const values = Object.values(record);
        
        // A sintaxe de INSERT com cláusula RETURNING INTO é padrão para obter o ID gerado.
        // O nome da coluna ID é dinâmico (ex: ID_FAMILIA, ID_MONITOR)
        const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${bindVars}) RETURNING ID_${tableName.toUpperCase()} INTO :outputId`;

        // As binds agora são passadas como um array, e a variável de saída no final
        const result = await connection.execute(sql, [...values, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }], {
            autoCommit: true,
            // Certifique-se que o oracledb entenda o nome da variável de saída
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

async function updateRecord(tableName, id, updates) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Mapeia os campos para o SET, usando binds nomeadas (ex: :val1)
        const updateSet = Object.keys(updates).map((key, index) => 
            `"${key}" = :val${index + 1}`
        ).join(', ');

        const values = Object.values(updates);
        // O último valor no array será o ID
        // NOTE: No OracleDB, é melhor usar binds nomeadas para evitar confusão de índice. 
        // Aqui, continuamos com a lógica de índice para manter a consistência do seu código.
        const finalValues = [...values, id]; 

        // Adiciona a coluna updated_at
        const setClause = `${updateSet}, updated_at = SYSDATE`;
        
        // O ID na cláusula WHERE é o último bind variable.
        const sql = `UPDATE "${tableName}" SET ${setClause} WHERE ID_${tableName.toUpperCase()} = :id`;

        const result = await connection.execute(sql, finalValues, {
            autoCommit: true,
        });

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
 */
async function deleteRecord(tableName, id) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // O nome da coluna ID é dinâmico (ex: ID_FAMILIA, ID_MONITOR)
        const idColumn = `ID_${tableName.toUpperCase()}`; 
        
        // Uso de bind variable (:id) para segurança.
        const sql = `DELETE FROM "${tableName}" WHERE ${idColumn} = :id`;
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
    deleteRecord // <-- A nova função DELETAR está aqui!
};