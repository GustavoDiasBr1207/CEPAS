// src/utils/permissions.js
// Utilitários para verificação de permissões de usuários

import { forceAdminAccess, forceAdminRouteAccess, isSuperAdmin } from '../config/adminAccess';

/**
 * Verifica se o usuário tem permissão para realizar uma ação específica
 * @param {Object} user - Objeto do usuário com role e outras informações
 * @param {string} action - Ação que o usuário quer realizar
 * @param {string} resource - Recurso sobre o qual a ação será realizada
 * @returns {boolean} - true se permitido, false caso contrário
 */
export const hasPermission = (user, action, resource = null) => {
    if (!user || !user.role) {
        return false;
    }

    // 🔓 PRIMEIRO: Verifica se é admin com acesso forçado (BYPASS TOTAL)
    if (forceAdminAccess(user, action, resource)) {
        return true;
    }

    const userRole = (user.role || user.tipo_usuario || '').toLowerCase();

    // ADMIN tem poder MÁXIMO - pode fazer TUDO no sistema
    if (userRole === 'admin' || userRole === 'administrador') {
        console.log(`🔓 ADMIN PERMISSION: ${user.nome_usuario || user.email} tem acesso TOTAL como administrador`);
        return true;
    }

    // Define as permissões por role
    const permissions = {
        coordenador: {
            // Coordenador pode fazer quase tudo, exceto gerenciar usuários
            read: ['familias', 'monitores', 'relatorios', 'entrevistas', 'cadastros'],
            write: ['familias', 'monitores', 'entrevistas', 'cadastros'],
            update: ['familias', 'monitores', 'entrevistas', 'cadastros'],
            delete: ['familias', 'monitores', 'entrevistas']
        },
        monitor: {
            // Monitor pode cadastrar e editar famílias, ver listagens
            read: ['familias', 'monitores', 'relatorios'],
            write: ['familias', 'entrevistas'],
            update: ['familias', 'entrevistas'],
            delete: [] // Monitor não pode deletar
        },
        visualizador: {
            // Visualizador só pode ver dados
            read: ['familias', 'monitores', 'relatorios'],
            write: [],
            update: [],
            delete: []
        }
    };

    const userPermissions = permissions[userRole];
    if (!userPermissions) {
        return false;
    }

    // Verifica se o usuário tem permissão para a ação específica
    if (userPermissions[action] && userPermissions[action].includes(resource)) {
        return true;
    }

    return false;
};

/**
 * Verifica se o usuário pode acessar uma rota específica
 * @param {Object} user - Objeto do usuário
 * @param {string} route - Rota que o usuário quer acessar
 * @returns {boolean} - true se permitido, false caso contrário
 */
export const canAccessRoute = (user, route) => {
    if (!user) {
        return false;
    }

    // 🔓 PRIMEIRO: Verifica se é admin com acesso forçado (BYPASS TOTAL)
    if (forceAdminRouteAccess(user, route)) {
        return true;
    }

    const userRole = (user.role || user.tipo_usuario || '').toLowerCase();

    // ADMIN pode acessar TODAS as rotas
    if (userRole === 'admin' || userRole === 'administrador') {
        console.log(`🔓 ADMIN ROUTE: ${user.nome_usuario || user.email} pode acessar QUALQUER rota como administrador`);
        return true;
    }

    // Define as rotas permitidas por role
    const routePermissions = {
        coordenador: [
            '/cadastro-familia',
            '/cadastro-monitor', 
            '/lista-familias',
            '/lista-monitores',
            '/editar-familia',
            '/consulta'
        ],
        monitor: [
            '/cadastro-familia',
            '/lista-familias',
            '/lista-monitores',
            '/editar-familia',
            '/consulta'
        ],
        visualizador: [
            '/lista-familias',
            '/lista-monitores',
            '/consulta'
        ]
    };

    const allowedRoutes = routePermissions[userRole] || [];
    return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
};

/**
 * Retorna uma mensagem de erro personalizada baseada na permissão negada
 * @param {Object} user - Objeto do usuário
 * @param {string} action - Ação negada
 * @param {string} resource - Recurso relacionado
 * @returns {string} - Mensagem de erro
 */
export const getPermissionErrorMessage = (user, action, resource) => {
    const userRole = user?.role || 'usuário não autenticado';
    
    const actionMessages = {
        'delete': `Seu perfil (${userRole}) não tem permissão para deletar ${resource}. Apenas administradores e coordenadores podem realizar esta ação.`,
        'write': `Seu perfil (${userRole}) não tem permissão para criar ${resource}. Contate um administrador.`,
        'update': `Seu perfil (${userRole}) não tem permissão para editar ${resource}. Contate um administrador.`,
        'read': `Seu perfil (${userRole}) não tem permissão para visualizar ${resource}.`
    };

    return actionMessages[action] || `Permissão negada para a ação '${action}' no recurso '${resource}'.`;
};

/**
 * Utilitário para criar componentes protegidos por permissão
 * @param {Function} Component - Componente a ser renderizado
 * @param {string} requiredPermission - Permissão necessária
 * @param {string} resource - Recurso relacionado
 * @returns {Function} - Componente protegido
 */
export const withPermission = (Component, action, resource) => {
    return function ProtectedComponent(props) {
        const user = props.user || (props.auth && props.auth.user);
        
        if (!hasPermission(user, action, resource)) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '8px',
                    color: '#721c24'
                }}>
                    <h3>🚫 Acesso Negado</h3>
                    <p>{getPermissionErrorMessage(user, action, resource)}</p>
                    <p><strong>Seu perfil:</strong> {user?.role || 'Não autenticado'}</p>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

export default {
    hasPermission,
    canAccessRoute,
    getPermissionErrorMessage,
    withPermission
};