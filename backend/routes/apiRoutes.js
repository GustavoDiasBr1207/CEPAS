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
const allowedTables = ['Monitor', 'Area', 'Familia', 'Entrevista', 'Membro', 'Endereco', 'Animal', 'EstruturaHabitacao', 'RecursoSaneamento', 'EntrevistaMonitor', 'SaudeMembro', 'CriancaCepas']; 

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
 * Rota especial para criação completa de família com todas as tabelas relacionadas
 * Endpoint: /api/familia-completa (POST)
 */
router.post('/familia-completa', async (req, res) => {
    console.log('=== RECEBIDA REQUISIÇÃO FAMÍLIA COMPLETA ===');
    console.log('Headers:', req.headers);
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    const dadosCompletos = req.body;
    const usuario = req.headers['x-user'] || 'sistema_api';
    
    try {
        // Validações básicas
        if (!dadosCompletos.nome_familia) {
            console.log('ERRO: Nome da família não fornecido');
            return res.status(400).json({ 
                success: false, 
                message: 'Nome da família é obrigatório.' 
            });
        }

        console.log('Iniciando inserção da família:', dadosCompletos.nome_familia);

        // 1. Inserir a família primeiro
        const dadosFamilia = {
            nome_familia: dadosCompletos.nome_familia,
            migracao: dadosCompletos.migracao || null,
            estado_origem: dadosCompletos.estado_origem || null,
            cidade_origem: dadosCompletos.cidade_origem || null,
            recebe_beneficio: dadosCompletos.recebe_beneficio || 0,
            possui_plano_saude: dadosCompletos.possui_plano_saude || 0,
            convenio: dadosCompletos.convenio || null,
            observacoes: dadosCompletos.observacoes || null,
            usuario_responsavel: usuario
        };

        console.log('Inserindo família com dados:', dadosFamilia);
        const idFamilia = await insertRecord('Familia', dadosFamilia);
        console.log('Família inserida com ID:', idFamilia);

        // 2. Inserir endereço (se fornecido)
        if (dadosCompletos.endereco && Object.keys(dadosCompletos.endereco).some(key => dadosCompletos.endereco[key])) {
            console.log('Inserindo endereço...');
            const dadosEndereco = {
                id_familia: idFamilia,
                id_area: dadosCompletos.endereco.id_area || null,
                quadra: dadosCompletos.endereco.quadra || null,
                rua: dadosCompletos.endereco.rua || null,
                numero_casa: dadosCompletos.endereco.numero_casa || null,
                complemento: dadosCompletos.endereco.complemento || null
            };
            await insertRecord('Endereco', dadosEndereco);
            console.log('Endereço inserido com sucesso');
        }

        // 3. Inserir dados de animais (sempre inserir pois tem_animal é obrigatório)
        console.log('Inserindo dados de animais...');
        const dadosAnimal = {
            id_familia: idFamilia,
            tem_animal: dadosCompletos.animal?.tem_animal || 0,
            qtd_animais: dadosCompletos.animal?.qtd_animais || null,
            qual_animal: dadosCompletos.animal?.qual_animal || null
        };
        await insertRecord('Animal', dadosAnimal);
        console.log('Dados de animais inseridos com sucesso');

        // 4. Inserir estrutura da habitação (se fornecida)
        if (dadosCompletos.estrutura && Object.keys(dadosCompletos.estrutura).some(key => dadosCompletos.estrutura[key] !== '' && dadosCompletos.estrutura[key] !== null)) {
            console.log('Inserindo estrutura da habitação...');
            const dadosEstrutura = {
                id_familia: idFamilia,
                tipo_habitacao: dadosCompletos.estrutura.tipo_habitacao || null,
                tipo_lote: dadosCompletos.estrutura.tipo_lote || null,
                situacao_convivencia: dadosCompletos.estrutura.situacao_convivencia || null,
                energia_eletrica: dadosCompletos.estrutura.energia_eletrica || 0,
                material_parede: dadosCompletos.estrutura.material_parede || null,
                material_piso: dadosCompletos.estrutura.material_piso || null,
                material_cobertura: dadosCompletos.estrutura.material_cobertura || null,
                qtd_quartos: dadosCompletos.estrutura.qtd_quartos || null,
                qtd_camas: dadosCompletos.estrutura.qtd_camas || null,
                tipo_camas: dadosCompletos.estrutura.tipo_camas || null
            };
            await insertRecord('EstruturaHabitacao', dadosEstrutura);
            console.log('Estrutura da habitação inserida com sucesso');
        }

        // 5. Inserir dados de saneamento (se fornecidos)
        if (dadosCompletos.saneamento && Object.keys(dadosCompletos.saneamento).some(key => dadosCompletos.saneamento[key] !== '' && dadosCompletos.saneamento[key] !== null)) {
            console.log('Inserindo dados de saneamento...');
            const dadosSaneamento = {
                id_familia: idFamilia,
                horta: dadosCompletos.saneamento.horta || 0,
                arvore_frutifera: dadosCompletos.saneamento.arvore_frutifera || 0,
                como_escoa: dadosCompletos.saneamento.como_escoa || null,
                tem_banheiro: dadosCompletos.saneamento.tem_banheiro || 0,
                dest_lixo: dadosCompletos.saneamento.dest_lixo || null,
                bebe_agua: dadosCompletos.saneamento.bebe_agua || null,
                trata_agua: dadosCompletos.saneamento.trata_agua || null
            };
            await insertRecord('RecursoSaneamento', dadosSaneamento);
            console.log('Dados de saneamento inseridos com sucesso');
        }

        console.log('=== CADASTRO COMPLETO FINALIZADO COM SUCESSO ===');
        res.status(201).json({
            success: true,
            message: 'Família cadastrada com sucesso com todos os dados relacionados!',
            id_familia: idFamilia,
            dados_processados: {
                familia: true,
                endereco: !!dadosCompletos.endereco,
                animal: true,
                estrutura: !!dadosCompletos.estrutura,
                saneamento: !!dadosCompletos.saneamento
            }
        });

    } catch (error) {
        console.error('=== ERRO DETALHADO NO CADASTRO ===');
        console.error('Erro completo:', error);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Dados recebidos:', JSON.stringify(dadosCompletos, null, 2));
        
        // Verificar se é erro específico do Oracle
        let errorMessage = error.message;
        if (error.message.includes('ORA-')) {
            errorMessage = `Erro do banco Oracle: ${error.message}`;
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno ao cadastrar a família completa.',
            error: errorMessage,
            details: {
                originalError: error.message,
                timestamp: new Date().toISOString(),
                dadosRecebidos: Object.keys(dadosCompletos || {})
            }
        });
    }
});

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
