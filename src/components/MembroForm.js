import React, { useState } from 'react';
import './MembroForm.css';

const MembroForm = ({ membro, onSave, onCancel, onDelete, isEditing = false }) => {
    const [formData, setFormData] = useState({
        nome: membro?.nome || '',
        data_nascimento: membro?.data_nascimento || '',
        relacao: membro?.relacao || '',
        ocupacao: membro?.ocupacao || '',
        sexo: membro?.sexo || '',
        cor: membro?.cor || '',
        estado_civil: membro?.estado_civil || '',
        alfabetizado: membro?.alfabetizado || 0,
        religiao: membro?.religiao || '',
        
        // Dados de saúde
        saude: {
            hipertensao: membro?.saude?.hipertensao || 0,
            diabetes: membro?.saude?.diabetes || 0,
            tabagismo: membro?.saude?.tabagismo || 0,
            etilismo: membro?.saude?.etilismo || 0,
            sedentarismo: membro?.saude?.sedentarismo || 0,
            hospitalizacao: membro?.saude?.hospitalizacao || 0,
            vacinacao_em_dia: membro?.saude?.vacinacao_em_dia || 0,
            cirurgias: membro?.saude?.cirurgias || 0,
            obesidade: membro?.saude?.obesidade || 0,
            gestante: membro?.saude?.gestante || 0,
            outras_condicoes: membro?.saude?.outras_condicoes || ''
        },
        
        // Dados de criança CEPAS (se aplicável)
        crianca_cepas: {
            ativa: membro?.crianca_cepas?.ativa || false,
            data_inicio: membro?.crianca_cepas?.data_inicio || '',
            data_fim: membro?.crianca_cepas?.data_fim || '',
            turno: membro?.crianca_cepas?.turno || '',
            atividade: membro?.crianca_cepas?.atividade || '',
            observacoes: membro?.crianca_cepas?.observacoes || ''
        }
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: type === 'checkbox' ? (checked ? 1 : 0) : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validações básicas
        if (!formData.nome.trim()) {
            alert('Nome é obrigatório');
            return;
        }
        
        onSave({
            ...formData,
            id_membro: membro?.id_membro || null
        });
    };

    const calcularIdade = (dataNascimento) => {
        if (!dataNascimento) return '';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            return idade - 1;
        }
        return idade;
    };

    return (
        <div className="membro-form-container">
            <form onSubmit={handleSubmit} className="membro-form">
                <div className="form-header">
                    <h3>{isEditing ? 'Editar Membro' : 'Novo Membro da Família'}</h3>
                    {isEditing && membro?.id_membro && (
                        <span className="member-id">ID: {membro.id_membro}</span>
                    )}
                </div>

                {/* Dados Básicos */}
                <fieldset className="form-section">
                    <legend>Dados Básicos</legend>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="nome">Nome Completo: *</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                                maxLength="150"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="data_nascimento">Data de Nascimento:</label>
                            <input
                                type="date"
                                id="data_nascimento"
                                name="data_nascimento"
                                value={formData.data_nascimento}
                                onChange={handleChange}
                            />
                            {formData.data_nascimento && (
                                <small>Idade: {calcularIdade(formData.data_nascimento)} anos</small>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="relacao">Relação com a Família:</label>
                            <select
                                id="relacao"
                                name="relacao"
                                value={formData.relacao}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                <option value="Responsável">Responsável</option>
                                <option value="Cônjuge">Cônjuge</option>
                                <option value="Filho(a)">Filho(a)</option>
                                <option value="Pai">Pai</option>
                                <option value="Mãe">Mãe</option>
                                <option value="Avô/Avó">Avô/Avó</option>
                                <option value="Irmão/Irmã">Irmão/Irmã</option>
                                <option value="Tio/Tia">Tio/Tia</option>
                                <option value="Primo/Prima">Primo/Prima</option>
                                <option value="Sogro/Sogra">Sogro/Sogra</option>
                                <option value="Genro/Nora">Genro/Nora</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="sexo">Sexo:</label>
                            <select
                                id="sexo"
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                <option value="MASCULINO">Masculino</option>
                                <option value="FEMININO">Feminino</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cor">Cor/Raça:</label>
                            <select
                                id="cor"
                                name="cor"
                                value={formData.cor}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                <option value="Branca">Branca</option>
                                <option value="Preta">Preta</option>
                                <option value="Parda">Parda</option>
                                <option value="Amarela">Amarela</option>
                                <option value="Indígena">Indígena</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="estado_civil">Estado Civil:</label>
                            <select
                                id="estado_civil"
                                name="estado_civil"
                                value={formData.estado_civil}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="União Estável">União Estável</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viúvo(a)">Viúvo(a)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ocupacao">Ocupação:</label>
                            <input
                                type="text"
                                id="ocupacao"
                                name="ocupacao"
                                value={formData.ocupacao}
                                onChange={handleChange}
                                maxLength="120"
                                placeholder="Ex: Estudante, Aposentado, Doméstica..."
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="religiao">Religião:</label>
                            <input
                                type="text"
                                id="religiao"
                                name="religiao"
                                value={formData.religiao}
                                onChange={handleChange}
                                maxLength="80"
                            />
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="alfabetizado"
                                checked={formData.alfabetizado === 1}
                                onChange={handleChange}
                            />
                            Alfabetizado
                        </label>
                    </div>
                </fieldset>

                {/* Dados de Saúde */}
                <fieldset className="form-section">
                    <legend>Dados de Saúde</legend>
                    
                    <div className="checkbox-grid">
                        <label>
                            <input
                                type="checkbox"
                                name="saude.hipertensao"
                                checked={formData.saude.hipertensao === 1}
                                onChange={handleChange}
                            />
                            Hipertensão
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.diabetes"
                                checked={formData.saude.diabetes === 1}
                                onChange={handleChange}
                            />
                            Diabetes
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.tabagismo"
                                checked={formData.saude.tabagismo === 1}
                                onChange={handleChange}
                            />
                            Tabagismo
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.etilismo"
                                checked={formData.saude.etilismo === 1}
                                onChange={handleChange}
                            />
                            Etilismo
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.sedentarismo"
                                checked={formData.saude.sedentarismo === 1}
                                onChange={handleChange}
                            />
                            Sedentarismo
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.obesidade"
                                checked={formData.saude.obesidade === 1}
                                onChange={handleChange}
                            />
                            Obesidade
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.hospitalizacao"
                                checked={formData.saude.hospitalizacao === 1}
                                onChange={handleChange}
                            />
                            Hospitalizações
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.cirurgias"
                                checked={formData.saude.cirurgias === 1}
                                onChange={handleChange}
                            />
                            Cirurgias
                        </label>
                        
                        <label>
                            <input
                                type="checkbox"
                                name="saude.vacinacao_em_dia"
                                checked={formData.saude.vacinacao_em_dia === 1}
                                onChange={handleChange}
                            />
                            Vacinação em Dia
                        </label>
                        
                        {formData.sexo === 'FEMININO' && (
                            <label>
                                <input
                                    type="checkbox"
                                    name="saude.gestante"
                                    checked={formData.saude.gestante === 1}
                                    onChange={handleChange}
                                />
                                Gestante
                            </label>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="saude.outras_condicoes">Outras Condições de Saúde:</label>
                        <textarea
                            id="saude.outras_condicoes"
                            name="saude.outras_condicoes"
                            value={formData.saude.outras_condicoes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Descreva outras condições de saúde relevantes..."
                        />
                    </div>
                </fieldset>

                {/* Criança CEPAS */}
                {calcularIdade(formData.data_nascimento) <= 17 && (
                    <fieldset className="form-section">
                        <legend>Atendimento CEPAS (para crianças e adolescentes)</legend>
                        
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="crianca_cepas.ativa"
                                    checked={formData.crianca_cepas.ativa}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        crianca_cepas: {
                                            ...prev.crianca_cepas,
                                            ativa: e.target.checked
                                        }
                                    }))}
                                />
                                Participa do CEPAS
                            </label>
                        </div>

                        {formData.crianca_cepas.ativa && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="crianca_cepas.data_inicio">Data de Início:</label>
                                        <input
                                            type="date"
                                            id="crianca_cepas.data_inicio"
                                            name="crianca_cepas.data_inicio"
                                            value={formData.crianca_cepas.data_inicio}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="crianca_cepas.turno">Turno:</label>
                                        <select
                                            id="crianca_cepas.turno"
                                            name="crianca_cepas.turno"
                                            value={formData.crianca_cepas.turno}
                                            onChange={handleChange}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Manhã">Manhã</option>
                                            <option value="Tarde">Tarde</option>
                                            <option value="Integral">Integral</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="crianca_cepas.atividade">Atividades:</label>
                                    <input
                                        type="text"
                                        id="crianca_cepas.atividade"
                                        name="crianca_cepas.atividade"
                                        value={formData.crianca_cepas.atividade}
                                        onChange={handleChange}
                                        maxLength="150"
                                        placeholder="Ex: Reforço escolar, esportes, artes..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="crianca_cepas.observacoes">Observações:</label>
                                    <textarea
                                        id="crianca_cepas.observacoes"
                                        name="crianca_cepas.observacoes"
                                        value={formData.crianca_cepas.observacoes}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Observações sobre o atendimento..."
                                    />
                                </div>
                            </>
                        )}
                    </fieldset>
                )}

                {/* Botões */}
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        ❌ Cancelar
                    </button>
                    {isEditing && onDelete && (
                        <button type="button" onClick={() => onDelete(membro.id_membro)} className="btn-delete">
                            🗑️ Excluir
                        </button>
                    )}
                    <button type="submit" className="btn-save">
                        {isEditing ? '✅ Atualizar Membro' : '✅ Salvar e Continuar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MembroForm;