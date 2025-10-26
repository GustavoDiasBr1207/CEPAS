// src/config/adminAccess.js
// Configuração especial para garantir acesso total de administradores

/**
 * Configuração de acesso administrativo
 * ADMINS têm poder MÁXIMO e podem fazer TUDO no sistema
 */
export const ADMIN_ACCESS_CONFIG = {
    // Lista de usuários que sempre têm acesso total (além dos admins)
    SUPER_USERS: [
        'admin', 
        'administrador',
        'root',
        'super_admin'
    ],
    
    // Rotas que SEMPRE estão disponíveis para admins
    ADMIN_ALWAYS_ALLOWED_ROUTES: [
        '/cadastro-familia',
        '/cadastro-monitor',
        '/lista-familias', 
        '/lista-monitores',
        '/editar-familia',
        '/consulta',
        '/consulta-geral',
        '/admin',
        '/configuracoes',
        '/usuarios',
        '/relatorios'
    ],

    // Ações que admins SEMPRE podem fazer
    ADMIN_ALWAYS_ALLOWED_ACTIONS: [
        'read',
        'write', 
        'update',
        'delete',
        'create',
        'manage',
        'configure',
        'admin'
    ],

    // Recursos que admins SEMPRE podem gerenciar
    ADMIN_ALWAYS_ALLOWED_RESOURCES: [
        'familias',
        'monitores', 
        'usuarios',
        'entrevistas',
        'cadastros',
        'relatorios',
        'configuracoes',
        'sistema',
        'dados'
    ]
};

/**
 * Verifica se um usuário é um super admin com acesso total
 * @param {Object} user - Dados do usuário
 * @returns {boolean} - true se é super admin
 */
export const isSuperAdmin = (user) => {
    if (!user) return false;
    
    // Verifica por role
    const role = (user.role || user.tipo_usuario || '').toLowerCase();
    if (role === 'admin' || role === 'administrador') {
        return true;
    }
    
    // Verifica por username específico
    const username = (user.username || user.nome_usuario || user.email || '').toLowerCase();
    return ADMIN_ACCESS_CONFIG.SUPER_USERS.some(superUser => 
        username.includes(superUser.toLowerCase())
    );
};

/**
 * Força o acesso para administradores - BYPASS completo de permissões
 * @param {Object} user - Dados do usuário
 * @param {string} action - Ação desejada
 * @param {string} resource - Recurso alvo
 * @returns {boolean} - true se deve permitir acesso
 */
export const forceAdminAccess = (user, action, resource) => {
    // Se é super admin, SEMPRE permite
    if (isSuperAdmin(user)) {
        console.log(`🔓 ADMIN ACCESS: Usuário ${user.nome_usuario || user.email} tem acesso TOTAL como administrador`);
        return true;
    }
    
    return false;
};

/**
 * Verifica se uma rota é sempre permitida para admins
 * @param {Object} user - Dados do usuário  
 * @param {string} route - Rota desejada
 * @returns {boolean} - true se deve permitir
 */
export const forceAdminRouteAccess = (user, route) => {
    if (isSuperAdmin(user)) {
        // Admin pode acessar QUALQUER rota
        console.log(`🔓 ADMIN ROUTE ACCESS: Administrador ${user.nome_usuario || user.email} pode acessar rota: ${route}`);
        return true;
    }
    
    return false;
};

/**
 * Middleware de autenticação que garante acesso administrativo
 * @param {Object} user - Dados do usuário
 * @param {string} action - Ação tentada  
 * @param {string} resource - Recurso alvo
 * @param {Function} normalCheck - Função de verificação normal de permissão
 * @returns {boolean} - Resultado final da verificação
 */
export const checkAccessWithAdminOverride = (user, action, resource, normalCheck) => {
    // PRIMEIRO: Verifica se é admin com acesso forçado
    if (forceAdminAccess(user, action, resource)) {
        return true;
    }
    
    // SEGUNDO: Se não é admin, usa verificação normal
    return normalCheck ? normalCheck() : false;
};

/**
 * Helper para exibir mensagens de acesso administrativo
 * @param {Object} user - Dados do usuário
 * @returns {string} - Mensagem apropriada
 */
export const getAdminAccessMessage = (user) => {
    if (isSuperAdmin(user)) {
        return `✅ Acesso TOTAL de Administrador confirmado para: ${user.nome_usuario || user.email}`;
    }
    
    const role = user?.role || user?.tipo_usuario || 'Usuário';
    return `ℹ️ Acesso baseado no perfil: ${role}`;
};

export default {
    ADMIN_ACCESS_CONFIG,
    isSuperAdmin,
    forceAdminAccess,
    forceAdminRouteAccess,
    checkAccessWithAdminOverride,
    getAdminAccessMessage
};