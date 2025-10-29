import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasPermission as systemHasPermission, canAccessRoute, getPermissionErrorMessage } from '../utils/permissions';
import { API_BASE_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('accessToken'));

    // Configurar interceptador para requests (retorna JSON quando disponível; caso contrário, texto)
    const makeAuthenticatedRequest = async (url, options = {}) => {
        const authToken = localStorage.getItem('accessToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        } else {
            throw new Error('Token de acesso requerido');
        }

        let response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        // Se token expirou, tentar renovar
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Tentar novamente com o novo token
                const newToken = localStorage.getItem('accessToken');
                headers.Authorization = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    ...options,
                    headers,
                });
                
                if (!retryResponse.ok) {
                    // tentar extrair mensagem de erro do corpo
                    const ct = retryResponse.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const errBody = await retryResponse.json().catch(() => ({}));
                        throw new Error(errBody.message || `Erro ${retryResponse.status}: ${retryResponse.statusText}`);
                    } else {
                        const errText = await retryResponse.text().catch(() => '');
                        throw new Error(errText || `Erro ${retryResponse.status}: ${retryResponse.statusText}`);
                    }
                }
                
                const ct = retryResponse.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    return await retryResponse.json();
                }
                const text = await retryResponse.text();
                return { message: text };
            } else {
                // Se não conseguiu renovar, fazer logout
                logout();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }

        if (!response.ok) {
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody.message || `Erro ${response.status}: ${response.statusText}`);
            } else {
                const errText = await response.text().catch(() => '');
                throw new Error(errText || `Erro ${response.status}: ${response.statusText}`);
            }
        }

        // OK: retornar JSON quando possível; senão, texto
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        const text = await response.text();
        return { message: text };
    };

    // Verificar usuário logado ao carregar a aplicação
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('accessToken');
            
            if (storedToken) {
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setUser(data.user);
                        setToken(storedToken);
                    } else {
                        // Token inválido, remover
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                    }
                } catch (error) {
                    console.error('Erro ao verificar autenticação:', error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            }
            
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Função de login
    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login');
            }

            // Armazenar tokens
            localStorage.setItem('accessToken', data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
            
            setUser(data.user);
            setToken(data.tokens.accessToken);

            return data;
        } catch (error) {
            throw error;
        }
    };

    // Função de logout
    const logout = async () => {
        try {
            const refreshTokenValue = localStorage.getItem('refreshToken');
            const accessToken = localStorage.getItem('accessToken');
            
            if (refreshTokenValue && accessToken) {
                // Fazer logout no servidor sem usar makeAuthenticatedRequest para evitar loop
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ refreshToken: refreshTokenValue }),
                });
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            // Limpar dados locais independentemente do resultado
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setToken(null);
        }
    };

    // Função para renovar token
    const refreshToken = async () => {
        try {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            
            if (!storedRefreshToken) {
                return false;
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
                setToken(data.tokens.accessToken);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            return false;
        }
    };

    // Verificar se usuário tem permissão por roles simples
    const hasPermission = (requiredRoles) => {
        if (!user) return false;
        
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.tipo_usuario);
        }
        
        return user.tipo_usuario === requiredRoles;
    };

    const value = {
        user,
        token,
        isLoading,
        login,
        logout,
        makeAuthenticatedRequest,
        hasPermission,
        isAuthenticated: !!user,
        isAdmin: user?.tipo_usuario === 'admin',
        isCoordenador: user?.tipo_usuario === 'coordenador',
        isMonitor: user?.tipo_usuario === 'monitor',
        isVisualizador: user?.tipo_usuario === 'visualizador',
        // Novos utilitários de permissão usando o sistema atualizado
    // Permissões de sistema baseadas em regras externas
    hasSystemPermission: (action, resource) => systemHasPermission(user, action, resource),
    canAccessRoute: (route) => canAccessRoute(user, route),
    getPermissionErrorMessage: (action, resource) => getPermissionErrorMessage(user, action, resource),
        // Helper para verificar se é admin com poder máximo
        isMaxAdmin: () => user?.tipo_usuario === 'admin' || user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};