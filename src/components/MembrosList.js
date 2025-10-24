import React, { useState } from 'react';
import MembroForm from './MembroForm';
import './MembrosList.css';

const MembrosList = ({ membros, onMembrosChange }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingMembro, setEditingMembro] = useState(null);
    const [sucessMessage, setSucessMessage] = useState('');

    const handleAddMembro = () => {
        setEditingMembro(null);
        setShowForm(true);
        setSucessMessage('');
    };

    const handleEditMembro = (membro) => {
        setEditingMembro(membro);
        setShowForm(true);
        setSucessMessage('');
    };

    const handleSaveMembro = (membroData) => {
        let updatedMembros;
        let mensagem = '';
        
        if (editingMembro) {
            // Atualização
            updatedMembros = membros.map(m => 
                m.temp_id === editingMembro.temp_id ? { ...membroData, temp_id: editingMembro.temp_id } : m
            );
            mensagem = `✅ Membro "${membroData.nome}" atualizado com sucesso!`;
        } else {
            // Novo membro
            const newMembro = {
                ...membroData,
                temp_id: Date.now() // ID temporário para controle local
            };
            updatedMembros = [...membros, newMembro];
            mensagem = `✅ Membro "${membroData.nome}" adicionado com sucesso!`;
        }
        
        onMembrosChange(updatedMembros);
        setShowForm(false);
        setEditingMembro(null);
        
        // Mostrar mensagem de sucesso
        setSucessMessage(mensagem);
        setTimeout(() => setSucessMessage(''), 3000);
    };

    const handleDeleteMembro = (tempId) => {
        if (window.confirm('Tem certeza que deseja excluir este membro?')) {
            const membroExcluido = membros.find(m => m.temp_id === tempId);
            const updatedMembros = membros.filter(m => m.temp_id !== tempId);
            onMembrosChange(updatedMembros);
            setShowForm(false);
            setEditingMembro(null);
            
            // Mostrar mensagem de sucesso
            setSucessMessage(`❌ Membro "${membroExcluido?.nome}" removido com sucesso!`);
            setTimeout(() => setSucessMessage(''), 3000);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingMembro(null);
        setSucessMessage('');
    };

    const calcularIdade = (dataNascimento) => {
        if (!dataNascimento) return 'N/I';
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
        <div className="membros-list-container">
            <div className="membros-header">
                <h3>Membros da Família ({membros.length})</h3>
                <button 
                    type="button" 
                    onClick={handleAddMembro}
                    className="btn-add-membro"
                    disabled={showForm}
                >
                    + Adicionar Membro
                </button>
            </div>

            {/* Mensagem de sucesso */}
            {sucessMessage && (
                <div className="success-message">
                    {sucessMessage}
                </div>
            )}

            {membros.length === 0 && !showForm && (
                <div className="empty-state">
                    <p>👥 Nenhum membro cadastrado ainda.</p>
                    <p><strong>Clique em "Adicionar Membro"</strong> para começar o cadastro da família.</p>
                    <small>Você pode adicionar quantos membros precisar e depois continuar com o restante do formulário.</small>
                </div>
            )}

            {membros.length > 0 && !showForm && (
                <div className="members-summary">
                    <p>✅ <strong>{membros.length} membro(s) cadastrado(s)</strong></p>
                    <small>Você pode adicionar mais membros ou continuar preenchendo o formulário abaixo.</small>
                </div>
            )}

            {membros.length > 0 && (
                <div className="membros-grid">
                    {membros.map((membro) => (
                        <div key={membro.temp_id} className="membro-card">
                            <div className="membro-header">
                                <h4>{membro.nome || 'Nome não informado'}</h4>
                                <div className="membro-actions">
                                    <button 
                                        onClick={() => handleEditMembro(membro)}
                                        className="btn-edit"
                                        disabled={showForm}
                                        title="Editar membro"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteMembro(membro.temp_id)}
                                        className="btn-delete-mini"
                                        disabled={showForm}
                                        title="Excluir membro"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            <div className="membro-info">
                                <div className="info-row">
                                    <span className="label">Relação:</span>
                                    <span>{membro.relacao || 'N/I'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Idade:</span>
                                    <span>{calcularIdade(membro.data_nascimento)} anos</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Sexo:</span>
                                    <span>{membro.sexo || 'N/I'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Ocupação:</span>
                                    <span>{membro.ocupacao || 'N/I'}</span>
                                </div>
                                {membro.crianca_cepas?.ativa && (
                                    <div className="cepas-indicator">
                                        🎓 Participa do CEPAS
                                    </div>
                                )}
                            </div>

                            {/* Indicadores de Saúde */}
                            {membro.saude && (
                                <div className="saude-indicators">
                                    <small>Condições de saúde:</small>
                                    <div className="health-tags">
                                        {membro.saude.hipertensao === 1 && <span className="health-tag">Hipertensão</span>}
                                        {membro.saude.diabetes === 1 && <span className="health-tag">Diabetes</span>}
                                        {membro.saude.gestante === 1 && <span className="health-tag gestante">Gestante</span>}
                                        {membro.saude.vacinacao_em_dia === 1 && <span className="health-tag positive">Vacinas OK</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="form-overlay">
                    <MembroForm
                        membro={editingMembro}
                        onSave={handleSaveMembro}
                        onCancel={handleCancel}
                        onDelete={editingMembro ? () => handleDeleteMembro(editingMembro.temp_id) : null}
                        isEditing={!!editingMembro}
                    />
                </div>
            )}
        </div>
    );
};

export default MembrosList;