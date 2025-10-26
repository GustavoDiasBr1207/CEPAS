import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ListaFamilias.css';
import { getMonitors, deleteMonitor, updateMonitor } from '../services/cepasService';

const ListaMonitores = () => {
    const [monitores, setMonitores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [editingMonitor, setEditingMonitor] = useState(null); // object being edited
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    useEffect(() => {
        carregarMonitores();
    }, []);

    const carregarMonitores = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await getMonitors();
            // API generic GET /api/dados/Monitor might return array or { data }
            const list = Array.isArray(data) ? data : (data.data || data);
            const arr = list || [];
            setMonitores(arr);
            // don't set success here to the total count — keep success for operation messages
            setSuccess('');
        } catch (err) {
            console.error('Erro ao carregar monitores:', err);
            setError(`Erro ao carregar monitores: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const confirmarDelecao = (monitor) => {
        if (!monitor) return;
        const nome = monitor.NOME || monitor.nome || '';
        const ok = window.confirm(`Tem certeza que deseja deletar o monitor ${nome}?`);
        if (ok) deletarMonitor(monitor.ID_MONITOR || monitor.ID || monitor.id_monitor);
    };

    const deletarMonitor = async (id) => {
        if (!id) return;
        setDeletingId(id);
        try {
            await deleteMonitor(id);
            setMonitores(prev => prev.filter(m => (m.ID_MONITOR || m.ID || m.id_monitor) !== id));
            setSuccess('Monitor excluído com sucesso');
        } catch (err) {
            console.error('Erro ao deletar monitor:', err);
            setError(`Erro ao deletar monitor: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const abrirEdicao = (monitor) => {
        // normalize fields
        const m = {
            id: monitor.ID_MONITOR || monitor.ID || monitor.id_monitor,
            nome: monitor.NOME || monitor.nome || '',
            email: monitor.EMAIL || monitor.email || '',
            telefone: monitor.TELEFONE || monitor.telefone || '',
            observacao: monitor.OBSERVACAO || monitor.observacao || ''
        };
        setEditingMonitor(m);
    };

    const fecharEdicao = () => setEditingMonitor(null);

    const salvarEdicao = async (e) => {
        e.preventDefault();
        if (!editingMonitor) return;
        const id = editingMonitor.id;
        const payload = {
            nome: editingMonitor.nome,
            telefone: editingMonitor.telefone || null,
            email: editingMonitor.email,
            observacao: editingMonitor.observacao || null
        };
        try {
            setLoading(true);
            await updateMonitor(id, payload);
            // update local list
            setMonitores(prev => prev.map(m => {
                const mid = m.ID_MONITOR || m.ID || m.id_monitor;
                if (String(mid) === String(id)) {
                    return { ...m, NOME: payload.nome, NOME_FAMILIA: payload.nome, NOME_RESPONSAVEL: payload.nome, NOME: payload.nome, EMAIL: payload.email, TELEFONE: payload.telefone, OBSERVACAO: payload.observacao };
                }
                return m;
            }));
            setSuccess('Monitor atualizado com sucesso');
            fecharEdicao();
        } catch (err) {
            console.error('Erro ao atualizar monitor:', err);
            setError(`Erro ao atualizar monitor: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Derived filtered + paginated list
    const filtered = monitores.filter(m => {
        const nome = (m.NOME || m.nome || '').toString().toLowerCase();
        const email = (m.EMAIL || m.email || '').toString().toLowerCase();
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return nome.includes(q) || email.includes(q) || String(m.ID_MONITOR || m.ID || m.id_monitor).includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paged = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    return (
        <div className="formulario-container">
            <div className="formulario-header">
                <h1>👥 Lista de Monitores</h1>
                <p>Gerencie os monitores cadastrados no sistema</p>
            </div>

            <div className="form-actions" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn-secondary" onClick={carregarMonitores} disabled={loading}>{loading ? 'Carregando...' : 'Recarregar Lista'}</button>
                    <span style={{ color: '#2c3e50', fontWeight: 600 }}>{monitores.length} total</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, e-mail ou ID" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eef6' }} />
                    <Link to="/cadastro-monitor" className="btn-edit">+ Adicionar Monitor</Link>
                </div>
            </div>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            {!loading && monitores.length === 0 && (
                <div className="empty-state">
                    <h3>📭 Nenhum monitor encontrado</h3>
                    <p>Não há monitores cadastrados no sistema ainda.</p>
                </div>
            )}

            {!loading && monitores.length > 0 && (
                <div>
                    {/* show filtered count and dataset info */}
                    {(() => {
                        const q = search.trim();
                        return (
                            <div style={{ textAlign: 'center', fontWeight: 600, margin: '10px 0 18px 0', color: '#2c3e50' }}>
                                {q ? `Mostrando ${filtered.length} de ${monitores.length} (filtro: "${search}")` : `${filtered.length} monitor(es) encontrado(s)`}
                            </div>
                        );
                    })()}
                    <div className="familias-grid">
                        {paged.map((m) => {
                        const id = m.ID_MONITOR || m.ID || m.id_monitor;
                        const nome = m.NOME || m.nome || '';
                        const email = m.EMAIL || m.email || '';
                        const telefone = m.TELEFONE || m.telefone || '';
                        const obs = m.OBSERVACAO || m.observacao || '';

                        return (
                            <div key={String(id)} className="familia-card">
                                <div className="familia-header">
                                    <h3>👤 {nome || '—'}</h3>
                                    <span className="familia-id">ID: {id}</span>
                                </div>

                                <div className="familia-info">
                                    <div className="info-row">
                                        <strong>E-mail:</strong>
                                        <span>{email || 'Não informado'}</span>
                                    </div>
                                    <div className="info-row">
                                        <strong>Telefone:</strong>
                                        <span>{telefone || 'Não informado'}</span>
                                    </div>
                                    {obs && (
                                        <div className="info-row observacoes">
                                            <strong>Observação:</strong>
                                            <span>{obs}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="familia-actions">
                                    <button className="btn-secondary" onClick={() => abrirEdicao(m)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="btn-danger" onClick={() => confirmarDelecao(m)} disabled={deletingId === id}>
                                        {deletingId === id ? '⏳ Deletando...' : '🗑️ Deletar'}
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>

                    {/* pagination controls */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <button className="page-button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} className={`page-button ${currentPage === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                            ))}
                            <button className="page-button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
                        </div>
                    )}
                </div>
            )}

            {/* Edit modal instance (prefill + save) */}
            {editingMonitor && <ModalWrapper editingMonitor={editingMonitor} setEditingMonitor={setEditingMonitor} salvarEdicao={salvarEdicao} fecharEdicao={fecharEdicao} />}
        </div>
    );
};

export default ListaMonitores;

/* Edit modal: renders when editingMonitor is non-null */
// Note: kept at file end to avoid duplicating handlers above


// Modal rendering (portaled inline here)
// We add it outside the main return to keep the component structure linear.
// It uses the same editing state and handlers defined above.

/* eslint-disable react/jsx-no-useless-fragment */

const ModalWrapper = ({ editingMonitor, setEditingMonitor, salvarEdicao, fecharEdicao }) => {
    if (!editingMonitor) return null;

    return (
        <div className="modal-overlay" onMouseDown={fecharEdicao}>
            <div className="modal" onMouseDown={e => e.stopPropagation()}>
                <h2>Editar Monitor</h2>
                <form onSubmit={salvarEdicao} className="modal-form">
                    <label>
                        Nome*:
                        <input
                            type="text"
                            value={editingMonitor.nome}
                            onChange={e => setEditingMonitor(prev => ({ ...prev, nome: e.target.value }))}
                            required
                        />
                    </label>

                    <label>
                        E-mail*:
                        <input
                            type="email"
                            value={editingMonitor.email}
                            onChange={e => setEditingMonitor(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    </label>

                    <label>
                        Telefone:
                        <input
                            type="text"
                            value={editingMonitor.telefone}
                            onChange={e => setEditingMonitor(prev => ({ ...prev, telefone: e.target.value }))}
                        />
                    </label>

                    <label>
                        Observação:
                        <textarea
                            value={editingMonitor.observacao}
                            onChange={e => setEditingMonitor(prev => ({ ...prev, observacao: e.target.value }))}
                        />
                    </label>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={fecharEdicao}>Cancelar</button>
                        <button type="submit" className="btn-edit">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Attach modal component to default export file scope so React can render it below
ListaMonitores.ModalWrapper = ModalWrapper;

