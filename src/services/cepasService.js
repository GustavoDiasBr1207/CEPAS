/**
 * cepasService.js
 * Funções para interagir com o Backend (API Node.js/Express) com autenticação.
 * Agora compatível com Docker e com funções CRUD completas.
 */

import { API_BASE_URL } from '../config/api';
// Define o nome da tabela que este serviço irá manipular
const TABLE_NAME = 'Familia'; 

// Função auxiliar para obter headers autenticados
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Função auxiliar para fazer requests autenticados com renovação automática de token
const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };

    let response = await fetch(url, { ...options, headers });

    // Se token expirou, tentar renovar
    if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('accessToken', data.tokens.accessToken);
                    localStorage.setItem('refreshToken', data.tokens.refreshToken);
                    
                    // Tentar novamente com o novo token
                    headers.Authorization = `Bearer ${data.tokens.accessToken}`;
                    response = await fetch(url, { ...options, headers });
                } else {
                    // Se não conseguiu renovar, redirecionar para login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.reload();
                    throw new Error('Sessão expirada');
                }
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.reload();
                throw new Error('Sessão expirada');
            }
        } else {
            throw new Error('Não autorizado');
        }
    }

    return response;
}; 

// -------------------------------------------------------------------
// 1. FUNÇÃO DE CRIAÇÃO (POST) - Rota: POST /api/dados/Familia
// -------------------------------------------------------------------

/**
 * Envia um novo registro de família completo para o backend.
 * Inclui família, endereço, animal, estrutura e saneamento.
 * @param {Object} familiaData - Os dados completos da família a serem criados.
 * @returns {Object} O objeto de resposta do backend (com o novo ID, por exemplo).
 */
export async function createFamilia(familiaData) {
    const url = `${API_BASE_URL}/familia-completa`; // Nova rota específica

    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'POST',
            body: JSON.stringify(familiaData),
        });

        if (!response.ok) {
            let errorMessage = 'Falha ao cadastrar a família.';
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorBody.error || errorMessage;
            } catch (e) {
                // Se não conseguir fazer parse do JSON, usa o texto da resposta
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(`Erro ${response.status}: ${errorMessage}`);
        }

        return response.json();

    } catch (error) {
        console.error('Erro no serviço createFamilia:', error);
        throw error;
    }
}


// -------------------------------------------------------------------
// 2. FUNÇÃO DE CONSULTA (GET) - Rota: GET /api/dados/Familia
// -------------------------------------------------------------------

/**
 * Busca todos os registros de famílias no backend usando o endpoint otimizado.
 * @returns {Array<Object>} Uma lista de objetos de famílias.
 */
export async function getFamilias() {
    const url = `${API_BASE_URL}/familias`; // Novo endpoint otimizado

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            let errorMessage = 'Falha ao buscar as famílias.';
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorBody.error || errorMessage;
            } catch (e) {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(`Erro ${response.status}: ${errorMessage}`);
        }
        
        const result = await response.json();
        return result.data || []; // Retorna o array de dados

    } catch (error) {
        console.error('Erro no serviço getFamilias:', error);
        throw error;
    }
}

// -------------------------------------------------------------------
// 3. FUNÇÃO DE ATUALIZAÇÃO (PUT) - Rota: PUT /api/dados/Familia/:id
// -------------------------------------------------------------------

/**
 * Atualiza um registro de família existente.
 * @param {string | number} id - O ID da família a ser atualizada.
 * @param {Object} familiaData - Os dados da família a serem atualizados.
 * @returns {Object} O objeto de resposta do backend.
 */
export async function updateFamilia(id, familiaData) {
    // Usa a nova rota de família completa para atualização
    const url = `${API_BASE_URL}/familia/${id}`;

    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'PUT',
            body: JSON.stringify(familiaData),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Erro ${response.status}: ${errorBody.error || 'Falha ao atualizar a família.'}`);
        }

        return response.json();

    } catch (error) {
        console.error('Erro no serviço updateFamilia:', error);
        throw error;
    }
}

// -------------------------------------------------------------------
// 4. FUNÇÃO DE EXCLUSÃO (DELETE) - Rota: DELETE /api/dados/Familia/:id
// -------------------------------------------------------------------

/**
 * Exclui um registro de família.
 * @param {string | number} id - O ID da família a ser excluída.
 * @returns {Object} O objeto de resposta do backend (geralmente um status de sucesso).
 */
export async function deleteFamilia(id) {
    // Usa a nova rota de família completa para exclusão
    const url = `${API_BASE_URL}/familia/${id}`;

    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'DELETE'
        });

        // O backend pode não retornar corpo para DELETE, apenas verificamos o status.
        if (!response.ok) {
            // Tenta obter o corpo, se houver
            const errorBody = await response.json().catch(() => ({ error: 'Nenhuma resposta detalhada.' }));
            throw new Error(`Erro ${response.status}: ${errorBody.error || 'Falha ao excluir a família.'}`);
        }

        // Se a exclusão for bem-sucedida (ex: 200, 204), retornamos sucesso.
        return { success: true, message: `Família com ID ${id} excluída com sucesso.` };

    } catch (error) {
        console.error('Erro no serviço deleteFamilia:', error);
        throw error;
    }
}

// -------------------------------------------------------------------
// Serviços para Monitor
// -------------------------------------------------------------------

/**
 * Cria um novo monitor (POST /api/dados/Monitor)
 * @param {Object} monitorData - { nome, telefone, email, observacao }
 */
export async function createMonitor(monitorData) {
    const url = `${API_BASE_URL}/dados/Monitor`;
    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'POST',
            body: JSON.stringify(monitorData)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Erro desconhecido');
            throw new Error(`Erro ${response.status}: ${errorBody}`);
        }

        return response.json();
    } catch (error) {
        console.error('Erro no serviço createMonitor:', error);
        throw error;
    }
}

/**
 * Busca monitores (GET /api/dados/Monitor)
 */
export async function getMonitors() {
    const url = `${API_BASE_URL}/dados/Monitor`;
    try {
        const response = await fetch(url, { 
            method: 'GET', 
            headers: getAuthHeaders() 
        });
        
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Erro desconhecido');
            throw new Error(`Erro ${response.status}: ${errorBody}`);
        }
        return response.json();
    } catch (error) {
        console.error('Erro no serviço getMonitors:', error);
        throw error;
    }
}

/**
 * Atualiza monitor (PUT /api/dados/Monitor/:id)
 */
export async function updateMonitor(id, monitorData) {
    const url = `${API_BASE_URL}/dados/Monitor/${id}`;
    try {
        const response = await makeAuthenticatedRequest(url, {
            method: 'PUT',
            body: JSON.stringify(monitorData)
        });
        
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Erro desconhecido');
            throw new Error(`Erro ${response.status}: ${errorBody}`);
        }
        return response.json();
    } catch (error) {
        console.error('Erro no serviço updateMonitor:', error);
        throw error;
    }
}

/**
 * Deleta monitor (DELETE /api/dados/Monitor/:id)
 */
export async function deleteMonitor(id) {
    const url = `${API_BASE_URL}/dados/Monitor/${id}`;
    try {
        const response = await makeAuthenticatedRequest(url, { 
            method: 'DELETE' 
        });
        
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Erro desconhecido');
            throw new Error(`Erro ${response.status}: ${errorBody}`);
        }
        return { success: true };
    } catch (error) {
        console.error('Erro no serviço deleteMonitor:', error);
        throw error;
    }
}

/**
 * Busca dados completos de uma família para edição
 * @param {string|number} id - ID da família
 * @returns {Object} Dados completos da família
 */
export async function getFamiliaCompleta(id) {
    const url = `${API_BASE_URL}/familia/${id}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(`Erro ${response.status}: ${errorBody.message}`);
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Erro no serviço getFamiliaCompleta:', error);
        throw error;
    }
}
