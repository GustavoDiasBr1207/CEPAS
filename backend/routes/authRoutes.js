const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const oracledb = require('oracledb');
const { 
    fetchTableData, 
    insertRecord, 
    updateRecord,
    deleteRecord 
} = require('../oracle');
const { 
    generateTokens, 
    verifyRefreshToken, 
    authenticateToken,
    authorize,
    REFRESH_TOKEN_EXPIRES_IN 
} = require('../middleware/auth');

const router = express.Router();

// Rate limiting para login (máximo 5 tentativas por IP em 15 minutos)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting para cadastro (máximo 3 por IP por hora)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: {
        success: false,
        message: 'Muitos cadastros. Tente novamente em 1 hora.'
    }
});

/**
 * Função para registrar log do sistema
 */
async function registrarLog(idUsuario, acao, tabelaAfetada = null, idRegistro = null, req = null, detalhes = null) {
    try {
        const logData = {
            id_usuario: idUsuario,
            acao: acao,
            tabela_afetada: tabelaAfetada,
            id_registro: idRegistro,
            ip_address: req ? req.ip || req.connection.remoteAddress : null,
            user_agent: req ? req.get('User-Agent') : null,
            detalhes: detalhes ? JSON.stringify(detalhes) : null
        };
        
        await insertRecord('LogSistema', logData);
    } catch (err) {
        console.error('Erro ao registrar log:', err.message);
    }
}

/**
 * Função para hash de refresh token
 */
async function hashRefreshToken(token) {
    return await bcrypt.hash(token, 10);
}

/**
 * POST /auth/login - Autenticação de usuário
 */
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username e senha são obrigatórios'
        });
    }

    try {
        // Buscar usuário por username
        const usuarios = await fetchTableData('Usuario', 
            `SELECT * FROM Usuario WHERE LOWER(username) = LOWER(:username)`, 
            { username }
        );

        if (!usuarios || usuarios.length === 0) {
            await registrarLog(null, 'LOGIN_FAILED', null, null, req, { username, motivo: 'Usuário não encontrado' });
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const usuario = usuarios[0];

        // Verificar se usuário está ativo
        if (!usuario.ATIVO) {
            await registrarLog(usuario.ID_USUARIO, 'LOGIN_FAILED', null, null, req, { motivo: 'Usuário inativo' });
            return res.status(401).json({
                success: false,
                message: 'Usuário inativo'
            });
        }

        // Verificar se usuário não está bloqueado
        if (usuario.BLOQUEADO_ATE && new Date(usuario.BLOQUEADO_ATE) > new Date()) {
            await registrarLog(usuario.ID_USUARIO, 'LOGIN_FAILED', null, null, req, { motivo: 'Usuário bloqueado' });
            return res.status(423).json({
                success: false,
                message: 'Usuário temporariamente bloqueado',
                bloqueado_ate: usuario.BLOQUEADO_ATE
            });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(password, usuario.PASSWORD_HASH);
        
        if (!senhaValida) {
            // Incrementar tentativas de login
            const novasTentativas = (usuario.TENTATIVAS_LOGIN || 0) + 1;
            const updateData = { tentativas_login: novasTentativas };

            // Bloquear usuário após 5 tentativas
            if (novasTentativas >= 5) {
                updateData.bloqueado_ate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
            }

            await updateRecord('Usuario', usuario.ID_USUARIO, updateData);
            await registrarLog(usuario.ID_USUARIO, 'LOGIN_FAILED', null, null, req, { tentativas: novasTentativas });

            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas',
                tentativas_restantes: Math.max(0, 5 - novasTentativas)
            });
        }

        // Login bem-sucedido - resetar tentativas e atualizar último login
        await updateRecord('Usuario', usuario.ID_USUARIO, {
            tentativas_login: 0,
            bloqueado_ate: null,
            ultimo_login: new Date()
        });

        // Gerar tokens
        const { accessToken, refreshToken } = generateTokens(usuario);

        // Salvar refresh token no banco
        const refreshTokenHash = await hashRefreshToken(refreshToken);
        await insertRecord('RefreshToken', {
            id_usuario: usuario.ID_USUARIO,
            token_hash: refreshTokenHash,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
        });

        // Registrar log de sucesso
        await registrarLog(usuario.ID_USUARIO, 'LOGIN_SUCCESS', null, null, req);

        res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso',
            user: {
                id_usuario: usuario.ID_USUARIO,
                username: usuario.USERNAME,
                nome_completo: usuario.NOME_COMPLETO,
                email: usuario.EMAIL,
                tipo_usuario: usuario.TIPO_USUARIO,
                ultimo_login: usuario.ULTIMO_LOGIN
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: '24h'
            }
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /auth/refresh - Renovar token de acesso
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token é obrigatório'
        });
    }

    try {
        // Verificar se o refresh token é válido
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido'
            });
        }

        // Buscar o token no banco de dados
        const refreshTokenHash = await hashRefreshToken(refreshToken);
        const tokens = await fetchTableData('RefreshToken', 
            `SELECT * FROM RefreshToken WHERE id_usuario = :id_usuario AND revogado = 0 AND expires_at > SYSDATE`,
            { id_usuario: decoded.id_usuario }
        );

        let tokenValido = false;
        for (const token of tokens) {
            if (await bcrypt.compare(refreshToken, token.TOKEN_HASH)) {
                tokenValido = true;
                break;
            }
        }

        if (!tokenValido) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token não encontrado ou expirado'
            });
        }

        // Buscar dados atualizados do usuário
        const usuarios = await fetchTableData('Usuario', 
            `SELECT * FROM Usuario WHERE id_usuario = :id AND ativo = 1`,
            { id: decoded.id_usuario }
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado ou inativo'
            });
        }

        // Gerar novos tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(usuarios[0]);

        // Revogar o refresh token antigo
        await updateRecord('RefreshToken', tokens[0].ID_TOKEN, { revogado: 1 });

        // Salvar novo refresh token
        const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);
        await insertRecord('RefreshToken', {
            id_usuario: decoded.id_usuario,
            token_hash: newRefreshTokenHash,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
        });

        res.status(200).json({
            success: true,
            message: 'Token renovado com sucesso',
            tokens: {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: '24h'
            }
        });

    } catch (err) {
        console.error('Erro ao renovar token:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /auth/logout - Logout do usuário
 */
router.post('/logout', authenticateToken, async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Revogar refresh token se fornecido
        if (refreshToken) {
            const tokens = await fetchTableData('RefreshToken', 
                `SELECT * FROM RefreshToken WHERE id_usuario = :id_usuario AND revogado = 0`,
                { id_usuario: req.user.id_usuario }
            );

            for (const token of tokens) {
                if (await bcrypt.compare(refreshToken, token.TOKEN_HASH)) {
                    await updateRecord('RefreshToken', token.ID_TOKEN, { revogado: 1 });
                    break;
                }
            }
        }

        // Registrar log de logout
        await registrarLog(req.user.id_usuario, 'LOGOUT', null, null, req);

        res.status(200).json({
            success: true,
            message: 'Logout realizado com sucesso'
        });

    } catch (err) {
        console.error('Erro no logout:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /auth/register - Cadastro de novo usuário (apenas admins)
 */
router.post('/register', registerLimiter, authenticateToken, authorize('admin'), async (req, res) => {
    const { username, nome_completo, email, password, tipo_usuario } = req.body;

    if (!username || !nome_completo || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Todos os campos são obrigatórios'
        });
    }

    // Validar tipo de usuário
    const tiposValidos = ['admin', 'coordenador', 'monitor', 'visualizador'];
    if (tipo_usuario && !tiposValidos.includes(tipo_usuario)) {
        return res.status(400).json({
            success: false,
            message: 'Tipo de usuário inválido'
        });
    }

    try {
        // Verificar se username já existe
        const usuarioExiste = await fetchTableData('Usuario', 
            `SELECT id_usuario FROM Usuario WHERE LOWER(username) = LOWER(:username)`,
            { username }
        );

        if (usuarioExiste && usuarioExiste.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username já está em uso'
            });
        }

        // Verificar se email já existe
        const emailExiste = await fetchTableData('Usuario', 
            `SELECT id_usuario FROM Usuario WHERE LOWER(email) = LOWER(:email)`,
            { email }
        );

        if (emailExiste && emailExiste.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email já está em uso'
            });
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 12);

        // Criar usuário
        const novoUsuario = {
            username,
            nome_completo,
            email,
            password_hash: passwordHash,
            tipo_usuario: tipo_usuario || 'visualizador',
            usuario_responsavel: req.user.username
        };

        const idUsuario = await insertRecord('Usuario', novoUsuario);

        // Registrar log
        await registrarLog(req.user.id_usuario, 'USER_CREATED', 'Usuario', idUsuario, req, { novo_usuario: username });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                id_usuario: idUsuario,
                username,
                nome_completo,
                email,
                tipo_usuario: tipo_usuario || 'visualizador'
            }
        });

    } catch (err) {
        console.error('Erro ao criar usuário:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /auth/me - Obter dados do usuário atual
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // Buscar dados atualizados do usuário
        const usuarios = await fetchTableData('Usuario', 
            `SELECT id_usuario, username, nome_completo, email, tipo_usuario, ativo, ultimo_login, created_at 
             FROM Usuario WHERE id_usuario = :id`,
            { id: req.user.id_usuario }
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const usuario = usuarios[0];

        res.status(200).json({
            success: true,
            user: {
                id_usuario: usuario.ID_USUARIO,
                username: usuario.USERNAME,
                nome_completo: usuario.NOME_COMPLETO,
                email: usuario.EMAIL,
                tipo_usuario: usuario.TIPO_USUARIO,
                ativo: usuario.ATIVO,
                ultimo_login: usuario.ULTIMO_LOGIN,
                membro_desde: usuario.CREATED_AT
            }
        });

    } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /auth/users - Listar usuários (apenas admins)
 */
router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const usuarios = await fetchTableData('Usuario', 
            `SELECT id_usuario, username, nome_completo, email, tipo_usuario, ativo, ultimo_login, created_at, usuario_responsavel
             FROM Usuario ORDER BY created_at DESC`
        );

        const usuariosFormatados = usuarios.map(user => ({
            id_usuario: user.ID_USUARIO,
            username: user.USERNAME,
            nome_completo: user.NOME_COMPLETO,
            email: user.EMAIL,
            tipo_usuario: user.TIPO_USUARIO,
            ativo: user.ATIVO,
            ultimo_login: user.ULTIMO_LOGIN,
            membro_desde: user.CREATED_AT,
            usuario_responsavel: user.USUARIO_RESPONSAVEL
        }));

        res.status(200).json({
            success: true,
            users: usuariosFormatados,
            total: usuariosFormatados.length
        });

    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * PUT /auth/users/:id - Atualizar usuário (apenas admins)
 */
router.put('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { nome_completo, email, tipo_usuario, ativo } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: 'ID do usuário inválido'
        });
    }

    try {
        // Verificar se usuário existe
        const usuarioExiste = await fetchTableData('Usuario', 
            `SELECT id_usuario FROM Usuario WHERE id_usuario = :id`,
            { id }
        );

        if (!usuarioExiste || usuarioExiste.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Preparar dados para atualização
        const updateData = {};
        if (nome_completo !== undefined) updateData.nome_completo = nome_completo;
        if (email !== undefined) updateData.email = email;
        if (tipo_usuario !== undefined) {
            const tiposValidos = ['admin', 'coordenador', 'monitor', 'visualizador'];
            if (!tiposValidos.includes(tipo_usuario)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de usuário inválido'
                });
            }
            updateData.tipo_usuario = tipo_usuario;
        }
        if (ativo !== undefined) updateData.ativo = ativo ? 1 : 0;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum dado para atualizar'
            });
        }

        // Atualizar usuário
        const rowsAffected = await updateRecord('Usuario', id, updateData);

        if (rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado para atualização'
            });
        }

        // Registrar log
        await registrarLog(req.user.id_usuario, 'USER_UPDATED', 'Usuario', id, req, updateData);

        res.status(200).json({
            success: true,
            message: 'Usuário atualizado com sucesso'
        });

    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /auth/change-password - Alterar senha do usuário atual
 */
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Senha atual e nova senha são obrigatórias'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Nova senha deve ter pelo menos 6 caracteres'
        });
    }

    try {
        // Buscar dados do usuário
        const usuarios = await fetchTableData('Usuario', 
            `SELECT password_hash FROM Usuario WHERE id_usuario = :id`,
            { id: req.user.id_usuario }
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verificar senha atual
        const senhaValida = await bcrypt.compare(currentPassword, usuarios[0].PASSWORD_HASH);
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Hash da nova senha
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Atualizar senha
        await updateRecord('Usuario', req.user.id_usuario, {
            password_hash: newPasswordHash
        });

        // Revogar todos os refresh tokens do usuário
        await updateRecord('RefreshToken', null, { revogado: 1 }, `id_usuario = ${req.user.id_usuario}`);

        // Registrar log
        await registrarLog(req.user.id_usuario, 'PASSWORD_CHANGED', 'Usuario', req.user.id_usuario, req);

        res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso. Faça login novamente.'
        });

    } catch (err) {
        console.error('Erro ao alterar senha:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;