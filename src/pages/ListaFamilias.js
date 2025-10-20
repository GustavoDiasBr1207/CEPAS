import React, { useState, useEffect } from 'react';
import '../components/Formulario.css';
import './ListaFamilias.css';
import Formulario from '../components/Formulario';
import { useNavigate } from 'react-router-dom';

const ListaFamilias = () => {
    const [familias, setFamilias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [familiaEditando, setFamiliaEditando] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    const navigate = useNavigate();

    // Carrega a lista de famílias ao montar o componente
    useEffect(() => {
        carregarFamilias();
    }, []);

    const carregarFamilias = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('📋 Carregando lista de famílias...');
            const response = await fetch(`${API_BASE_URL}/familias`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Famílias carregadas:', data);
            
            setFamilias(data.data || []);
            setSuccess(`${data.data?.length || 0} famílias encontradas`);
            
        } catch (err) {
            console.error('❌ Erro ao carregar famílias:', err);
            setError(`Erro ao carregar famílias: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const confirmarDelecao = (familia) => {
        const confirmacao = window.confirm(
            `Tem certeza que deseja deletar a família ${familia.NOME_FAMILIA}?\n\n` +
            `Responsável: ${familia.NOME_RESPONSAVEL || 'Não informado'}\n` +
            `Endereço: ${familia.ENDERECO_COMPLETO || 'Não informado'}\n` +
            `Total de membros: ${familia.TOTAL_MEMBROS || 0}\n\n` +
            `⚠️ Esta ação irá remover TODOS os dados relacionados a esta família e não pode ser desfeita!`
        );
        
        if (confirmacao) {
            deletarFamilia(familia.ID_FAMILIA);
        }
    };

    const deletarFamilia = async (idFamilia) => {
        setDeletingId(idFamilia);
        setError('');
        setSuccess('');
        
        try {
            console.log(`🗑️ Deletando família ID: ${idFamilia}...`);
            const response = await fetch(`${API_BASE_URL}/familia/${idFamilia}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Família deletada:', data);
            setSuccess(`✅ ${data.message}`);
            
            // Remove a família da lista local
            setFamilias(familias.filter(f => f.ID_FAMILIA !== idFamilia));
            
        } catch (err) {
            console.error('❌ Erro ao deletar família:', err);
            setError(`❌ Erro ao deletar família: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const editarFamilia = async (idFamilia) => {
        try {
            setEditLoading(true);
            // Buscar dados completos da família
            const response = await fetch(`${API_BASE_URL}/familia/${idFamilia}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            const familiaCompleta = await response.json();
            setFamiliaEditando(familiaCompleta.data || familiaCompleta);
        } catch (err) {
            setError(`❌ Erro ao carregar dados da família: ${err.message}`);
        } finally {
            setEditLoading(false);
        }
    };

    const handleSalvarEdicao = async (dadosEditados) => {
        if (!familiaEditando || !familiaEditando.id_familia) return;
        setEditLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(`${API_BASE_URL}/familia/${familiaEditando.id_familia}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEditados)
            });
            const resp = await response.json();
            if (!response.ok) {
                throw new Error(resp.message || resp.error || 'Erro desconhecido');
            }
            setSuccess('Família editada com sucesso!');
            setFamiliaEditando(null);
            await carregarFamilias();
        } catch (err) {
            setError(`❌ Erro ao salvar edição: ${err.message}`);
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelarEdicao = () => {
        setFamiliaEditando(null);
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'Não informado';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarRenda = (renda) => {
        if (!renda) return 'Não informado';
        return `R$ ${parseFloat(renda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const handleEditarClick = (idFamilia) => {
        navigate(`/editar-familia/${idFamilia}`);
    };

    return (
        <div className="formulario-container">
            <div className="formulario-header">
                <h1>📋 Lista de Famílias Cadastradas</h1>
                <p>Gerencie as famílias cadastradas no sistema</p>
            </div>

            {/* Botão de recarregar */}
            <div className="form-actions" style={{ marginBottom: '20px' }}>
                <button 
                    onClick={carregarFamilias}
                    disabled={loading}
                    className="btn-secondary"
                >
                    🔄 {loading ? 'Carregando...' : 'Recarregar Lista'}
                </button>
            </div>

            {/* Mensagens de status */}
            {error && (
                <div className="message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="message success">
                    {success}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="loading-message">
                    ⏳ Carregando famílias...
                </div>
            )}

            {/* Modal de edição */}
            {familiaEditando && (
                <div className="modal-edicao">
                    <h2>Editar Família</h2>
                    <Formulario
                        modoEdicao={true}
                        dadosIniciais={familiaEditando}
                        onSave={handleSalvarEdicao}
                        disabled={editLoading}
                    />
                    <button className="btn-secondary" onClick={handleCancelarEdicao} disabled={editLoading} style={{marginTop: '15px'}}>Cancelar</button>
                </div>
            )}

            {/* Lista de famílias */}
            {!loading && familias.length === 0 && (
                <div className="empty-state">
                    <h3>📭 Nenhuma família encontrada</h3>
                    <p>Não há famílias cadastradas no sistema ainda.</p>
                </div>
            )}

            {!loading && familias.length > 0 && (
                <div className="familias-grid">
                    {familias.map((familia) => (
                        <div key={familia.ID_FAMILIA} className="familia-card">
                            <div className="familia-header">
                                <h3>👨‍👩‍👧‍👦 {familia.NOME_FAMILIA}</h3>
                                <span className="familia-id">ID: {familia.ID_FAMILIA}</span>
                            </div>

                            <div className="familia-info">
                                <div className="info-row">
                                    <strong>� Responsável:</strong> 
                                    <span>{familia.NOME_RESPONSAVEL || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>📞 Contato:</strong> 
                                    <span>{familia.TELEFONE_CONTATO || familia.CONTATO || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>🎯 Crianças CEPAS:</strong> 
                                    <span style={{ 
                                        color: familia.CRIANCAS_ATIVAS_CEPAS > 0 ? '#27ae60' : '#7f8c8d',
                                        fontWeight: familia.CRIANCAS_ATIVAS_CEPAS > 0 ? 'bold' : 'normal'
                                    }}>
                                        {familia.CRIANCAS_ATIVAS_CEPAS > 0 ? 
                                            `${familia.CRIANCAS_ATIVAS_CEPAS} criança(s) ativa(s)` : 
                                            'Nenhuma'
                                        }
                                    </span>
                                </div>

                                <div className="info-row">
                                    <strong>👥 Membros:</strong> 
                                    <span>{familia.COMPOSICAO_FAMILIAR || `${familia.TOTAL_MEMBROS || 0} pessoa(s)`}</span>
                                </div>

                                <div className="info-row">
                                    <strong>� Benefício Social:</strong> 
                                    <span style={{ 
                                        color: familia.RECEBE_BENEFICIO ? '#27ae60' : '#e74c3c',
                                        fontWeight: 'bold'
                                    }}>
                                        {familia.STATUS_BENEFICIO || (familia.RECEBE_BENEFICIO ? '✅ Recebe' : '❌ Não recebe')}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <strong>� Plano de Saúde:</strong> 
                                    <span style={{ 
                                        color: familia.POSSUI_PLANO_SAUDE ? '#27ae60' : '#e74c3c'
                                    }}>
                                        {familia.STATUS_PLANO_SAUDE || (familia.POSSUI_PLANO_SAUDE ? '✅ Possui' : '❌ Não possui')}
                                        {familia.CONVENIO && ` (${familia.CONVENIO})`}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <strong>🏠 Habitação:</strong> 
                                    <span>{familia.CONDICOES_HABITACAO || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>📍 Endereço:</strong> 
                                    <span>{familia.ENDERECO_COMPLETO || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>🗺️ Origem:</strong> 
                                    <span>{familia.ORIGEM_COMPLETA || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>🎤 Entrevista:</strong> 
                                    <span>{familia.STATUS_ENTREVISTA || 'Não realizada'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>📅 Cadastrado em:</strong> 
                                    <span>{formatarData(familia.DATA_CADASTRO)}</span>
                                </div>

                                {familia.OBSERVACOES && (
                                    <div className="info-row observacoes">
                                        <strong>📝 Observações:</strong> 
                                        <span>{familia.OBSERVACOES.length > 100 ? 
                                            familia.OBSERVACOES.substring(0, 100) + '...' : 
                                            familia.OBSERVACOES
                                        }</span>
                                    </div>
                                )}

                                {/* Badge de status */}
                                <div className="status-badges">
                                    {familia.CRIANCAS_ATIVAS_CEPAS > 0 && (
                                        <span className="badge badge-cepas">
                                            🎯 CEPAS ATIVO
                                        </span>
                                    )}
                                    {familia.RECEBE_BENEFICIO && (
                                        <span className="badge badge-beneficio">
                                            💰 BENEFÍCIO
                                        </span>
                                    )}
                                    {!familia.DATA_ENTREVISTA && (
                                        <span className="badge badge-pendente">
                                            ⏳ ENTREVISTA PENDENTE
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="familia-actions">
                                <button
                                    onClick={() => handleEditarClick(familia.ID_FAMILIA)}
                                    disabled={deletingId === familia.ID_FAMILIA}
                                    className="btn-edit"
                                >
                                    ✏️ Editar
                                </button>
                                
                                <button
                                    onClick={() => confirmarDelecao(familia)}
                                    disabled={deletingId === familia.ID_FAMILIA}
                                    className="btn-danger"
                                >
                                    {deletingId === familia.ID_FAMILIA ? (
                                        '⏳ Deletando...'
                                    ) : (
                                        '🗑️ Deletar'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListaFamilias;