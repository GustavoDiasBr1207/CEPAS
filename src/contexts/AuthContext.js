import React, { createContext, useState, useEffect } from 'react';

// Configuração da API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('accessToken'));

    // Configurar interceptador para requests
    const makeAuthenticatedRequest = async (url, options = {}) => {
        const authToken = localStorage.getItem('accessToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        // Se token expirou, tentar renovar
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Tentar novamente com o novo token
                headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
                return fetch(`${API_BASE_URL}${url}`, {
                    ...options,
                    headers,
                });
            } else {
                // Se não conseguiu renovar, fazer logout
                logout();
                throw new Error('Sessão expirada');
            }
        }

        return response;
    };

    // Verificar usuário logado ao carregar a aplicação
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('accessToken');
            
            if (storedToken) {
                try {
                    const response = await makeAuthenticatedRequest('/auth/me');
                    
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
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken && token) {
                await makeAuthenticatedRequest('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken }),
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

    // Verificar se usuário tem permissão
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
        isVisualizador: user?.tipo_usuario === 'visualizador'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};