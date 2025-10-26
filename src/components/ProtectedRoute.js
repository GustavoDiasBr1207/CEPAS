import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRoles = null, fallback = null }) => {
    const { isAuthenticated, hasPermission, isLoading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div>Carregando...</div>
            </div>
        );
    }

    // Se não está autenticado, não renderizar nada (será redirecionado)
    if (!isAuthenticated) {
        return null;
    }

    // Se requer roles específicos, verificar permissão
    if (requiredRoles && !hasPermission(requiredRoles)) {
        return fallback || (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#d33' 
            }}>
                <h3>Acesso Negado</h3>
                <p>Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;