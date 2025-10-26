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
    const [familiaVisualizando, setFamiliaVisualizando] = useState(null);
    const [viewLoadingId, setViewLoadingId] = useState(null);
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

    const visualizarFamilia = async (idFamilia) => {
        setViewLoadingId(idFamilia);
        setError('');
        try {
            const resposta = await makeAuthenticatedRequest(`/familia/${idFamilia}`);
            setFamiliaVisualizando(resposta.data || resposta);
        } catch (err) {
            console.error('❌ Erro ao carregar detalhes da família:', err);
            setError(`❌ Erro ao carregar detalhes da família: ${err.message}`);
        } finally {
            setViewLoadingId(null);
        }
    };

    const fecharVisualizacao = () => {
        setFamiliaVisualizando(null);
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

    const getCampo = (obj, chaves) => {
        if (!obj) return null;
        for (const chave of chaves) {
            if (Object.prototype.hasOwnProperty.call(obj, chave)) {
                const valor = obj[chave];
                if (valor !== undefined && valor !== null && valor !== '') {
                    return valor;
                }
            }
        }
        return null;
    };

    const formatarBooleano = (valor) => {
        if (valor === 1 || valor === true) return 'Sim';
        if (valor === 0 || valor === false) return 'Não';
        return 'Não informado';
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
                                    onClick={() => visualizarFamilia(familia.ID_FAMILIA)}
                                    disabled={viewLoadingId === familia.ID_FAMILIA}
                                    className="btn-view"
                                >
                                    {viewLoadingId === familia.ID_FAMILIA ? '👁️ Abrindo...' : '👁️ Ver'}
                                </button>

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

            {familiaVisualizando && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal modal-view">
                        <h2>Detalhes da Família</h2>
                        <p className="view-subtitle">
                            ID: {getCampo(familiaVisualizando, ['id_familia', 'ID_FAMILIA']) || 'N/I'}
                        </p>

                        <div className="view-section">
                            <h3>Dados Gerais</h3>
                            <ul>
                                <li><strong>Nome:</strong> {getCampo(familiaVisualizando, ['nome_familia', 'NOME_FAMILIA']) || 'Não informado'}</li>
                                <li><strong>Responsável:</strong> {getCampo(familiaVisualizando, ['nome_responsavel', 'NOME_RESPONSAVEL']) || 'Não informado'}</li>
                                <li><strong>Contato:</strong> {getCampo(familiaVisualizando, ['telefone_contato', 'contato', 'TELEFONE_CONTATO', 'CONTATO']) || 'Não informado'}</li>
                                <li><strong>Data de Cadastro:</strong> {formatarData(getCampo(familiaVisualizando, ['data_cadastro', 'DATA_CADASTRO']))}</li>
                                <li><strong>Recebe Benefício:</strong> {formatarBooleano(getCampo(familiaVisualizando, ['recebe_beneficio', 'RECEBE_BENEFICIO']))}</li>
                                <li><strong>Possui Plano de Saúde:</strong> {formatarBooleano(getCampo(familiaVisualizando, ['possui_plano_saude', 'POSSUI_PLANO_SAUDE']))}</li>
                                {getCampo(familiaVisualizando, ['convenio', 'CONVENIO']) && (
                                    <li><strong>Convênio:</strong> {getCampo(familiaVisualizando, ['convenio', 'CONVENIO'])}</li>
                                )}
                                {getCampo(familiaVisualizando, ['observacoes', 'OBSERVACOES']) && (
                                    <li><strong>Observações:</strong> {getCampo(familiaVisualizando, ['observacoes', 'OBSERVACOES'])}</li>
                                )}
                            </ul>
                        </div>

                        <div className="view-section">
                            <h3>Endereço</h3>
                            {(() => {
                                const endereco = getCampo(familiaVisualizando, ['endereco', 'ENDERECO']) || {};
                                return (
                                    <ul>
                                        <li><strong>Área:</strong> {getCampo(endereco, ['nome_area', 'NOME_AREA']) || getCampo(endereco, ['id_area', 'ID_AREA']) || 'Não informado'}</li>
                                        <li><strong>Quadra:</strong> {getCampo(endereco, ['quadra', 'QUADRA']) || 'Não informado'}</li>
                                        <li><strong>Rua:</strong> {getCampo(endereco, ['rua', 'RUA']) || 'Não informado'}</li>
                                        <li><strong>Número:</strong> {getCampo(endereco, ['numero_casa', 'NUMERO_CASA']) || 'Não informado'}</li>
                                        {getCampo(endereco, ['complemento', 'COMPLEMENTO']) && (
                                            <li><strong>Complemento:</strong> {getCampo(endereco, ['complemento', 'COMPLEMENTO'])}</li>
                                        )}
                                    </ul>
                                );
                            })()}
                        </div>

                        <div className="view-section">
                            <h3>Estrutura da Habitação</h3>
                            {(() => {
                                const estrutura = getCampo(familiaVisualizando, ['estrutura', 'estrutura_habitacao', 'ESTRUTURA']) || {};
                                return (
                                    <ul>
                                        <li><strong>Tipo de Habitação:</strong> {getCampo(estrutura, ['tipo_habitacao', 'TIPO_HABITACAO']) || 'Não informado'}</li>
                                        <li><strong>Tipo de Lote:</strong> {getCampo(estrutura, ['tipo_lote', 'TIPO_LOTE']) || 'Não informado'}</li>
                                        <li><strong>Convivência:</strong> {getCampo(estrutura, ['situacao_convivencia', 'SITUACAO_CONVIVENCIA']) || 'Não informado'}</li>
                                        <li><strong>Energia Elétrica:</strong> {formatarBooleano(getCampo(estrutura, ['energia_eletrica', 'ENERGIA_ELETRICA']))}</li>
                                        <li><strong>Material Parede:</strong> {getCampo(estrutura, ['material_parede', 'MATERIAL_PAREDE']) || 'Não informado'}</li>
                                        <li><strong>Material Piso:</strong> {getCampo(estrutura, ['material_piso', 'MATERIAL_PISO']) || 'Não informado'}</li>
                                        <li><strong>Material Cobertura:</strong> {getCampo(estrutura, ['material_cobertura', 'MATERIAL_COBERTURA']) || 'Não informado'}</li>
                                        <li><strong>Quartos:</strong> {getCampo(estrutura, ['qtd_quartos', 'QTD_QUARTOS']) || 'Não informado'}</li>
                                        <li><strong>Camas:</strong> {getCampo(estrutura, ['qtd_camas', 'QTD_CAMAS']) || 'Não informado'}</li>
                                        {getCampo(estrutura, ['tipo_camas', 'TIPO_CAMAS']) && (
                                            <li><strong>Tipo de Camas:</strong> {getCampo(estrutura, ['tipo_camas', 'TIPO_CAMAS'])}</li>
                                        )}
                                    </ul>
                                );
                            })()}
                        </div>

                        <div className="view-split">
                            <div className="view-section">
                                <h3>Animais</h3>
                                {(() => {
                                    const animal = getCampo(familiaVisualizando, ['animal', 'ANIMAL']) || {};
                                    return (
                                        <ul>
                                            <li><strong>Possui Animais:</strong> {formatarBooleano(getCampo(animal, ['tem_animal', 'TEM_ANIMAL']))}</li>
                                            {getCampo(animal, ['qtd_animais', 'QTD_ANIMAIS']) && (
                                                <li><strong>Quantidade:</strong> {getCampo(animal, ['qtd_animais', 'QTD_ANIMAIS'])}</li>
                                            )}
                                            {getCampo(animal, ['qual_animal', 'QUAL_ANIMAL']) && (
                                                <li><strong>Tipos:</strong> {getCampo(animal, ['qual_animal', 'QUAL_ANIMAL'])}</li>
                                            )}
                                        </ul>
                                    );
                                })()}
                            </div>

                            <div className="view-section">
                                <h3>Saneamento</h3>
                                {(() => {
                                    const saneamento = getCampo(familiaVisualizando, ['saneamento', 'RECURSO_SANEAMENTO']) || {};
                                    return (
                                        <ul>
                                            <li><strong>Horta:</strong> {formatarBooleano(getCampo(saneamento, ['horta', 'HORTA']))}</li>
                                            <li><strong>Árvore Frutífera:</strong> {formatarBooleano(getCampo(saneamento, ['arvore_frutifera', 'ARVORE_FRUTIFERA']))}</li>
                                            <li><strong>Banheiro:</strong> {formatarBooleano(getCampo(saneamento, ['tem_banheiro', 'TEM_BANHEIRO']))}</li>
                                            <li><strong>Esgotamento:</strong> {getCampo(saneamento, ['como_escoa', 'COMO_ESCOA']) || 'Não informado'}</li>
                                            <li><strong>Destino do Lixo:</strong> {getCampo(saneamento, ['dest_lixo', 'DEST_LIXO']) || 'Não informado'}</li>
                                            <li><strong>Consumo de Água:</strong> {getCampo(saneamento, ['bebe_agua', 'BEBE_AGUA']) || 'Não informado'}</li>
                                            <li><strong>Tratamento da Água:</strong> {getCampo(saneamento, ['trata_agua', 'TRATA_AGUA']) || 'Não informado'}</li>
                                        </ul>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="view-section">
                            <h3>Entrevista</h3>
                            {(() => {
                                const entrevista = getCampo(familiaVisualizando, ['entrevista', 'ENTREVISTA']) || {};
                                return (
                                    <ul>
                                        <li><strong>Entrevistado:</strong> {getCampo(entrevista, ['entrevistado', 'ENTREVISTADO']) || 'Não informado'}</li>
                                        <li><strong>Data:</strong> {formatarData(getCampo(entrevista, ['data_entrevista', 'DATA_ENTREVISTA']))}</li>
                                        <li><strong>Entrevistador:</strong> {getCampo(entrevista, ['entrevistador_nome', 'ENTREVISTADOR_NOME', 'entrevistador', 'ENTREVISTADOR']) || 'Não informado'}</li>
                                        <li><strong>Contato:</strong> {getCampo(entrevista, ['telefone_contato', 'TELEFONE_CONTATO']) || 'Não informado'}</li>
                                        {getCampo(entrevista, ['observacoes', 'OBSERVACOES']) && (
                                            <li><strong>Observações:</strong> {getCampo(entrevista, ['observacoes', 'OBSERVACOES'])}</li>
                                        )}
                                    </ul>
                                );
                            })()}
                        </div>

                        <div className="view-section">
                            <h3>Membros da Família</h3>
                            {(() => {
                                const membros = getCampo(familiaVisualizando, ['membros', 'MEMBROS']);
                                if (!Array.isArray(membros) || membros.length === 0) {
                                    return <p>Nenhum membro cadastrado.</p>;
                                }
                                return (
                                    <ul className="view-membros">
                                        {membros.map((membro, index) => {
                                            const chave = membro.id_membro || membro.ID_MEMBRO || membro.membro_id || index;
                                            const criancaCepasValor = getCampo(membro, ['crianca_cepas', 'CRIANCA_CEPAS']);
                                            const participaCepas = (() => {
                                                if (!criancaCepasValor) return false;
                                                if (typeof criancaCepasValor === 'object') {
                                                    return criancaCepasValor.ativa === 1 || criancaCepasValor.ativa === true;
                                                }
                                                return criancaCepasValor === 1 || criancaCepasValor === true;
                                            })();
                                            return (
                                                <li key={chave}>
                                                    <span className="membro-nome">{getCampo(membro, ['nome', 'NOME']) || 'Sem nome'}</span>
                                                    <span className="membro-detalhe">Relação: {getCampo(membro, ['relacao', 'RELACAO']) || 'N/I'}</span>
                                                    {getCampo(membro, ['sexo', 'SEXO']) && (
                                                        <span className="membro-detalhe">Sexo: {getCampo(membro, ['sexo', 'SEXO'])}</span>
                                                    )}
                                                    {getCampo(membro, ['data_nascimento', 'DATA_NASCIMENTO']) && (
                                                        <span className="membro-detalhe">Nascimento: {formatarData(getCampo(membro, ['data_nascimento', 'DATA_NASCIMENTO']))}</span>
                                                    )}
                                                    {getCampo(membro, ['ocupacao', 'OCUPACAO']) && (
                                                        <span className="membro-detalhe">Ocupação: {getCampo(membro, ['ocupacao', 'OCUPACAO'])}</span>
                                                    )}
                                                    {participaCepas && <span className="membro-tag">🎯 CEPAS</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            })()}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={fecharVisualizacao}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaFamilias;