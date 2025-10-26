const jwt = require('jsonwebtoken');
const { fetchTableData } = require('../oracle');

// Chave secreta para JWT (em produção, mover para variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'CEPAS_SECRET_KEY_2025_SECURE';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acesso requerido'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar se o usuário ainda existe e está ativo
        const usuario = await fetchTableData('Usuario', 
            `SELECT * FROM Usuario WHERE id_usuario = :id AND ativo = 1`, 
            { id: decoded.id_usuario }
        );

        if (!usuario || usuario.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado ou inativo'
            });
        }

        // Verificar se não está bloqueado
        const user = usuario[0];
        if (user.BLOQUEADO_ATE && new Date(user.BLOQUEADO_ATE) > new Date()) {
            return res.status(423).json({
                success: false,
                message: 'Usuário temporariamente bloqueado'
            });
        }

        // Adicionar dados do usuário à requisição
        req.user = {
            id_usuario: user.ID_USUARIO,
            username: user.USERNAME,
            nome_completo: user.NOME_COMPLETO,
            email: user.EMAIL,
            tipo_usuario: user.TIPO_USUARIO,
            ativo: user.ATIVO
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                expired: true
            });
        }
        
        return res.status(403).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

/**
 * Middleware para verificar permissões por tipo de usuário
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        if (!roles.includes(req.user.tipo_usuario)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Permissão insuficiente.'
            });
        }

        next();
    };
};

/**
 * Gerar tokens JWT
 */
const generateTokens = (usuario) => {
    const payload = {
        id_usuario: usuario.ID_USUARIO,
        username: usuario.USERNAME,
        tipo_usuario: usuario.TIPO_USUARIO
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
};

/**
 * Verificar refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = {
    authenticateToken,
    authorize,
    generateTokens,
    verifyRefreshToken,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN
};