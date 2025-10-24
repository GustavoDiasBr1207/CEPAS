const express = require('express');
const oracledb = require('oracledb');
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
const allowedTables = ['Monitor', 'Area', 'Familia', 'Entrevista', 'EntrevistaMonitor', 'Endereco', 'Membro', 'Animal', 'EstruturaHabitacao', 'RecursoSaneamento', 'SaudeMembro', 'CriancaCepas']; 

// Mapa de colunas de ID por tabela (alinha com o schema)
const idColumnMap = {
    Monitor: 'id_monitor',
    Area: 'id_area',
    Familia: 'id_familia',
    Entrevista: 'id_entrevista',
    EntrevistaMonitor: 'id_entrevista_monitor',
    Endereco: 'id_endereco',
    Membro: 'id_membro',
    Animal: 'id_animal',
    EstruturaHabitacao: 'id_estrutura',
    RecursoSaneamento: 'id_recurso',
    SaudeMembro: 'id_saude',
    CriancaCepas: 'id_crianca',
};

// Tabelas que possuem a coluna usuario_responsavel no schema
const tablesWithUsuarioResponsavel = new Set(['Monitor', 'Familia', 'Entrevista', 'Membro']);

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

        // 6. Inserir membros da família (se fornecidos)
        const membrosInseridos = [];
        if (dadosCompletos.membros && Array.isArray(dadosCompletos.membros) && dadosCompletos.membros.length > 0) {
            console.log(`Inserindo ${dadosCompletos.membros.length} membros da família...`);
            
            for (const membro of dadosCompletos.membros) {
                console.log('Inserindo membro:', membro.nome);
                
                // Dados completos do membro (conforme schema Oracle)
                const dadosMembro = {
                    id_familia: idFamilia,
                    nome: membro.nome,
                    data_nascimento: membro.data_nascimento ? new Date(membro.data_nascimento) : null,
                    relacao: membro.relacao || null,
                    ocupacao: membro.ocupacao || null,
                    sexo: membro.sexo || null,
                    cor: membro.cor || null,
                    estado_civil: membro.estado_civil || null,
                    alfabetizado: membro.alfabetizado || 0,
                    religiao: membro.religiao || null,
                    usuario_responsavel: usuario
                };
                const idMembro = await insertRecord('Membro', dadosMembro);
                console.log(`Membro ${membro.nome} inserido com ID: ${idMembro}`);

                // Inserir dados de saúde do membro (se fornecidos)
                if (membro.saude && Object.keys(membro.saude).some(key => membro.saude[key] !== '' && membro.saude[key] !== null && membro.saude[key] !== 0)) {
                    console.log('Inserindo dados de saúde do membro...');
                    const dadosSaude = {
                        id_membro: idMembro,
                        hipertensao: membro.saude.hipertensao || 0,
                        diabetes: membro.saude.diabetes || 0,
                        tabagismo: membro.saude.tabagismo || 0,
                        etilismo: membro.saude.etilismo || 0,
                        sedentarismo: membro.saude.sedentarismo || 0,
                        hospitalizacao: membro.saude.hospitalizacao || 0,
                        vacinacao_em_dia: membro.saude.vacinacao_em_dia || 0,
                        cirurgias: membro.saude.cirurgias || 0,
                        obesidade: membro.saude.obesidade || 0,
                        gestante: membro.saude.gestante || 0,
                        outras_condicoes: membro.saude.outras_condicoes || null
                    };
                    await insertRecord('SaudeMembro', dadosSaude);
                    console.log('Dados de saúde do membro inseridos com sucesso');
                }

                // Inserir dados de criança CEPAS (se houver dados)
                if (membro.crianca_cepas && (membro.crianca_cepas.data_inicio || membro.crianca_cepas.turno || membro.crianca_cepas.atividade)) {
                    console.log('Inserindo dados de criança CEPAS...');
                    const dadosCrianca = {
                        id_membro: idMembro,
                        data_inicio: membro.crianca_cepas.data_inicio ? new Date(membro.crianca_cepas.data_inicio) : null,
                        data_fim: membro.crianca_cepas.data_fim ? new Date(membro.crianca_cepas.data_fim) : null,
                        turno: membro.crianca_cepas.turno || null,
                        atividade: membro.crianca_cepas.atividade || null,
                        observacoes: membro.crianca_cepas.observacoes || null
                    };
                    await insertRecord('CriancaCepas', dadosCrianca);
                    console.log('Dados de criança CEPAS inseridos com sucesso');
                }

                membrosInseridos.push({
                    id_membro: idMembro,
                    nome: membro.nome
                });
            }
        }

        // 7. Inserir dados da entrevista (se fornecidos)
        let idEntrevista = null;
        if (dadosCompletos.entrevista && dadosCompletos.entrevista.data_entrevista) {
            console.log('Inserindo dados da entrevista...');
            const dadosEntrevista = {
                id_familia: idFamilia,
                data_entrevista: dadosCompletos.entrevista.data_entrevista ? new Date(dadosCompletos.entrevista.data_entrevista) : null,
                entrevistado: dadosCompletos.entrevista.entrevistado || null,
                telefone_contato: dadosCompletos.entrevista.telefone_contato || null,
                observacoes: dadosCompletos.entrevista.observacoes || null,
                usuario_responsavel: usuario
            };
            idEntrevista = await insertRecord('Entrevista', dadosEntrevista);
            console.log('Entrevista inserida com ID:', idEntrevista);
        }

        // Buscar e retornar o objeto completo da família cadastrada
        const familiaCompleta = await fetchTableData('Familia', `SELECT * FROM Familia WHERE id_familia = :id`, { id: idFamilia });
        const enderecoCompleto = await fetchTableData('Endereco', `SELECT * FROM Endereco WHERE id_familia = :id`, { id: idFamilia });
        const animalCompleto = await fetchTableData('Animal', `SELECT * FROM Animal WHERE id_familia = :id`, { id: idFamilia });
        const estruturaCompleta = await fetchTableData('EstruturaHabitacao', `SELECT * FROM EstruturaHabitacao WHERE id_familia = :id`, { id: idFamilia });
        const saneamentoCompleto = await fetchTableData('RecursoSaneamento', `SELECT * FROM RecursoSaneamento WHERE id_familia = :id`, { id: idFamilia });
        const membrosCompleto = await fetchTableData('Membro', `SELECT * FROM Membro WHERE id_familia = :id`, { id: idFamilia });
        const entrevistaCompleta = idEntrevista ? await fetchTableData('Entrevista', `SELECT * FROM Entrevista WHERE id_entrevista = :id`, { id: idEntrevista }) : [];

        // Buscar saúde e crianca_cepas para cada membro
        for (const membro of membrosCompleto) {
            membro.saude = (await fetchTableData('SaudeMembro', `SELECT * FROM SaudeMembro WHERE id_membro = :id`, { id: membro.ID_MEMBRO }))[0] || {};
            membro.crianca_cepas = (await fetchTableData('CriancaCepas', `SELECT * FROM CriancaCepas WHERE id_membro = :id ORDER BY data_inicio DESC`, { id: membro.ID_MEMBRO }))[0] || {};
        }

        console.log('=== CADASTRO COMPLETO FINALIZADO COM SUCESSO ===');
        res.status(201).json({
            success: true,
            message: 'Família cadastrada com sucesso com todos os dados relacionados!',
            id_familia: idFamilia,
            familia: familiaCompleta[0] || {},
            endereco: enderecoCompleto[0] || {},
            animal: animalCompleto[0] || {},
            estrutura: estruturaCompleta[0] || {},
            saneamento: saneamentoCompleto[0] || {},
            membros: membrosCompleto,
            entrevista: entrevistaCompleta[0] || {}
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
        if (id) {
            const idCol = idColumnMap[tableName];
            if (!idCol) return res.status(400).send('Tabela não suportada para busca por ID.');
            const sql = `SELECT * FROM ${tableName} WHERE ${idCol} = :id`;
            const rows = await fetchTableData(tableName, sql, { id });
            if (!rows || rows.length === 0) {
                return res.status(404).send(`${tableName} ID ${id} não encontrado.`);
            }
            return res.status(200).json(rows[0]);
        }

        const data = await fetchTableData(tableName);
        return res.status(200).json(data);
    } catch (err) {
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

    // Adiciona campos de auditoria somente nas tabelas que possuem a coluna
    if (tablesWithUsuarioResponsavel.has(tableName)) {
        newRecord.usuario_responsavel = req.headers['x-user'] || 'sistema_api';
    }
    
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

    // Adiciona campos de auditoria somente nas tabelas que possuem a coluna
    if (tablesWithUsuarioResponsavel.has(tableName)) {
        updates.usuario_responsavel = req.headers['x-user'] || 'sistema_api';
    }

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
        const idCol = idColumnMap[tableName];
        const rowsAffected = await deleteRecord(tableName, id, idCol ? idCol : undefined);

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

// ------------------------------------
// ROTAS ESPECÍFICAS PARA FAMÍLIAS
// ------------------------------------

/**
 * Endpoint: GET /api/familia/:id - Busca dados completos de uma família para edição
 */
router.get('/familia/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log(`📋 Recebida requisição para buscar família ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            message: 'ID da família inválido ou ausente'
        });
    }
    
    try {
        // Busca dados da família
        const familia = await fetchTableData('Familia', `SELECT * FROM Familia WHERE id_familia = :id`, { id });
        
        if (!familia || familia.length === 0) {
            return res.status(404).json({
                message: `Família com ID ${id} não encontrada`
            });
        }
        
        console.log(`📝 Buscando dados relacionados da família ID: ${id}...`);
        
        // Busca dados relacionados
        const endereco = await fetchTableData('Endereco', `SELECT * FROM Endereco WHERE id_familia = :id`, { id });
        const membros = await fetchTableData('Membro', `SELECT * FROM Membro WHERE id_familia = :id`, { id });
        const animal = await fetchTableData('Animal', `SELECT * FROM Animal WHERE id_familia = :id`, { id });
        const estrutura = await fetchTableData('EstruturaHabitacao', `SELECT * FROM EstruturaHabitacao WHERE id_familia = :id`, { id });
        const saneamento = await fetchTableData('RecursoSaneamento', `SELECT * FROM RecursoSaneamento WHERE id_familia = :id`, { id });

        // Saúde dos membros e Criança CEPAS (para todos os membros da família)
        const saudes = await fetchTableData('SaudeMembro', `
            SELECT s.*
            FROM SaudeMembro s
            JOIN Membro m ON m.id_membro = s.id_membro
            WHERE m.id_familia = :id
        `, { id });

        const criancas = await fetchTableData('CriancaCepas', `
            SELECT c.*
            FROM CriancaCepas c
            JOIN Membro m ON m.id_membro = c.id_membro
            WHERE m.id_familia = :id
        `, { id });

        // Última entrevista da família (prefill opcional)
        const entrevistaRows = await fetchTableData('Entrevista', `
            SELECT * FROM (
                SELECT e.*, ROW_NUMBER() OVER (PARTITION BY e.id_familia ORDER BY e.data_entrevista DESC, e.id_entrevista DESC) rn
                FROM Entrevista e WHERE e.id_familia = :id
            ) WHERE rn = 1
        `, { id });

        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (d) => (d instanceof Date) ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` : (d ? new Date(d).toISOString().split('T')[0] : '');

        const fam = familia[0];
        const end = endereco[0] || {};
        const ani = animal[0] || {};
        const est = estrutura[0] || {};
        const san = saneamento[0] || {};

        const saudeByMembro = new Map((saudes || []).map(s => [s.ID_MEMBRO, s]));
        const criancasByMembro = new Map();
        (criancas || []).forEach(c => {
            const arr = criancasByMembro.get(c.ID_MEMBRO) || [];
            arr.push(c);
            criancasByMembro.set(c.ID_MEMBRO, arr);
        });

        const membrosNorm = (membros || []).map(m => {
            const s = saudeByMembro.get(m.ID_MEMBRO);
            const cList = criancasByMembro.get(m.ID_MEMBRO) || [];
            // pegar a com maior data_inicio
            let latest = null;
            for (const c of cList) {
                if (!latest) latest = c; else {
                    const da = c.DATA_INICIO instanceof Date ? c.DATA_INICIO : new Date(c.DATA_INICIO);
                    const db = latest.DATA_INICIO instanceof Date ? latest.DATA_INICIO : new Date(latest.DATA_INICIO);
                    if (da > db) latest = c;
                }
            }
            return {
                id_membro: m.ID_MEMBRO,
                nome: m.NOME || '',
                data_nascimento: fmt(m.DATA_NASCIMENTO) || '',
                relacao: m.RELACAO || '',
                ocupacao: m.OCUPACAO || '',
                sexo: m.SEXO || '',
                cor: m.COR || '',
                estado_civil: m.ESTADO_CIVIL || '',
                alfabetizado: m.ALFABETIZADO || 0,
                religiao: m.RELIGIAO || '',
                saude: s ? {
                    hipertensao: s.HIPERTENSAO || 0,
                    diabetes: s.DIABETES || 0,
                    tabagismo: s.TABAGISMO || 0,
                    etilismo: s.ETILISMO || 0,
                    sedentarismo: s.SEDENTARISMO || 0,
                    hospitalizacao: s.HOSPITALIZACAO || 0,
                    vacinacao_em_dia: s.VACINACAO_EM_DIA || 0,
                    cirurgias: s.CIRURGIAS || 0,
                    obesidade: s.OBESIDADE || 0,
                    gestante: s.GESTANTE || 0,
                    outras_condicoes: s.OUTRAS_CONDICOES || ''
                } : undefined,
                crianca_cepas: latest ? {
                    ativa: latest.DATA_FIM == null,
                    data_inicio: fmt(latest.DATA_INICIO) || '',
                    data_fim: fmt(latest.DATA_FIM) || '',
                    turno: latest.TURNO || '',
                    atividade: latest.ATIVIDADE || '',
                    observacoes: latest.OBSERVACOES || ''
                } : { ativa: false, data_inicio: '', data_fim: '', turno: '', atividade: '', observacoes: '' }
            };
        });

        const entrevista = entrevistaRows && entrevistaRows[0] ? {
            data_entrevista: fmt(entrevistaRows[0].DATA_ENTREVISTA) || '',
            entrevistado: entrevistaRows[0].ENTREVISTADO || '',
            telefone_contato: entrevistaRows[0].TELEFONE_CONTATO || '',
            observacoes: entrevistaRows[0].OBSERVACOES || ''
        } : null;

        const dadosCompletos = {
            // Dados principais
            nome_familia: fam.NOME_FAMILIA || '',
            migracao: fam.MIGRACAO || '',
            estado_origem: fam.ESTADO_ORIGEM || '',
            cidade_origem: fam.CIDADE_ORIGEM || '',
            recebe_beneficio: fam.RECEBE_BENEFICIO || 0,
            possui_plano_saude: fam.POSSUI_PLANO_SAUDE || 0,
            convenio: fam.CONVENIO || '',
            observacoes: fam.OBSERVACOES || '',

            // Relacionamentos 1:1
            endereco: {
                id_area: end.ID_AREA || '',
                quadra: end.QUADRA || '',
                rua: end.RUA || '',
                numero_casa: end.NUMERO_CASA || '',
                complemento: end.COMPLEMENTO || ''
            },
            animal: {
                tem_animal: ani.TEM_ANIMAL || 0,
                qtd_animais: ani.QTD_ANIMAIS || '',
                qual_animal: ani.QUAL_ANIMAL || ''
            },
            estrutura: {
                tipo_habitacao: est.TIPO_HABITACAO || '',
                tipo_lote: est.TIPO_LOTE || '',
                situacao_convivencia: est.SITUACAO_CONVIVENCIA || '',
                energia_eletrica: est.ENERGIA_ELETRICA || 0,
                material_parede: est.MATERIAL_PAREDE || '',
                material_piso: est.MATERIAL_PISO || '',
                material_cobertura: est.MATERIAL_COBERTURA || '',
                qtd_quartos: est.QTD_QUARTOS || '',
                qtd_camas: est.QTD_CAMAS || '',
                tipo_camas: est.TIPO_CAMAS || ''
            },
            saneamento: {
                horta: san.HORTA || 0,
                arvore_frutifera: san.ARVORE_FRUTIFERA || 0,
                como_escoa: san.COMO_ESCOA || '',
                tem_banheiro: san.TEM_BANHEIRO || 0,
                dest_lixo: san.DEST_LIXO || '',
                bebe_agua: san.BEBE_AGUA || '',
                trata_agua: san.TRATA_AGUA || ''
            },

            // Membros e entrevista
            membros: membrosNorm,
            entrevista
        };
        
        console.log(`✅ Dados completos da família ID ${id} recuperados`);
        
        res.status(200).json({
            message: `Dados da família ID ${id} recuperados com sucesso`,
            data: dadosCompletos
        });
        
    } catch (err) {
        console.error('❌ Erro ao buscar família:', err);
        res.status(500).json({
            message: 'Erro interno ao buscar dados da família',
            error: err.message
        });
    }
});

/**
 * Endpoint: PUT /api/familia/:id - Atualiza dados completos de uma família
 */
router.put('/familia/:id', async (req, res) => {
    const { id } = req.params;
    const dadosCompletos = req.body;
    
    console.log(`🔄 Recebida requisição para atualizar família ID: ${id}`);
    console.log('📝 Dados recebidos:', JSON.stringify(dadosCompletos, null, 2));
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            message: 'ID da família inválido ou ausente'
        });
    }
    
    if (!dadosCompletos || typeof dadosCompletos !== 'object') {
        return res.status(400).json({
            message: 'Dados da família não fornecidos ou inválidos'
        });
    }
    
    try {
        // Verifica se a família existe
        const familiaExiste = await fetchTableData('Familia', `SELECT id_familia FROM Familia WHERE id_familia = :id`, { id });
        
        if (!familiaExiste || familiaExiste.length === 0) {
            return res.status(404).json({
                message: `Família com ID ${id} não encontrada`
            });
        }
        
        console.log(`📝 Iniciando atualização da família ID: ${id}...`);
        
        let totalAtualizados = 0;
        const relatorio = {};
        
        // 1. Atualizar dados principais da família
        const dadosFamilia = {
            nome_familia: dadosCompletos.nome_familia,
            migracao: dadosCompletos.migracao,
            estado_origem: dadosCompletos.estado_origem,
            cidade_origem: dadosCompletos.cidade_origem,
            recebe_beneficio: dadosCompletos.recebe_beneficio,
            possui_plano_saude: dadosCompletos.possui_plano_saude,
            convenio: dadosCompletos.convenio,
            observacoes: dadosCompletos.observacoes
        };
        
        // Remove campos undefined/null
        Object.keys(dadosFamilia).forEach(key => {
            if (dadosFamilia[key] === undefined || dadosFamilia[key] === null) {
                delete dadosFamilia[key];
            }
        });
        
        if (Object.keys(dadosFamilia).length > 0) {
            try {
                const rowsAffected = await updateRecord('Familia', id, dadosFamilia);
                relatorio.Familia = `${rowsAffected} registros atualizados`;
                totalAtualizados += rowsAffected;
                console.log(`✅ Familia: ${rowsAffected} registros atualizados`);
            } catch (err) {
                console.log(`⚠️ Familia: ${err.message}`);
                relatorio.Familia = `Erro: ${err.message}`;
            }
        }
        
        // 2. Atualizar endereço (se existir)
        if (dadosCompletos.endereco && Object.keys(dadosCompletos.endereco).length > 0) {
            try {
                const enderecoExiste = await fetchTableData('Endereco', `SELECT id_endereco FROM Endereco WHERE id_familia = :id`, { id });
                
                if (enderecoExiste && enderecoExiste.length > 0) {
                    const rowsAffected = await updateRecord('Endereco', enderecoExiste[0].ID_ENDERECO, dadosCompletos.endereco);
                    relatorio.Endereco = `${rowsAffected} registros atualizados`;
                    totalAtualizados += rowsAffected;
                } else {
                    dadosCompletos.endereco.id_familia = id;
                    const novoId = await insertRecord('Endereco', dadosCompletos.endereco);
                    relatorio.Endereco = `Novo endereço criado com ID ${novoId}`;
                    totalAtualizados += 1;
                }
                console.log(`✅ Endereco: ${relatorio.Endereco}`);
            } catch (err) {
                console.log(`⚠️ Endereco: ${err.message}`);
                relatorio.Endereco = `Erro: ${err.message}`;
            }
        }
        
        // 3. Atualizar animal (se existir)
        if (dadosCompletos.animal && Object.keys(dadosCompletos.animal).length > 0) {
            try {
                const animalExiste = await fetchTableData('Animal', `SELECT id_animal FROM Animal WHERE id_familia = :id`, { id });
                
                if (animalExiste && animalExiste.length > 0) {
                    const rowsAffected = await updateRecord('Animal', animalExiste[0].ID_ANIMAL, dadosCompletos.animal);
                    relatorio.Animal = `${rowsAffected} registros atualizados`;
                    totalAtualizados += rowsAffected;
                } else {
                    dadosCompletos.animal.id_familia = id;
                    const novoId = await insertRecord('Animal', dadosCompletos.animal);
                    relatorio.Animal = `Novo registro criado com ID ${novoId}`;
                    totalAtualizados += 1;
                }
                console.log(`✅ Animal: ${relatorio.Animal}`);
            } catch (err) {
                console.log(`⚠️ Animal: ${err.message}`);
                relatorio.Animal = `Erro: ${err.message}`;
            }
        }
        
        // 4. Atualizar estrutura habitacional (se existir)
        if (dadosCompletos.estrutura && Object.keys(dadosCompletos.estrutura).length > 0) {
            try {
                const estruturaExiste = await fetchTableData('EstruturaHabitacao', `SELECT id_estrutura FROM EstruturaHabitacao WHERE id_familia = :id`, { id });
                
                if (estruturaExiste && estruturaExiste.length > 0) {
                    const rowsAffected = await updateRecord('EstruturaHabitacao', estruturaExiste[0].ID_ESTRUTURA, dadosCompletos.estrutura);
                    relatorio.EstruturaHabitacao = `${rowsAffected} registros atualizados`;
                    totalAtualizados += rowsAffected;
                } else {
                    dadosCompletos.estrutura.id_familia = id;
                    const novoId = await insertRecord('EstruturaHabitacao', dadosCompletos.estrutura);
                    relatorio.EstruturaHabitacao = `Nova estrutura criada com ID ${novoId}`;
                    totalAtualizados += 1;
                }
                console.log(`✅ EstruturaHabitacao: ${relatorio.EstruturaHabitacao}`);
            } catch (err) {
                console.log(`⚠️ EstruturaHabitacao: ${err.message}`);
                relatorio.EstruturaHabitacao = `Erro: ${err.message}`;
            }
        }
        
        // 5. Atualizar saneamento (se existir)
        if (dadosCompletos.saneamento && Object.keys(dadosCompletos.saneamento).length > 0) {
            try {
                const saneamentoExiste = await fetchTableData('RecursoSaneamento', `SELECT id_recurso FROM RecursoSaneamento WHERE id_familia = :id`, { id });
                
                if (saneamentoExiste && saneamentoExiste.length > 0) {
                    const rowsAffected = await updateRecord('RecursoSaneamento', saneamentoExiste[0].ID_RECURSO, dadosCompletos.saneamento);
                    relatorio.RecursoSaneamento = `${rowsAffected} registros atualizados`;
                    totalAtualizados += rowsAffected;
                } else {
                    dadosCompletos.saneamento.id_familia = id;
                    const novoId = await insertRecord('RecursoSaneamento', dadosCompletos.saneamento);
                    relatorio.RecursoSaneamento = `Novo recurso criado com ID ${novoId}`;
                    totalAtualizados += 1;
                }
                console.log(`✅ RecursoSaneamento: ${relatorio.RecursoSaneamento}`);
            } catch (err) {
                console.log(`⚠️ RecursoSaneamento: ${err.message}`);
                relatorio.RecursoSaneamento = `Erro: ${err.message}`;
            }
        }
        
        // 6. Atualizar membros (se existir)
        if (dadosCompletos.membros && Array.isArray(dadosCompletos.membros)) {
            try {
                // Buscar membros existentes da família
                const membrosExistentes = await fetchTableData('Membro', 
                    `SELECT id_membro FROM Membro WHERE id_familia = :id`, { id });
                const idsExistentes = new Set(membrosExistentes.map(m => m.ID_MEMBRO));
                
                let membrosAtualizados = 0;
                let membrosCriados = 0;
                
                for (const membro of dadosCompletos.membros) {
                    // Dados do membro conforme schema Oracle
                    const dadosMembro = {
                        nome: membro.nome,
                        data_nascimento: membro.data_nascimento ? new Date(membro.data_nascimento) : null,
                        relacao: membro.relacao,
                        ocupacao: membro.ocupacao,
                        sexo: membro.sexo,
                        cor: membro.cor,
                        estado_civil: membro.estado_civil,
                        alfabetizado: membro.alfabetizado,
                        religiao: membro.religiao
                    };
                    
                    // Remove campos undefined/null
                    Object.keys(dadosMembro).forEach(key => {
                        if (dadosMembro[key] === undefined || dadosMembro[key] === null) {
                            delete dadosMembro[key];
                        }
                    });
                    
                    let idMembro;
                    if (membro.id_membro && idsExistentes.has(membro.id_membro)) {
                        // Atualizar membro existente
                        await updateRecord('Membro', membro.id_membro, dadosMembro);
                        idMembro = membro.id_membro;
                        membrosAtualizados++;
                    } else {
                        // Criar novo membro
                        dadosMembro.id_familia = id;
                        idMembro = await insertRecord('Membro', dadosMembro);
                        membrosCriados++;
                    }
                    
                    // Atualizar ou criar SaudeMembro (se existir dados de saúde)
                    if (membro.saude && Object.keys(membro.saude).length > 0) {
                        const saudeExiste = await fetchTableData('SaudeMembro', 
                            `SELECT id_saude FROM SaudeMembro WHERE id_membro = :idMembro`, { idMembro });
                        
                        if (saudeExiste && saudeExiste.length > 0) {
                            await updateRecord('SaudeMembro', saudeExiste[0].ID_SAUDE, membro.saude);
                        } else {
                            membro.saude.id_membro = idMembro;
                            await insertRecord('SaudeMembro', membro.saude);
                        }
                    }
                    
                    // Atualizar ou criar CriancaCepas (se existir dados CEPAS)
                    if (membro.crianca_cepas && Object.keys(membro.crianca_cepas).length > 0) {
                        // Buscar registro CEPAS mais recente (sem data_fim) para esse membro
                        const cepasAtual = await fetchTableData('CriancaCepas', 
                            `SELECT id_crianca FROM CriancaCepas WHERE id_membro = :idMembro AND data_fim IS NULL`, 
                            { idMembro });
                        
                        const dadosCepas = {
                            data_inicio: membro.crianca_cepas.data_inicio ? new Date(membro.crianca_cepas.data_inicio) : null,
                            data_fim: membro.crianca_cepas.data_fim ? new Date(membro.crianca_cepas.data_fim) : null,
                            turno: membro.crianca_cepas.turno,
                            atividade: membro.crianca_cepas.atividade,
                            observacoes: membro.crianca_cepas.observacoes
                        };
                        
                        // Remove campos undefined/null
                        Object.keys(dadosCepas).forEach(key => {
                            if (dadosCepas[key] === undefined || dadosCepas[key] === null) {
                                delete dadosCepas[key];
                            }
                        });
                        
                        if (cepasAtual && cepasAtual.length > 0) {
                            await updateRecord('CriancaCepas', cepasAtual[0].ID_CRIANCA, dadosCepas);
                        } else {
                            dadosCepas.id_membro = idMembro;
                            await insertRecord('CriancaCepas', dadosCepas);
                        }
                    }
                }
                
                relatorio.Membros = `${membrosAtualizados} atualizados, ${membrosCriados} criados`;
                totalAtualizados += membrosAtualizados + membrosCriados;
                console.log(`✅ Membros: ${relatorio.Membros}`);
            } catch (err) {
                console.log(`⚠️ Membros: ${err.message}`);
                relatorio.Membros = `Erro: ${err.message}`;
            }
        }
        
        // 7. Atualizar entrevista (se existir)
        if (dadosCompletos.entrevista && Object.keys(dadosCompletos.entrevista).length > 0) {
            try {
                const dadosEntrevista = {
                    data_entrevista: dadosCompletos.entrevista.data_entrevista ? new Date(dadosCompletos.entrevista.data_entrevista) : null,
                    entrevistado: dadosCompletos.entrevista.entrevistado,
                    telefone_contato: dadosCompletos.entrevista.telefone_contato,
                    observacoes: dadosCompletos.entrevista.observacoes
                };
                
                // Remove campos undefined/null
                Object.keys(dadosEntrevista).forEach(key => {
                    if (dadosEntrevista[key] === undefined || dadosEntrevista[key] === null) {
                        delete dadosEntrevista[key];
                    }
                });
                
                // Buscar entrevista mais recente da família
                const entrevistaExiste = await fetchTableData('Entrevista', 
                    `SELECT id_entrevista FROM Entrevista WHERE id_familia = :id ORDER BY data_entrevista DESC, id_entrevista DESC`, 
                    { id });
                
                if (entrevistaExiste && entrevistaExiste.length > 0 && Object.keys(dadosEntrevista).length > 0) {
                    const rowsAffected = await updateRecord('Entrevista', entrevistaExiste[0].ID_ENTREVISTA, dadosEntrevista);
                    relatorio.Entrevista = `${rowsAffected} registros atualizados`;
                    totalAtualizados += rowsAffected;
                } else if (Object.keys(dadosEntrevista).length > 0) {
                    dadosEntrevista.id_familia = id;
                    const novoId = await insertRecord('Entrevista', dadosEntrevista);
                    relatorio.Entrevista = `Nova entrevista criada com ID ${novoId}`;
                    totalAtualizados += 1;
                }
                console.log(`✅ Entrevista: ${relatorio.Entrevista || 'Sem alterações'}`);
            } catch (err) {
                console.log(`⚠️ Entrevista: ${err.message}`);
                relatorio.Entrevista = `Erro: ${err.message}`;
            }
        }
        
        console.log(`✅ Atualização concluída. Total de registros afetados: ${totalAtualizados}`);
        
        res.status(200).json({
            message: `Família ID ${id} atualizada com sucesso`,
            totalAtualizados: totalAtualizados,
            relatorio: relatorio
        });
        
    } catch (err) {
        console.error('❌ Erro ao atualizar família:', err);
        res.status(500).json({
            message: 'Erro interno ao atualizar família',
            error: err.message
        });
    }
});

/**
 * Endpoint: GET /api/familias - Lista todas as famílias com informações básicas
 */
router.get('/familias', async (req, res) => {
    console.log('📋 Recebida requisição para listar famílias...');
    
    try {
        // Conecta ao banco e executa query customizada para listar famílias
        let connection;
        try {
            connection = await oracledb.getConnection(require('../dbConfig'));
            
            // Query: seleciona última entrevista por família (evita duplicidade)
            const query = `
                SELECT 
                    f.id_familia,
                    f.nome_familia,
                    f.migracao,
                    f.estado_origem,
                    f.cidade_origem,
                    f.recebe_beneficio,
                    f.possui_plano_saude,
                    f.convenio,
                    f.observacoes,
                    f.created_at as data_cadastro,
                    f.usuario_responsavel,
                    e.quadra,
                    e.rua,
                    e.numero_casa,
                    e.complemento,
                    ent.data_entrevista,
                    ent.entrevistado,
                    ent.telefone_contato
                FROM Familia f
                LEFT JOIN Endereco e ON f.id_familia = e.id_familia
                LEFT JOIN (
                    SELECT t.*
                    FROM (
                        SELECT 
                            id_entrevista,
                            id_familia,
                            data_entrevista,
                            entrevistado,
                            telefone_contato,
                            ROW_NUMBER() OVER (PARTITION BY id_familia ORDER BY data_entrevista DESC, id_entrevista DESC) AS rn
                        FROM Entrevista
                    ) t
                    WHERE t.rn = 1
                ) ent ON f.id_familia = ent.id_familia
                ORDER BY f.created_at DESC
            `;
            
            const result = await connection.execute(query, [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });
            
            // Processar os dados de forma mais simples e segura
            const familiasProcessadas = await Promise.all((result.rows || []).map(async (familia) => {
                try {
                    // Buscar informações adicionais de forma separada para evitar problemas
                    let totalMembros = 0;
                    let nomeResponsavel = 'Não informado';
                    
                    try {
                        // Primeiro buscar o total de membros
                        const totalResult = await connection.execute(
                            `SELECT COUNT(*) as TOTAL FROM Membro WHERE id_familia = :familiaId`,
                            [familia.ID_FAMILIA], { outFormat: oracledb.OUT_FORMAT_OBJECT }
                        );
                        
                        if (totalResult.rows && totalResult.rows[0]) {
                            totalMembros = totalResult.rows[0].TOTAL || 0;
                        }
                        
                        // Depois buscar o nome do responsável
                        const responsavelResult = await connection.execute(
                            `SELECT nome FROM Membro WHERE id_familia = :familiaId 
                             AND (UPPER(relacao) LIKE '%RESPONSAVEL%' OR UPPER(relacao) LIKE '%CHEFE%' OR UPPER(relacao) LIKE '%PAI%' OR UPPER(relacao) LIKE '%MAE%') 
                             AND ROWNUM = 1`,
                            [familia.ID_FAMILIA], { outFormat: oracledb.OUT_FORMAT_OBJECT }
                        );
                        
                        if (responsavelResult.rows && responsavelResult.rows.length > 0) {
                            nomeResponsavel = responsavelResult.rows[0].NOME;
                        } else {
                            // Se não encontrar responsável, buscar o primeiro membro
                            const primeiroResult = await connection.execute(
                                `SELECT nome FROM Membro WHERE id_familia = :familiaId AND ROWNUM = 1`,
                                [familia.ID_FAMILIA], { outFormat: oracledb.OUT_FORMAT_OBJECT }
                            );
                            
                            if (primeiroResult.rows && primeiroResult.rows.length > 0) {
                                nomeResponsavel = primeiroResult.rows[0].NOME;
                            }
                        }
                    } catch (err) {
                        console.log('Erro ao buscar membros:', err.message);
                    }
                    
                    // Contar crianças CEPAS ativas (data_fim null)
                    let criancasAtivas = 0;
                    try {
                        const criancasResult = await connection.execute(
                            `SELECT COUNT(*) AS TOTAL FROM CriancaCepas c
                             JOIN Membro m ON m.id_membro = c.id_membro
                             WHERE m.id_familia = :familiaId AND c.data_fim IS NULL`,
                            [familia.ID_FAMILIA], { outFormat: oracledb.OUT_FORMAT_OBJECT }
                        );
                        criancasAtivas = (criancasResult.rows && criancasResult.rows[0] && criancasResult.rows[0].TOTAL) || 0;
                    } catch (e) {
                        console.log('Erro ao contar crianças CEPAS ativas:', e.message);
                    }

                    return {
                        ...familia,
                        TOTAL_MEMBROS: totalMembros,
                        NOME_RESPONSAVEL: nomeResponsavel,
                        
                        // Formatar endereço
                        ENDERECO_COMPLETO: [
                            familia.RUA,
                            familia.NUMERO_CASA && `Nº ${familia.NUMERO_CASA}`,
                            familia.QUADRA && `Q: ${familia.QUADRA}`,
                            familia.COMPLEMENTO
                        ].filter(Boolean).join(', ') || 'Não informado',
                        
                        // Status simples
                        STATUS_BENEFICIO: familia.RECEBE_BENEFICIO ? '✅ Sim' : '❌ Não',
                        STATUS_PLANO_SAUDE: familia.POSSUI_PLANO_SAUDE ? '✅ Sim' : '❌ Não',
                        
                        // Composição familiar simples
                        COMPOSICAO_FAMILIAR: `👥 ${totalMembros} pessoa(s)`,
                        
                        // Status CEPAS (padrão para evitar erros)
                        CRIANCAS_ATIVAS_CEPAS: criancasAtivas,
                        STATUS_CEPAS: criancasAtivas > 0 ? '🎯 Ativo' : '⭕ Sem crianças',
                        
                        // Origem
                        ORIGEM_COMPLETA: [
                            familia.CIDADE_ORIGEM,
                            familia.ESTADO_ORIGEM,
                            familia.MIGRACAO && `(${familia.MIGRACAO})`
                        ].filter(Boolean).join(', ') || 'Não informado',
                        
                        // Status da entrevista
                        STATUS_ENTREVISTA: familia.DATA_ENTREVISTA ? 
                            `✅ ${new Date(familia.DATA_ENTREVISTA).toLocaleDateString('pt-BR')}` + 
                            (familia.ENTREVISTADO ? ` - ${familia.ENTREVISTADO}` : '') :
                            '⏳ Pendente',
                        
                        // Contato
                        CONTATO: familia.TELEFONE_CONTATO || 'Não informado'
                    };
                } catch (err) {
                    console.log('Erro ao processar família:', err.message);
                    return {
                        ...familia,
                        NOME_RESPONSAVEL: 'Erro ao carregar',
                        ENDERECO_COMPLETO: 'Erro ao carregar',
                        TOTAL_MEMBROS: 0
                    };
                }
            }));
            
            familias = familiasProcessadas;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
        
    console.log(`✅ Encontradas ${familias.length} famílias`);
        res.status(200).json({
            message: `${familias.length} famílias encontradas`,
            data: familias
        });
        
    } catch (err) {
        console.error('❌ Erro ao listar famílias:', err);
        res.status(500).json({
            message: 'Erro interno ao listar famílias',
            error: err.message
        });
    }
});

/**
 * Endpoint: DELETE /api/familia/:id - Deleta uma família e todos os dados relacionados
 */
router.delete('/familia/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log(`🗑️ Recebida requisição para deletar família ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            message: 'ID da família inválido ou ausente'
        });
    }
    
    try {
        // Verifica se a família existe
    const familiaExiste = await fetchTableData('Familia', `SELECT id_familia FROM Familia WHERE id_familia = :id`, { id });
        
        if (!familiaExiste || familiaExiste.length === 0) {
            return res.status(404).json({
                message: `Família com ID ${id} não encontrada`
            });
        }
        
        console.log(`📝 Iniciando exclusão da família ID: ${id}...`);
        
        // Ordem de exclusão respeitando as chaves estrangeiras
        const tabelasParaDeletar = [
            // Primeiro dependentes de Membro
            'CriancaCepas',
            'SaudeMembro',
            // Depois Membro
            'Membro',
            // Entrevistas e relação de monitores
            'EntrevistaMonitor',
            'Entrevista',
            // Dependentes 1:1 de Família
            'Animal', 
            'EstruturaHabitacao',
            'RecursoSaneamento',
            'Endereco',
            // Por fim a própria Família
            'Familia'
        ];

        let totalExcluidos = 0;
        const relatorio = {};

        for (const tabela of tabelasParaDeletar) {
            try {
                let rowsAffected = 0;
                if (tabela === 'EntrevistaMonitor') {
                    // Precisa excluir por subconsulta das entrevistas da família
                    const conn = await oracledb.getConnection(require('../dbConfig'));
                    try {
                        const result = await conn.execute(
                            `DELETE FROM EntrevistaMonitor WHERE id_entrevista IN (
                                SELECT id_entrevista FROM Entrevista WHERE id_familia = :id
                             )`,
                            { id }, { autoCommit: true }
                        );
                        rowsAffected = result.rowsAffected || 0;
                    } finally {
                        await conn.close();
                    }
                } else {
                    const idColumn = 'id_familia';
                    // Entrevista possui id_familia diretamente, demais também
                    rowsAffected = await deleteRecord(tabela, id, idColumn);
                }

                relatorio[tabela] = rowsAffected;
                totalExcluidos += rowsAffected;
                console.log(`✅ ${tabela}: ${rowsAffected} registros excluídos`);
            } catch (err) {
                console.log(`⚠️ ${tabela}: ${err.message}`);
                relatorio[tabela] = `Erro: ${err.message}`;
            }
        }
        
        console.log(`✅ Exclusão concluída. Total de registros excluídos: ${totalExcluidos}`);
        
        res.status(200).json({
            message: `Família ID ${id} e dados relacionados excluídos com sucesso`,
            totalExcluidos: totalExcluidos,
            relatorio: relatorio
        });
        
    } catch (err) {
        console.error('❌ Erro ao deletar família:', err);
        res.status(500).json({
            message: 'Erro interno ao deletar família',
            error: err.message
        });
    }
});


module.exports = router;

// ------------------------------------
// ROTAS ESPECÍFICAS PARA MONITORES
// ------------------------------------

/**
 * GET /api/monitores - Lista todos os monitores
 */
router.get('/monitores', async (req, res) => {
    try {
        const rows = await fetchTableData('Monitor');
        return res.status(200).json({ message: `${rows.length} monitores encontrados`, data: rows });
    } catch (err) {
        console.error('Erro ao listar monitores:', err);
        return res.status(500).json({ message: 'Erro interno ao listar monitores', error: err.message });
    }
});

/**
 * POST /api/monitores - Cria um novo monitor
 */
router.post('/monitores', async (req, res) => {
    const novo = req.body || {};
    const usuario = req.headers['x-user'] || 'sistema_api';

    // Validações básicas
    if (!novo.nome || typeof novo.nome !== 'string' || novo.nome.trim() === '') {
        return res.status(400).json({ success: false, message: 'Campo "nome" é obrigatório.' });
    }
    if (!novo.email || typeof novo.email !== 'string' || novo.email.trim() === '') {
        return res.status(400).json({ success: false, message: 'Campo "email" é obrigatório.' });
    }

    // Adiciona auditoria
    novo.usuario_responsavel = usuario;

    try {
        const newId = await insertRecord('Monitor', novo);
        return res.status(201).json({ success: true, message: 'Monitor criado com sucesso', id_monitor: newId, data: novo });
    } catch (err) {
        console.error('Erro ao criar monitor:', err);
        return res.status(500).json({ success: false, message: 'Erro interno ao criar monitor', error: err.message });
    }
});

/**
 * GET /api/monitores/:id - Busca um monitor por ID
 */
router.get('/monitores/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: 'ID inválido' });

    try {
        const rows = await fetchTableData('Monitor', `SELECT * FROM Monitor WHERE id_monitor = :id`, { id });
        if (!rows || rows.length === 0) return res.status(404).json({ message: `Monitor ID ${id} não encontrado` });
        return res.status(200).json({ data: rows[0] });
    } catch (err) {
        console.error('Erro ao buscar monitor:', err);
        return res.status(500).json({ message: 'Erro interno ao buscar monitor', error: err.message });
    }
});

/**
 * PUT /api/monitores/:id - Atualiza um monitor
 */
router.put('/monitores/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body || {};
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: 'ID inválido' });
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Nenhum dado para atualizar' });

    // Adiciona auditoria se necessário
    updates.usuario_responsavel = req.headers['x-user'] || 'sistema_api';

    try {
        const rowsAffected = await updateRecord('Monitor', id, updates);
        if (rowsAffected === 0) return res.status(404).json({ message: `Monitor ID ${id} não encontrado` });
        return res.status(200).json({ message: `Monitor ID ${id} atualizado`, rowsAffected });
    } catch (err) {
        console.error('Erro ao atualizar monitor:', err);
        return res.status(500).json({ message: 'Erro interno ao atualizar monitor', error: err.message });
    }
});

/**
 * DELETE /api/monitores/:id - Remove um monitor
 */
router.delete('/monitores/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: 'ID inválido' });

    try {
        const rowsAffected = await deleteRecord('Monitor', id, 'id_monitor');
        if (rowsAffected === 0) return res.status(404).json({ message: `Monitor ID ${id} não encontrado` });
        return res.status(200).json({ message: `Monitor ID ${id} excluído`, rowsAffected });
    } catch (err) {
        // Checar integridade referencial
        if (err.message && err.message.includes('ORA-02292')) {
            return res.status(409).json({ message: 'Não é possível excluir o monitor: existem referências relacionadas (EntrevistaMonitor).', error: err.message });
        }
        console.error('Erro ao excluir monitor:', err);
        return res.status(500).json({ message: 'Erro interno ao excluir monitor', error: err.message });
    }
});
