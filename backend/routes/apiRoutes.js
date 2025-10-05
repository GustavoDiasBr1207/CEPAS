const express = require('express');
// Importa as funções de serviço e CRUD do módulo Oracle
const { 
    fetchTableData, 
    checkDbConnection, 
    insertRecord, 
    updateRecord, 
    deleteRecord 
} = require('../oracle');
const router = express.Router();

// Middleware para garantir que o corpo da requisição seja lido como JSON
router.use(express.json()); 

// Lista de tabelas permitidas para evitar que o usuário acesse tabelas do sistema
const allowedTables = ['Monitor', 'Area', 'Familia', 'Entrevista', 'Membro']; 

// ------------------------------------
// ROTAS DE SERVIÇO (Ping e Status)
// ------------------------------------

/**
 * Rota /ping para teste de conexão com o banco Oracle.
 */
router.get('/ping', async (req, res) => {
    console.log('Recebida requisição /ping...');
    try {
        const isDbOk = await checkDbConnection();
        if (isDbOk) {
            res.status(200).send('✅ Conexão com o banco Oracle está OK!');
        } else {
            res.status(500).send('❌ Falha na conexão com o banco Oracle.');
        }
    } catch (err) {
        res.status(500).send(`❌ Erro interno ao checar a conexão: ${err.message}`);
    }
});

// ------------------------------------
// ROTAS DE AUTENTICAÇÃO (MOCK)
// ------------------------------------

/**
 * Rota /login mock para demonstração. Deve ser substituída por uma lógica real.
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // TODO: Implementar a checagem real no Oracle (e.g., tabela de usuários)
    if (username === 'admin' && password === 'cepas2025') { 
        // Em um projeto real, você retornaria um JWT token
        const token = 'CEPAS-TOKEN-ADMIN-XYZ';
        return res.status(200).json({ 
            success: true, 
            message: 'Login realizado com sucesso!',
            token: token,
            user: { username: 'admin', role: 'admin' }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }
});

// ------------------------------------
// ROTAS CRUD GENÉRICAS
// ------------------------------------

/**
 * Endpoint: /api/dados/:tableName (GET - Leitura de todos ou um)
 * Query param: ?id=X para buscar um registro específico.
 */
router.get('/dados/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const id = req.query.id; // Permite buscar um registro específico

    if (!allowedTables.includes(tableName)) {
        return res.status(400).send('Acesso negado ou tabela não encontrada.');
    }

    try {
        let data = await fetchTableData(tableName);

        if (id) {
            // Filtra os dados no lado da API se um ID for fornecido.
            // Nota: Em produção, o fetchTableData deveria ser adaptado para buscar pelo ID no SQL.
            const idColumnName = `ID_${tableName.toUpperCase()}`;
            const record = data.find(item => item[idColumnName] == id);

            if (!record) {
                 return res.status(404).send(`${tableName} ID ${id} não encontrado.`);
            }
            data = record;
        } 
        
        res.status(200).json(data);
    } catch (err) {
        // O erro já vem do oracle.js com uma mensagem detalhada da falha de consulta
        res.status(500).send(`Erro ao buscar dados da tabela ${tableName}: ${err.message}`);
    }
});

/**
 * Endpoint: /api/dados/:tableName (POST - Criação)
 */
router.post('/dados/:tableName', async (req, res) => {
    const tableName = req.params.tableName;
    const newRecord = req.body; 

    if (!allowedTables.includes(tableName)) {
        return res.status(400).send('Criação negada ou tabela inválida.');
    }
    if (Object.keys(newRecord).length === 0) {
        return res.status(400).send('Corpo da requisição vazio.');
    }

    // Adiciona campos de auditoria
    // Assume que a tabela possui a coluna USUARIO_RESPONSAVEL
    newRecord.usuario_responsavel = req.headers['x-user'] || 'sistema_api'; 
    
    try {
        const newId = await insertRecord(tableName, newRecord); 
        res.status(201).json({ 
            message: `Registro criado com sucesso na tabela ${tableName}.`, 
            ID: newId,
            data_enviada: newRecord
        });
    } catch (err) {
        res.status(500).send(`Erro ao criar registro: ${err.message}`);
    }
});

/**
 * Endpoint: /api/dados/:tableName/:id (PUT - Atualização)
 */
router.put('/dados/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const updates = req.body; 

    if (!allowedTables.includes(tableName)) {
        return res.status(400).send('Atualização negada ou tabela inválida.');
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).send('Corpo da requisição vazio.');
    }

    // Adiciona campos de auditoria
    updates.usuario_responsavel = req.headers['x-user'] || 'sistema_api'; 

    try {
        const rowsAffected = await updateRecord(tableName, id, updates); 

        if (rowsAffected === 0) {
            return res.status(404).json({ message: `ID ${id} não encontrado na tabela ${tableName}.` });
        }
        
        res.status(200).json({ 
            message: `Registro ID ${id} atualizado com sucesso na tabela ${tableName}.`,
            rowsAffected: rowsAffected,
            updates_recebidos: updates
        });
    } catch (err) {
        res.status(500).send(`Erro ao atualizar registro ID ${id}: ${err.message}`);
    }
});

/**
 * Endpoint: /api/dados/:tableName/:id (DELETE - Exclusão)
 */
router.delete('/dados/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;

    if (!allowedTables.includes(tableName)) {
        return res.status(400).send('Exclusão negada ou tabela inválida.');
    }
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).send('ID do registro inválido ou ausente.');
    }

    try {
        const rowsAffected = await deleteRecord(tableName, id);

        if (rowsAffected === 0) {
            return res.status(404).json({ message: `ID ${id} não encontrado na tabela ${tableName}. Nada foi excluído.` });
        }
        
        // Se a exclusão foi bem-sucedida
        res.status(200).json({ 
            message: `Registro ID ${id} excluído com sucesso da tabela ${tableName}.`,
            rowsAffected: rowsAffected
        });

    } catch (err) {
        // Erro ORA-02292: restrição de integridade (CHAVE ESTRANGEIRA) violada
        if (err.message.includes('ORA-02292')) {
            return res.status(409).json({ // Status 409 Conflict
                message: `Não é possível excluir o registro ID ${id} da tabela ${tableName}. Existem dados relacionados (Chave Estrangeira) em outras tabelas.`,
                errorDetail: err.message
            });
        }
        
        // Outros erros internos
        res.status(500).send(`Erro ao excluir registro ID ${id}: ${err.message}`);
    }
});


module.exports = router;
