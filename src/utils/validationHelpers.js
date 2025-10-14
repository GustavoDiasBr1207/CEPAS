/**
 * validationHelpers.js
 * Funções auxiliares para validação de dados do formulário de família
 */

/**
 * Valida os dados básicos da família
 * @param {Object} familiaData - Dados da família
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateFamiliaData(familiaData) {
    const errors = [];

    // Validações obrigatórias
    if (!familiaData.nome_familia || familiaData.nome_familia.trim() === '') {
        errors.push('Nome da família é obrigatório');
    }

    if (familiaData.nome_familia && familiaData.nome_familia.length > 150) {
        errors.push('Nome da família deve ter no máximo 150 caracteres');
    }

    // Validações opcionais com limite de caracteres
    if (familiaData.migracao && familiaData.migracao.length > 50) {
        errors.push('Campo migração deve ter no máximo 50 caracteres');
    }

    if (familiaData.estado_origem && familiaData.estado_origem.length > 80) {
        errors.push('Estado de origem deve ter no máximo 80 caracteres');
    }

    if (familiaData.cidade_origem && familiaData.cidade_origem.length > 80) {
        errors.push('Cidade de origem deve ter no máximo 80 caracteres');
    }

    if (familiaData.convenio && familiaData.convenio.length > 120) {
        errors.push('Nome do convênio deve ter no máximo 120 caracteres');
    }

    // Validação de campos numéricos (0 ou 1)
    if (![0, 1].includes(familiaData.recebe_beneficio)) {
        errors.push('Campo "Recebe Benefício" deve ser 0 ou 1');
    }

    if (![0, 1].includes(familiaData.possui_plano_saude)) {
        errors.push('Campo "Possui Plano de Saúde" deve ser 0 ou 1');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida os dados do endereço
 * @param {Object} enderecoData - Dados do endereço
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateEnderecoData(enderecoData) {
    const errors = [];

    if (enderecoData.quadra && enderecoData.quadra.length > 30) {
        errors.push('Quadra deve ter no máximo 30 caracteres');
    }

    if (enderecoData.rua && enderecoData.rua.length > 100) {
        errors.push('Rua deve ter no máximo 100 caracteres');
    }

    if (enderecoData.numero_casa && enderecoData.numero_casa.length > 20) {
        errors.push('Número da casa deve ter no máximo 20 caracteres');
    }

    if (enderecoData.complemento && enderecoData.complemento.length > 150) {
        errors.push('Complemento deve ter no máximo 150 caracteres');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida os dados dos animais
 * @param {Object} animalData - Dados dos animais
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateAnimalData(animalData) {
    const errors = [];

    if (![0, 1].includes(animalData.tem_animal)) {
        errors.push('Campo "Possui Animais" deve ser 0 ou 1');
    }

    if (animalData.tem_animal === 1) {
        if (!animalData.qtd_animais || animalData.qtd_animais < 1) {
            errors.push('Quantidade de animais deve ser informada quando possui animais');
        }

        if (!animalData.qual_animal || animalData.qual_animal.trim() === '') {
            errors.push('Tipo de animais deve ser informado quando possui animais');
        }
    }

    if (animalData.qual_animal && animalData.qual_animal.length > 30) {
        errors.push('Tipo de animais deve ter no máximo 30 caracteres');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida os dados da estrutura da habitação
 * @param {Object} estruturaData - Dados da estrutura
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateEstruturaData(estruturaData) {
    const errors = [];

    const tiposHabitacao = ['Casa', 'Apartamento', 'Barraco', 'Outro'];
    const tiposLote = ['Próprio', 'Alugado', 'Cedido', 'Financiado'];
    const situacoesConvivencia = ['Somente a família', 'Com outras famílias', 'Com parentes'];
    const materiaisParede = ['Tijolo', 'Adobe', 'Madeira', 'Lona', 'Outro'];
    const materiaisPiso = ['Cimento', 'Cerâmica', 'Terra batida', 'Madeira', 'Outro'];
    const materiaisCobertura = ['Telha', 'Laje', 'Zinco', 'Lona', 'Outro'];

    if (estruturaData.tipo_habitacao && !tiposHabitacao.includes(estruturaData.tipo_habitacao)) {
        errors.push('Tipo de habitação inválido');
    }

    if (estruturaData.tipo_lote && !tiposLote.includes(estruturaData.tipo_lote)) {
        errors.push('Tipo de lote inválido');
    }

    if (estruturaData.situacao_convivencia && !situacoesConvivencia.includes(estruturaData.situacao_convivencia)) {
        errors.push('Situação de convivência inválida');
    }

    if (estruturaData.material_parede && !materiaisParede.includes(estruturaData.material_parede)) {
        errors.push('Material da parede inválido');
    }

    if (estruturaData.material_piso && !materiaisPiso.includes(estruturaData.material_piso)) {
        errors.push('Material do piso inválido');
    }

    if (estruturaData.material_cobertura && !materiaisCobertura.includes(estruturaData.material_cobertura)) {
        errors.push('Material da cobertura inválido');
    }

    if (![0, 1].includes(estruturaData.energia_eletrica)) {
        errors.push('Campo "Energia Elétrica" deve ser 0 ou 1');
    }

    if (estruturaData.qtd_quartos && estruturaData.qtd_quartos < 0) {
        errors.push('Quantidade de quartos não pode ser negativa');
    }

    if (estruturaData.qtd_camas && estruturaData.qtd_camas < 0) {
        errors.push('Quantidade de camas não pode ser negativa');
    }

    if (estruturaData.tipo_camas && estruturaData.tipo_camas.length > 100) {
        errors.push('Tipo de camas deve ter no máximo 100 caracteres');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida os dados de saneamento
 * @param {Object} saneamentoData - Dados de saneamento
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateSaneamentoData(saneamentoData) {
    const errors = [];

    const destinosLixo = ['Coleta pública', 'Céu aberto', 'Enterra', 'Queima'];
    const tiposBebeAgua = ['Filtrada', 'Fervida', 'Tratada', 'Sem tratamento'];
    const oriensAgua = ['Fervida', 'Coleta', 'Cisterna', 'Poço'];

    if (![0, 1].includes(saneamentoData.horta)) {
        errors.push('Campo "Horta" deve ser 0 ou 1');
    }

    if (![0, 1].includes(saneamentoData.arvore_frutifera)) {
        errors.push('Campo "Árvore Frutífera" deve ser 0 ou 1');
    }

    if (![0, 1].includes(saneamentoData.tem_banheiro)) {
        errors.push('Campo "Tem Banheiro" deve ser 0 ou 1');
    }

    if (saneamentoData.dest_lixo && !destinosLixo.includes(saneamentoData.dest_lixo)) {
        errors.push('Destino do lixo inválido');
    }

    if (saneamentoData.bebe_agua && !tiposBebeAgua.includes(saneamentoData.bebe_agua)) {
        errors.push('Tipo de água para beber inválido');
    }

    if (saneamentoData.trata_agua && !oriensAgua.includes(saneamentoData.trata_agua)) {
        errors.push('Origem da água inválida');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida todos os dados do formulário completo
 * @param {Object} formData - Dados completos do formulário
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateCompleteForm(formData) {
    const allErrors = [];

    // Valida dados da família
    const familiaValidation = validateFamiliaData(formData);
    allErrors.push(...familiaValidation.errors);

    // Valida endereço se fornecido
    if (formData.endereco && Object.keys(formData.endereco).some(key => formData.endereco[key])) {
        const enderecoValidation = validateEnderecoData(formData.endereco);
        allErrors.push(...enderecoValidation.errors);
    }

    // Valida dados de animais
    if (formData.animal) {
        const animalValidation = validateAnimalData(formData.animal);
        allErrors.push(...animalValidation.errors);
    }

    // Valida estrutura se fornecida
    if (formData.estrutura && Object.keys(formData.estrutura).some(key => formData.estrutura[key] !== '' && formData.estrutura[key] !== null)) {
        const estruturaValidation = validateEstruturaData(formData.estrutura);
        allErrors.push(...estruturaValidation.errors);
    }

    // Valida saneamento se fornecido
    if (formData.saneamento && Object.keys(formData.saneamento).some(key => formData.saneamento[key] !== '' && formData.saneamento[key] !== null)) {
        const saneamentoValidation = validateSaneamentoData(formData.saneamento);
        allErrors.push(...saneamentoValidation.errors);
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Formata mensagens de erro para exibição
 * @param {string[]} errors - Array de erros
 * @returns {string} Mensagem formatada
 */
export function formatErrorMessages(errors) {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
        return errors[0];
    }
    
    return `Foram encontrados ${errors.length} problemas:\n• ${errors.join('\n• ')}`;
}