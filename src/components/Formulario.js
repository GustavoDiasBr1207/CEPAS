import React, { useState, useEffect } from 'react';
import { validateCompleteForm, formatErrorMessages } from '../utils/validationHelpers';
import './Formulario.css';

function Formulario({ onSave, disabled = false }) {
    // Estado para armazenar os dados do formulário baseado na tabela Familia do Oracle
    const [formData, setFormData] = useState({
        // Dados da família (tabela Familia)
        nome_familia: '',
        migracao: '',
        estado_origem: '',
        cidade_origem: '',
        recebe_beneficio: 0,
        possui_plano_saude: 0,
        convenio: '',
        observacoes: '',
        
        // Dados do endereço (tabela Endereco - 1:1 com Familia)
        endereco: {
            quadra: '',
            rua: '',
            numero_casa: '',
            complemento: '',
            id_area: ''
        },
        
        // Dados de animais (tabela Animal - 1:1 com Familia)
        animal: {
            tem_animal: 0,
            qtd_animais: '',
            qual_animal: ''
        },
        
        // Dados de estrutura da habitação (tabela EstruturaHabitacao - 1:1 com Familia)
        estrutura: {
            tipo_habitacao: '',
            tipo_lote: '',
            situacao_convivencia: '',
            energia_eletrica: 0,
            material_parede: '',
            material_piso: '',
            material_cobertura: '',
            qtd_quartos: '',
            qtd_camas: '',
            tipo_camas: ''
        },
        
        // Dados de saneamento (tabela RecursoSaneamento - 1:1 com Familia)
        saneamento: {
            horta: 0,
            arvore_frutifera: 0,
            como_escoa: '',
            tem_banheiro: 0,
            dest_lixo: '',
            bebe_agua: '',
            trata_agua: ''
        }
    });

    const [areas, setAreas] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Buscar áreas disponíveis para o select
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/dados/Area`);
                if (response.ok) {
                    const areasData = await response.json();
                    setAreas(areasData);
                }
            } catch (error) {
                console.error('Erro ao buscar áreas:', error);
            }
        };
        fetchAreas();
    }, []);

    // Função que atualiza o estado a cada mudança nos campos
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            // Para campos aninhados (endereco.rua, animal.tem_animal, etc.)
            const [section, field] = name.split('.');
            setFormData(prevData => ({
                ...prevData,
                [section]: {
                    ...prevData[section],
                    [field]: type === 'checkbox' ? (checked ? 1 : 0) : 
                            type === 'number' ? (value === '' ? '' : Number(value)) : value
                }
            }));
        } else {
            // Para campos do nível raiz
            setFormData(prevData => ({
                ...prevData,
                [name]: type === 'checkbox' ? (checked ? 1 : 0) : 
                        type === 'number' ? (value === '' ? '' : Number(value)) : value
            }));
        }
    };

    // Função que lida com o envio do formulário
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Limpar erros anteriores
        setValidationErrors([]);
        
        // Validar dados antes do envio
        const validation = validateCompleteForm(formData);
        
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            // Scroll para o topo para mostrar os erros
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        setIsSubmitting(true);
        
        // Estruturar os dados para envio conforme esperado pelo backend
        const dadosParaEnvio = {
            // Dados principais da família
            nome_familia: formData.nome_familia,
            migracao: formData.migracao,
            estado_origem: formData.estado_origem,
            cidade_origem: formData.cidade_origem,
            recebe_beneficio: formData.recebe_beneficio,
            possui_plano_saude: formData.possui_plano_saude,
            convenio: formData.convenio,
            observacoes: formData.observacoes,
            
            // Dados relacionados (serão tratados pelo backend)
            endereco: formData.endereco,
            animal: formData.animal,
            estrutura: formData.estrutura,
            saneamento: formData.saneamento
        };

        onSave(dadosParaEnvio);
        setIsSubmitting(false);
    };

    return (
        <div className="formulario-container">
            <h2>Cadastro Completo de Família</h2>
            
            {/* Exibir erros de validação */}
            {validationErrors.length > 0 && (
                <div className="validation-errors">
                    <h3>⚠️ Corrija os seguintes problemas:</h3>
                    <div className="error-list">
                        {formatErrorMessages(validationErrors)}
                    </div>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="familia-form">
                
                {/* Seção: Dados Básicos da Família */}
                <fieldset className="form-section">
                    <legend>Dados Básicos da Família</legend>
                    
                    <div className="form-group">
                        <label htmlFor="nome_familia">Nome da Família: *</label>
                        <input
                            type="text"
                            id="nome_familia"
                            name="nome_familia"
                            value={formData.nome_familia}
                            onChange={handleChange}
                            required
                            maxLength="150"
                            disabled={disabled || isSubmitting}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="migracao">Migração:</label>
                            <input
                                type="text"
                                id="migracao"
                                name="migracao"
                                value={formData.migracao}
                                onChange={handleChange}
                                maxLength="50"
                                placeholder="Ex: Rural para urbana"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estado_origem">Estado de Origem:</label>
                            <input
                                type="text"
                                id="estado_origem"
                                name="estado_origem"
                                value={formData.estado_origem}
                                onChange={handleChange}
                                maxLength="80"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="cidade_origem">Cidade de Origem:</label>
                            <input
                                type="text"
                                id="cidade_origem"
                                name="cidade_origem"
                                value={formData.cidade_origem}
                                onChange={handleChange}
                                maxLength="80"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="recebe_beneficio"
                                    checked={formData.recebe_beneficio === 1}
                                    onChange={handleChange}
                                />
                                Recebe Benefício Social
                            </label>
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="possui_plano_saude"
                                    checked={formData.possui_plano_saude === 1}
                                    onChange={handleChange}
                                />
                                Possui Plano de Saúde
                            </label>
                        </div>
                    </div>

                    {formData.possui_plano_saude === 1 && (
                        <div className="form-group">
                            <label htmlFor="convenio">Convênio:</label>
                            <input
                                type="text"
                                id="convenio"
                                name="convenio"
                                value={formData.convenio}
                                onChange={handleChange}
                                maxLength="120"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="observacoes">Observações:</label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Observações gerais sobre a família..."
                        />
                    </div>
                </fieldset>

                {/* Seção: Endereço */}
                <fieldset className="form-section">
                    <legend>Endereço</legend>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="endereco.id_area">Área:</label>
                            <select
                                id="endereco.id_area"
                                name="endereco.id_area"
                                value={formData.endereco.id_area}
                                onChange={handleChange}
                            >
                                <option value="">Selecione uma área</option>
                                {areas.map(area => (
                                    <option key={area.ID_AREA} value={area.ID_AREA}>
                                        {area.NOME_AREA}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="endereco.quadra">Quadra:</label>
                            <input
                                type="text"
                                id="endereco.quadra"
                                name="endereco.quadra"
                                value={formData.endereco.quadra}
                                onChange={handleChange}
                                maxLength="30"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="endereco.rua">Rua:</label>
                            <input
                                type="text"
                                id="endereco.rua"
                                name="endereco.rua"
                                value={formData.endereco.rua}
                                onChange={handleChange}
                                maxLength="100"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="endereco.numero_casa">Número da Casa:</label>
                            <input
                                type="text"
                                id="endereco.numero_casa"
                                name="endereco.numero_casa"
                                value={formData.endereco.numero_casa}
                                onChange={handleChange}
                                maxLength="20"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="endereco.complemento">Complemento:</label>
                        <input
                            type="text"
                            id="endereco.complemento"
                            name="endereco.complemento"
                            value={formData.endereco.complemento}
                            onChange={handleChange}
                            maxLength="150"
                            placeholder="Ex: Próximo ao mercado, ao lado da escola..."
                        />
                    </div>
                </fieldset>

                {/* Seção: Animais */}
                <fieldset className="form-section">
                    <legend>Animais</legend>
                    
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="animal.tem_animal"
                                checked={formData.animal.tem_animal === 1}
                                onChange={handleChange}
                            />
                            Possui Animais
                        </label>
                    </div>

                    {formData.animal.tem_animal === 1 && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="animal.qtd_animais">Quantidade de Animais:</label>
                                <input
                                    type="number"
                                    id="animal.qtd_animais"
                                    name="animal.qtd_animais"
                                    value={formData.animal.qtd_animais}
                                    onChange={handleChange}
                                    min="1"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="animal.qual_animal">Tipos de Animais:</label>
                                <input
                                    type="text"
                                    id="animal.qual_animal"
                                    name="animal.qual_animal"
                                    value={formData.animal.qual_animal}
                                    onChange={handleChange}
                                    maxLength="30"
                                    placeholder="Ex: Cães, Gatos, Galinhas..."
                                />
                            </div>
                        </div>
                    )}
                </fieldset>

                {/* Seção: Estrutura da Habitação */}
                <fieldset className="form-section">
                    <legend>Estrutura da Habitação</legend>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="estrutura.tipo_habitacao">Tipo de Habitação:</label>
                            <select
                                id="estrutura.tipo_habitacao"
                                name="estrutura.tipo_habitacao"
                                value={formData.estrutura.tipo_habitacao}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Casa">Casa</option>
                                <option value="Apartamento">Apartamento</option>
                                <option value="Barraco">Barraco</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.tipo_lote">Tipo de Lote:</label>
                            <select
                                id="estrutura.tipo_lote"
                                name="estrutura.tipo_lote"
                                value={formData.estrutura.tipo_lote}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Próprio">Próprio</option>
                                <option value="Alugado">Alugado</option>
                                <option value="Cedido">Cedido</option>
                                <option value="Financiado">Financiado</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.situacao_convivencia">Situação de Convivência:</label>
                            <select
                                id="estrutura.situacao_convivencia"
                                name="estrutura.situacao_convivencia"
                                value={formData.estrutura.situacao_convivencia}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Somente a família">Somente a família</option>
                                <option value="Com outras famílias">Com outras famílias</option>
                                <option value="Com parentes">Com parentes</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="estrutura.energia_eletrica"
                                checked={formData.estrutura.energia_eletrica === 1}
                                onChange={handleChange}
                            />
                            Possui Energia Elétrica
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="estrutura.material_parede">Material da Parede:</label>
                            <select
                                id="estrutura.material_parede"
                                name="estrutura.material_parede"
                                value={formData.estrutura.material_parede}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Tijolo">Tijolo</option>
                                <option value="Adobe">Adobe</option>
                                <option value="Madeira">Madeira</option>
                                <option value="Lona">Lona</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.material_piso">Material do Piso:</label>
                            <select
                                id="estrutura.material_piso"
                                name="estrutura.material_piso"
                                value={formData.estrutura.material_piso}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Cimento">Cimento</option>
                                <option value="Cerâmica">Cerâmica</option>
                                <option value="Terra batida">Terra batida</option>
                                <option value="Madeira">Madeira</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.material_cobertura">Material da Cobertura:</label>
                            <select
                                id="estrutura.material_cobertura"
                                name="estrutura.material_cobertura"
                                value={formData.estrutura.material_cobertura}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Telha">Telha</option>
                                <option value="Laje">Laje</option>
                                <option value="Zinco">Zinco</option>
                                <option value="Lona">Lona</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="estrutura.qtd_quartos">Quantidade de Quartos:</label>
                            <input
                                type="number"
                                id="estrutura.qtd_quartos"
                                name="estrutura.qtd_quartos"
                                value={formData.estrutura.qtd_quartos}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.qtd_camas">Quantidade de Camas:</label>
                            <input
                                type="number"
                                id="estrutura.qtd_camas"
                                name="estrutura.qtd_camas"
                                value={formData.estrutura.qtd_camas}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estrutura.tipo_camas">Tipo de Camas:</label>
                            <input
                                type="text"
                                id="estrutura.tipo_camas"
                                name="estrutura.tipo_camas"
                                value={formData.estrutura.tipo_camas}
                                onChange={handleChange}
                                maxLength="100"
                                placeholder="Ex: Beliche, Solteiro, Casal..."
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Seção: Saneamento */}
                <fieldset className="form-section">
                    <legend>Recursos de Saneamento</legend>
                    
                    <div className="form-row">
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="saneamento.horta"
                                    checked={formData.saneamento.horta === 1}
                                    onChange={handleChange}
                                />
                                Possui Horta
                            </label>
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="saneamento.arvore_frutifera"
                                    checked={formData.saneamento.arvore_frutifera === 1}
                                    onChange={handleChange}
                                />
                                Possui Árvore Frutífera
                            </label>
                        </div>
                        
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="saneamento.tem_banheiro"
                                    checked={formData.saneamento.tem_banheiro === 1}
                                    onChange={handleChange}
                                />
                                Possui Banheiro
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="saneamento.como_escoa">Como Escoa a Água:</label>
                            <select
                                id="saneamento.como_escoa"
                                name="saneamento.como_escoa"
                                value={formData.saneamento.como_escoa}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Rede de esgoto">Rede de esgoto</option>
                                <option value="Fossa séptica">Fossa séptica</option>
                                <option value="Fossa rudimentar">Fossa rudimentar</option>
                                <option value="Céu aberto">Céu aberto</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="saneamento.dest_lixo">Destino do Lixo:</label>
                            <select
                                id="saneamento.dest_lixo"
                                name="saneamento.dest_lixo"
                                value={formData.saneamento.dest_lixo}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Coleta pública">Coleta pública</option>
                                <option value="Céu aberto">Céu aberto</option>
                                <option value="Enterra">Enterra</option>
                                <option value="Queima">Queima</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="saneamento.bebe_agua">Como Bebe a Água:</label>
                            <select
                                id="saneamento.bebe_agua"
                                name="saneamento.bebe_agua"
                                value={formData.saneamento.bebe_agua}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Filtrada">Filtrada</option>
                                <option value="Fervida">Fervida</option>
                                <option value="Tratada">Tratada</option>
                                <option value="Sem tratamento">Sem tratamento</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="saneamento.trata_agua">Origem da Água:</label>
                            <select
                                id="saneamento.trata_agua"
                                name="saneamento.trata_agua"
                                value={formData.saneamento.trata_agua}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                <option value="Fervida">Rede pública</option>
                                <option value="Coleta">Coleta de chuva</option>
                                <option value="Cisterna">Cisterna</option>
                                <option value="Poço">Poço</option>
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* Botão de Envio */}
                <div className="form-actions">
                    <button 
                        type="submit" 
                        className="btn-submit"
                        disabled={disabled || isSubmitting}
                    >
                        {isSubmitting ? 'Salvando...' : 'Salvar Cadastro Completo'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Formulario;