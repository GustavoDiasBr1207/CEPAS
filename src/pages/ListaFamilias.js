import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../components/Formulario.css';
import './ListaFamilias.css';
import Formulario from '../components/Formulario';

const ListaFamilias = () => {
    const { makeAuthenticatedRequest } = useAuth();
    const [familias, setFamilias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [familiaEditando, setFamiliaEditando] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterField, setFilterField] = useState('all');

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
            const data = await makeAuthenticatedRequest('/familias');

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
            const data = await makeAuthenticatedRequest(`/familia/${idFamilia}`, {
                method: 'DELETE'
            });

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
            const familiaCompleta = await makeAuthenticatedRequest(`/familia/${idFamilia}`);
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
            const resp = await makeAuthenticatedRequest(`/familia/${familiaEditando.id_familia}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosEditados)
            });
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

    // Tenta extrair o nome do entrevistador do campo STATUS_ENTREVISTA quando
    // ENTREVISTADOR_NOME não estiver presente (fallback para respostas antigas)
    const extrairEntrevistadorDeStatus = (status) => {
        if (!status || typeof status !== 'string') return null;
        // O backend monta STATUS_ENTREVISTA como "✅ dd/mm/yyyy - entrevistado - entrevistador"
        // Podemos tentar capturar o último segmento após ' - '
        const parts = status.split(' - ').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
            // último segmento é provavelmente o entrevistador
            return parts[parts.length - 1];
        }
        return null;
    };

    const handleEditarClick = (idFamilia) => {
        navigate(`/editar-familia/${idFamilia}`);
    };

    // Filtragem local: texto e status
    const filteredFamilias = familias.filter((f) => {
        // Texto: buscar em campos selecionados
        const q = filterText.trim().toLowerCase();
        if (q) {
            let hay = '';
            if (filterField === 'all') {
                hay = `${f.NOME_FAMILIA || ''} ${f.NOME_RESPONSAVEL || ''} ${f.ENDERECO_COMPLETO || ''} ${f.STATUS_ENTREVISTA || ''} ${f.ENTREVISTADOR_NOME || f.ENTREVISTADOR || ''}`;
            } else if (filterField === 'entrevista') {
                hay = `${f.STATUS_ENTREVISTA || ''} ${f.ENTREVISTADOR_NOME || f.ENTREVISTADOR || ''}`;
            } else if (filterField === 'nome') {
                hay = `${f.NOME_FAMILIA || ''}`;
            } else if (filterField === 'responsavel') {
                hay = `${f.NOME_RESPONSAVEL || ''}`;
            } else if (filterField === 'endereco') {
                hay = `${f.ENDERECO_COMPLETO || ''}`;
            }
            if (!hay.toLowerCase().includes(q)) return false;
        }

        // Status: pendente = sem DATA_ENTREVISTA, realizada = com DATA_ENTREVISTA
        if (filterStatus === 'pendente') {
            if (f.DATA_ENTREVISTA) return false;
        } else if (filterStatus === 'realizada') {
            if (!f.DATA_ENTREVISTA) return false;
        }

        return true;
    });

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
                {/* Filtros: busca por texto e status da entrevista */}
                <div
                    className="form-filters"
                    style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '12px',
                        alignItems: 'center',
                        background: '#fbfbfb',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #eee'
                    }}
                >
                    <input
                        type="text"
                        placeholder={
                            filterField === 'all' ? 'Pesquisar nome, responsável, endereço ou entrevista...' :
                            filterField === 'nome' ? 'Pesquisar por nome da família...' :
                            filterField === 'responsavel' ? 'Pesquisar por responsável...' :
                            filterField === 'entrevista' ? 'Pesquisar por status/entrevistador...' :
                            'Pesquisar por endereço...'
                        }
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '260px' }}
                        aria-label="Campo de pesquisa"
                    />

                    <select value={filterField} onChange={(e) => setFilterField(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }} aria-label="Campo para pesquisar em">
                        <option value="all">Pesquisar em: Todos</option>
                        <option value="nome">Nome da família</option>
                        <option value="responsavel">Responsável</option>
                        <option value="endereco">Endereço</option>
                        <option value="entrevista">Entrevista</option>
                    </select>

                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }} aria-label="Filtro por status da entrevista">
                        <option value="all">Todos os status</option>
                        <option value="pendente">Entrevista pendente</option>
                        <option value="realizada">Entrevista realizada</option>
                    </select>

                    <button
                        onClick={() => { setFilterText(''); setFilterField('all'); setFilterStatus('all'); }}
                        title="Limpar filtros"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            background: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        ✖ Limpar
                    </button>
                </div>
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

            {/* Se existem famílias, mas nenhuma corresponde aos filtros, mostramos mensagem específica */}
            {!loading && familias.length > 0 && filteredFamilias.length === 0 && (
                <div className="empty-state">
                    <h3>🔎 Nenhuma família corresponde aos filtros</h3>
                    <p>Altere o texto de busca ou o status para encontrar famílias.</p>
                </div>
            )}

            {!loading && filteredFamilias.length > 0 && (
                <div className="familias-grid">
                    {filteredFamilias.map((familia) => (
                        <div key={familia.ID_FAMILIA} className="familia-card">
                            <div className="familia-header">
                                <h3>👨‍👩‍👧‍👦 {familia.NOME_FAMILIA}</h3>
                                <span className="familia-id">ID: {familia.ID_FAMILIA}</span>
                            </div>

                            <div className="familia-info">
                                <div className="info-row">
                                    <strong>Responsável:</strong> 
                                    <span>{familia.NOME_RESPONSAVEL || 'Não informado'}</span>
                                </div>

                                <div className="info-row">
                                    <strong>📞 Contato:</strong> 
                                    <span>{familia.TELEFONE_CONTATO || familia.CONTATO || 'Não informado'}</span>
                                </div>

                                {/* Entrevistador (monitor) explícito - renderiza somente se houver dado */}
                                {(() => {
                                    // Preferência: ENTREVISTADOR_NOME (campo explícito)
                                    const entrevistadorExpl = familia.ENTREVISTADOR_NOME || familia.ENTREVISTADOR || null;
                                    // Fallback: tentar extrair do STATUS_ENTREVISTA
                                    const entrevistadorFbd = entrevistadorExpl ? null : extrairEntrevistadorDeStatus(familia.STATUS_ENTREVISTA || familia.STATUS_ENTREVISTA);
                                    const entrevistadorFinal = entrevistadorExpl || entrevistadorFbd;
                                    if (entrevistadorFinal) {
                                        return (
                                            <div className="info-row">
                                                <strong>🎤 Entrevistador:</strong>
                                                <span>{entrevistadorFinal}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

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
                                    <strong>Benefício Social:</strong> 
                                    <span style={{ 
                                        color: familia.RECEBE_BENEFICIO ? '#27ae60' : '#e74c3c',
                                        fontWeight: 'bold'
                                    }}>
                                        {familia.STATUS_BENEFICIO || (familia.RECEBE_BENEFICIO ? '✅ Recebe' : '❌ Não recebe')}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <strong>Plano de Saúde:</strong> 
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