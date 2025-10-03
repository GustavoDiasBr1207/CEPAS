/**
 * cepasService.js
 * Funções para interagir com o Backend (API Node.js/Express).
 * Agora compatível com Docker e com funções CRUD completas.
 */

// Define a URL base para chamadas de API.
// Usa a variável de ambiente REACT_APP_API_BASE_URL (para Docker) ou volta para localhost (desenvolvimento).
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'; 
// Define o nome da tabela que este serviço irá manipular
const TABLE_NAME = 'Familia'; 

// -------------------------------------------------------------------
// 1. FUNÇÃO DE CRIAÇÃO (POST) - Rota: POST /api/dados/Familia
// -------------------------------------------------------------------

/**
 * Envia um novo registro de família para o backend.
 * @param {Object} familiaData - Os dados da família a serem criados.
 * @returns {Object} O objeto de resposta do backend (com o novo ID, por exemplo).
 */
export async function createFamilia(familiaData) {
    const url = `${API_BASE_URL}/dados/${TABLE_NAME}`; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(familiaData),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Erro ${response.status}: ${errorBody.error || 'Falha ao cadastrar a família.'}`);
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
 * Busca todos os registros de famílias no backend.
 * @returns {Array<Object>} Uma lista de objetos de famílias.
 */
export async function getFamilias() {
    const url = `${API_BASE_URL}/dados/${TABLE_NAME}`; 

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao buscar as famílias.`);
        }
        
        return response.json();

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
    // Adiciona o ID ao final da URL
    const url = `${API_BASE_URL}/dados/${TABLE_NAME}/${id}`;

    try {
        const response = await fetch(url, {
            method: 'PUT', // Usamos PUT para atualização completa
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(familiaData),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Erro ${response.status}: ${errorBody.error || 'Falha ao atualizar a família.'}`);
        }

        // Retorna o resultado da operação (pode ser um status OK ou o objeto atualizado)
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
    // Adiciona o ID ao final da URL
    const url = `${API_BASE_URL}/dados/${TABLE_NAME}/${id}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json', // Necessário para alguns servidores
            },
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
