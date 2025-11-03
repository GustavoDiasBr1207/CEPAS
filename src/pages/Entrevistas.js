import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Entrevistas.css';

const formatarData = (isoString) => {
    if (!isoString) {
        return 'Não registrada';
    }
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) {
        return 'Não registrada';
    }
    return data.toLocaleDateString('pt-BR');
};

const formatarRelativo = (dias) => {
    if (dias === null || dias === undefined) {
        return 'Nunca realizada';
    }
    if (dias <= 0) {
        return 'Hoje';
    }
    if (dias === 1) {
        return 'Há 1 dia';
    }
    return `Há ${dias} dias`;
};

const formatarProxima = (dias) => {
    if (dias === null || dias === undefined) {
        return 'Não definido';
    }
    if (dias < 0) {
        const atraso = Math.abs(dias);
        if (atraso === 0) {
            return 'Vence hoje';
        }
        if (atraso === 1) {
            return 'Atrasado 1 dia';
        }
        return `Atrasado ${atraso} dias`;
    }
    if (dias === 0) {
        return 'Para hoje';
    }
    if (dias === 1) {
        return 'Em 1 dia';
    }
    return `Em ${dias} dias`;
};

const numeroFormatado = (valor) => new Intl.NumberFormat('pt-BR').format(Number(valor || 0));

const ordenarResumo = (lista, criterio) => {
    const copia = [...lista];
    if (criterio === 'alfabetica') {
        return copia.sort((a, b) => a.nome_familia.localeCompare(b.nome_familia, 'pt-BR'));
    }
    if (criterio === 'entrevista-recente') {
        return copia.sort((a, b) => {
            const dataA = a.ultima_entrevista ? new Date(a.ultima_entrevista).getTime() : 0;
            const dataB = b.ultima_entrevista ? new Date(b.ultima_entrevista).getTime() : 0;
            return dataB - dataA;
        });
    }
    if (criterio === 'proxima-visita') {
        return copia.sort((a, b) => {
            const diasA = a.dias_ate_proxima ?? Number.MAX_SAFE_INTEGER;
            const diasB = b.dias_ate_proxima ?? Number.MAX_SAFE_INTEGER;
            return diasA - diasB;
        });
    }

    const prioridade = {
        critical: 1,
        warning: 2,
        pending: 3,
        ok: 4
    };

    return copia.sort((a, b) => {
        const priA = prioridade[a.status_level] ?? 5;
        const priB = prioridade[b.status_level] ?? 5;
        if (priA !== priB) {
            return priA - priB;
        }
        const diasA = a.dias_desde_ultima ?? Number.MAX_SAFE_INTEGER;
        const diasB = b.dias_desde_ultima ?? Number.MAX_SAFE_INTEGER;
        return diasB - diasA;
    });
};

const prepararMonitor = (monitor) => {
    if (!monitor) {
        return null;
    }
    const id = monitor.ID_MONITOR ?? monitor.id_monitor ?? monitor.id;
    const nome = monitor.NOME ?? monitor.nome ?? 'Sem nome';
    const telefone = monitor.TELEFONE ?? monitor.telefone ?? null;
    return { id, nome, telefone };
};

const Entrevistas = () => {
    const { makeAuthenticatedRequest, hasPermission } = useAuth();
    const navigate = useNavigate();

    const [resumo, setResumo] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pageWarnings, setPageWarnings] = useState([]);

    const [filtroStatus, setFiltroStatus] = useState('all');
    const [filtroBusca, setFiltroBusca] = useState('');
    const [ordenacao, setOrdenacao] = useState('prioridade');

    const [monitores, setMonitores] = useState([]);

    const [selectedFamily, setSelectedFamily] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [mostrarHistorico, setMostrarHistorico] = useState(false);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formData, setFormData] = useState({
        data: '',
        hora: '',
        entrevistado: '',
        telefone_contato: '',
        monitor_id: '',
        observacoes: '',
        proxima_visita: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [formWarnings, setFormWarnings] = useState([]);

    const podeRegistrar = hasPermission(['monitor', 'coordenador', 'admin']);

    const carregarResumo = useCallback(async () => {
        setLoading(true);
        setError('');
        setPageWarnings([]);
        let lista = [];

        try {
            const resposta = await makeAuthenticatedRequest('/entrevistas/resumo');
            lista = Array.isArray(resposta) ? resposta : resposta?.data || [];
            setResumo(lista);
            setMetrics(resposta?.metrics || null);
        } catch (err) {
            console.error('Erro ao carregar resumo de entrevistas:', err);
            setError(err.message || 'Erro ao carregar resumo de entrevistas.');
        } finally {
            setLoading(false);
        }

        return lista;
    }, [makeAuthenticatedRequest]);

    const carregarMonitores = useCallback(async () => {
        try {
            const resposta = await makeAuthenticatedRequest('/dados/Monitor');
            let lista = [];
            if (Array.isArray(resposta)) {
                lista = resposta.map(prepararMonitor).filter(Boolean);
            } else if (Array.isArray(resposta?.data)) {
                lista = resposta.data.map(prepararMonitor).filter(Boolean);
            } else if (resposta) {
                const monitorNormalizado = prepararMonitor(resposta);
                if (monitorNormalizado) {
                    lista = [monitorNormalizado];
                }
            }
            setMonitores(lista);
        } catch (err) {
            console.warn('Não foi possível carregar a lista de monitores:', err);
        }
    }, [makeAuthenticatedRequest]);

    const carregarHistorico = useCallback(async (familiaId) => {
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const resposta = await makeAuthenticatedRequest(`/familias/${familiaId}/entrevistas`);
            const lista = Array.isArray(resposta) ? resposta : resposta?.data || [];
            setHistorico(lista);
        } catch (err) {
            console.error('Erro ao carregar histórico de entrevistas:', err);
            setHistorico([]);
            setHistoryError(err.message || 'Erro ao carregar histórico de entrevistas.');
        } finally {
            setHistoryLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    useEffect(() => {
        carregarResumo();
        carregarMonitores();
    }, [carregarResumo, carregarMonitores]);

    const abrirHistorico = (familia) => {
        setSelectedFamily(familia);
        setMostrarHistorico(true);
        carregarHistorico(familia.id_familia);
    };

    const fecharHistorico = () => {
        setMostrarHistorico(false);
        setHistorico([]);
        setHistoryError('');
    };

    const abrirFormulario = (familia) => {
        const hojeIso = new Date().toISOString().split('T')[0];
        setSelectedFamily(familia);
        setMostrarFormulario(true);
        setFormError('');
        setFormSuccess('');
        setFormWarnings([]);
        setFormData({
            data: hojeIso,
            hora: '',
            entrevistado: familia.ultima_entrevistado || familia.responsavel || '',
            telefone_contato: familia.ultima_telefone || '',
            monitor_id: '',
            observacoes: '',
            proxima_visita: familia.proxima_visita ? familia.proxima_visita.split('T')[0] : ''
        });
    };

    const fecharFormulario = () => {
        setMostrarFormulario(false);
        setFormLoading(false);
        setFormError('');
        setFormSuccess('');
        setFormWarnings([]);
    };

    const handleFormChange = (campo, valor) => {
        setFormData((prev) => ({ ...prev, [campo]: valor }));
    };

    const registrarEntrevista = async (event) => {
        event.preventDefault();
        if (!selectedFamily) {
            setFormError('Selecione uma família para registrar a entrevista.');
            return;
        }

        if (!formData.data) {
            setFormError('Informe a data da entrevista.');
            return;
        }

        const dataIso = formData.hora ? `${formData.data}T${formData.hora}` : formData.data;
        const payload = {
            data_entrevista: dataIso,
            entrevistado: formData.entrevistado || null,
            telefone_contato: formData.telefone_contato || null,
            observacoes: formData.observacoes || null
        };

        if (formData.proxima_visita) {
            payload.proxima_visita = formData.proxima_visita;
        }

        if (formData.monitor_id) {
            const monitorId = Number(formData.monitor_id);
            if (!Number.isNaN(monitorId)) {
                payload.monitor_id = monitorId;
            }
        }

        setFormLoading(true);
        setFormError('');
        setFormSuccess('');
        setFormWarnings([]);
        setPageWarnings([]);

        try {
            const resposta = await makeAuthenticatedRequest(`/familias/${selectedFamily.id_familia}/entrevistas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setFormSuccess(resposta?.message || 'Entrevista registrada com sucesso.');
            if (Array.isArray(resposta?.warnings)) {
                setFormWarnings(resposta.warnings);
                setPageWarnings(resposta.warnings);
            }

            const listaAtualizada = await carregarResumo();
            if (selectedFamily) {
                const atualizada = listaAtualizada.find((item) => item.id_familia === selectedFamily.id_familia);
                if (atualizada) {
                    setSelectedFamily(atualizada);
                }
            }
            if (mostrarHistorico && selectedFamily) {
                await carregarHistorico(selectedFamily.id_familia);
            }
        } catch (err) {
            console.error('Erro ao registrar entrevista:', err);
            setFormError(err.message || 'Erro ao registrar a entrevista.');
        } finally {
            setFormLoading(false);
        }
    };

    const resumoFiltrado = useMemo(() => {
        const textoBusca = filtroBusca.trim().toLowerCase();
        const filtraStatus = (item) => {
            if (filtroStatus === 'all') {
                return true;
            }
            if (filtroStatus === 'pendente') {
                return item.status_prioridade === 'PENDENTE';
            }
            if (filtroStatus === 'critica') {
                return item.status_prioridade === 'CRITICA';
            }
            if (filtroStatus === 'alerta') {
                return item.status_prioridade === 'ALERTA' || item.status_prioridade === 'ATENCAO';
            }
            if (filtroStatus === 'emdia') {
                return item.status_prioridade === 'EM_DIA';
            }
            if (filtroStatus === 'prox30') {
                return item.dias_ate_proxima !== null && item.dias_ate_proxima >= 0 && item.dias_ate_proxima <= 30;
            }
            if (filtroStatus === 'semHistorico') {
                return (item.total_entrevistas || 0) === 0;
            }
            return true;
        };

        return ordenarResumo(
            resumo.filter((item) => {
                const correspondeStatus = filtraStatus(item);
                if (!correspondeStatus) {
                    return false;
                }
                if (!textoBusca) {
                    return true;
                }
                const campos = [
                    item.nome_familia,
                    item.responsavel,
                    item.ultima_entrevistado,
                    item.ultima_monitor_nome
                ]
                    .filter(Boolean)
                    .map((valor) => valor.toLowerCase());
                return campos.some((valor) => valor.includes(textoBusca));
            }),
            ordenacao
        );
    }, [filtroBusca, filtroStatus, ordenacao, resumo]);

    return (
        <div className="entrevistas-container">
            <div className="entrevistas-header">
                <div>
                    <h1>📑 Painel de Entrevistas</h1>
                    <p>Acompanhe o histórico, identifique pendências e registre novas entrevistas das famílias.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline" onClick={carregarResumo} disabled={loading}>
                        {loading ? 'Atualizando...' : '🔄 Atualizar'}
                    </button>
                </div>
            </div>

            {metrics && (
                <div className="metricas-grid">
                    <div className="metrica-card">
                        <span className="metrica-label">Famílias acompanhadas</span>
                        <strong className="metrica-valor">{numeroFormatado(metrics.totalFamilias)}</strong>
                        <span className="metrica-detalhe">{numeroFormatado(metrics.familiasSemEntrevista)} sem entrevista</span>
                    </div>
                    <div className="metrica-card">
                        <span className="metrica-label">Entrevistas registradas</span>
                        <strong className="metrica-valor">{numeroFormatado(metrics.entrevistasTotal)}</strong>
                        <span className="metrica-detalhe">{numeroFormatado(metrics.entrevistasUltimos30Dias)} nos últimos 30 dias</span>
                    </div>
                    <div className="metrica-card alerta">
                        <span className="metrica-label">Pendências críticas</span>
                        <strong className="metrica-valor">{numeroFormatado(metrics.pendenciasCriticas)}</strong>
                        <span className="metrica-detalhe">{numeroFormatado(metrics.pendenciasAlerta)} em alerta</span>
                    </div>
                    <div className="metrica-card">
                        <span className="metrica-label">Próximas visitas agendadas</span>
                        <strong className="metrica-valor">{numeroFormatado(
                            resumoFiltrado.filter((item) => item.dias_ate_proxima !== null && item.dias_ate_proxima >= 0 && item.dias_ate_proxima <= 30).length
                        )}</strong>
                        <span className="metrica-detalhe">Agendadas para até 30 dias</span>
                    </div>
                </div>
            )}

            <div className="entrevistas-filtros">
                <input
                    type="text"
                    placeholder="Pesquisar por família, responsável ou entrevistador..."
                    value={filtroBusca}
                    onChange={(event) => setFiltroBusca(event.target.value)}
                />
                <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)}>
                    <option value="all">Todos os status</option>
                    <option value="pendente">Sem entrevista</option>
                    <option value="critica">Crítica (&gt;= 12 meses)</option>
                    <option value="alerta">Alerta / Atenção</option>
                    <option value="emdia">Em dia</option>
                    <option value="prox30">Próximas 4 semanas</option>
                    <option value="semHistorico">Nunca entrevistadas</option>
                </select>
                <select value={ordenacao} onChange={(event) => setOrdenacao(event.target.value)}>
                    <option value="prioridade">Ordenar por prioridade</option>
                    <option value="alfabetica">Ordem alfabética</option>
                    <option value="entrevista-recente">Últimas entrevistas</option>
                    <option value="proxima-visita">Próximas visitas</option>
                </select>
            </div>

            {error && <div className="alerta alerta-erro">{error}</div>}
            {pageWarnings.length > 0 && (
                <div className="alerta alerta-aviso">
                    <strong>Atenção:</strong>
                    <ul>
                        {pageWarnings.map((warn, index) => (
                            <li key={`${warn.type}-${index}`}>{warn.message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {loading && <div className="lista-vazia">Carregando entrevistas...</div>}

            {!loading && resumoFiltrado.length === 0 && (
                <div className="lista-vazia">
                    <h3>Não encontramos entrevistas para os filtros selecionados.</h3>
                    <p>Ajuste a busca ou altere o status para visualizar os registros.</p>
                </div>
            )}

            <div className="entrevistas-grid">
                {resumoFiltrado.map((familia) => (
                    <div key={familia.id_familia} className={`entrevista-card status-${familia.status_level}`}>
                        <div className="card-header">
                            <div>
                                <h2>{familia.nome_familia}</h2>
                                <span className="responsavel">Responsável: {familia.responsavel || 'Não informado'}</span>
                            </div>
                            <span className={`status-tag status-${familia.status_level}`}>
                                {familia.status_label}
                            </span>
                        </div>

                        <div className="card-info">
                            <div>
                                <span className="info-label">Última entrevista</span>
                                <strong>{formatarData(familia.ultima_entrevista)}</strong>
                                <span className="info-sub">{formatarRelativo(familia.dias_desde_ultima)}</span>
                            </div>
                            <div>
                                <span className="info-label">Próxima visita agendada</span>
                                <strong>{familia.proxima_visita ? formatarData(familia.proxima_visita) : 'Não agendada'}</strong>
                                {familia.proxima_visita && (
                                    <span className="info-sub">{formatarProxima(familia.dias_ate_proxima)}</span>
                                )}
                            </div>
                            <div>
                                <span className="info-label">Entrevistador</span>
                                <strong>{familia.ultima_monitor_nome || '—'}</strong>
                                <span className="info-sub">{familia.total_entrevistas || 0} entrevista(s)</span>
                            </div>
                        </div>

                        <div className="card-actions">
                            <button className="btn-secondary" onClick={() => abrirHistorico(familia)}>
                                📜 Histórico
                            </button>
                            {podeRegistrar && (
                                <button className="btn-primary" onClick={() => abrirFormulario(familia)}>
                                    ➕ Registrar entrevista
                                </button>
                            )}
                            <button className="btn-link" onClick={() => navigate(`/editar-familia/${familia.id_familia}`)}>
                                ✏️ Ver cadastro completo
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {mostrarHistorico && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <div>
                                <h2>Histórico de Entrevistas</h2>
                                <p>{selectedFamily?.nome_familia}</p>
                            </div>
                            <button className="btn-close" onClick={fecharHistorico}>✖</button>
                        </div>

                        {historyLoading && <div className="loading">Carregando histórico...</div>}
                        {historyError && <div className="alerta alerta-erro">{historyError}</div>}

                        {!historyLoading && historico.length === 0 && (
                            <div className="lista-vazia">
                                <h3>Nenhuma entrevista registrada.</h3>
                                <p>Você pode registrar uma nova entrevista pelo botão abaixo.</p>
                            </div>
                        )}

                        {!historyLoading && historico.length > 0 && (
                            <ul className="historico-lista">
                                {historico.map((item) => (
                                    <li key={item.id_entrevista}>
                                        <div className="historico-header">
                                            <div>
                                                <strong>{formatarData(item.data_entrevista)}</strong>
                                                <span>{formatarRelativo(item.dias_desde)}</span>
                                            </div>
                                            <span className="historico-entrevistador">
                                                {item.monitores?.length
                                                    ? item.monitores.map((monitor) => monitor.nome).join(', ')
                                                    : 'Monitor não informado'}
                                            </span>
                                        </div>
                                        <div className="historico-body">
                                            <p><strong>Entrevistado:</strong> {item.entrevistado || 'Não informado'}</p>
                                            <p><strong>Contato:</strong> {item.telefone_contato || 'Não informado'}</p>
                                            {item.proxima_visita && (
                                                <p>
                                                    <strong>Próxima visita agendada:</strong> {formatarData(item.proxima_visita)}
                                                    {item.dias_ate_proxima !== null && item.dias_ate_proxima !== undefined && (
                                                        <span className="historico-proxima"> ({formatarProxima(item.dias_ate_proxima)})</span>
                                                    )}
                                                </p>
                                            )}
                                            {item.observacoes && (
                                                <p className="historico-observacoes"><strong>Observações:</strong> {item.observacoes}</p>
                                            )}
                                            {item.usuario_responsavel && (
                                                <p className="historico-responsavel">Registrado por {item.usuario_responsavel}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {podeRegistrar && (
                            <div className="modal-footer">
                                <button className="btn-primary" onClick={() => abrirFormulario(selectedFamily)}>
                                    ➕ Registrar nova entrevista
                                </button>
                                <button className="btn-secondary" onClick={fecharHistorico}>Fechar</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mostrarFormulario && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal modal-form">
                        <div className="modal-header">
                            <div>
                                <h2>Registrar entrevista</h2>
                                <p>{selectedFamily?.nome_familia}</p>
                            </div>
                            <button className="btn-close" onClick={fecharFormulario}>✖</button>
                        </div>

                        {formError && <div className="alerta alerta-erro">{formError}</div>}
                        {formSuccess && <div className="alerta alerta-sucesso">{formSuccess}</div>}
                        {formWarnings.length > 0 && (
                            <div className="alerta alerta-aviso">
                                <ul>
                                    {formWarnings.map((warn, index) => (
                                        <li key={`${warn.type}-${index}`}>{warn.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form className="entrevista-form" onSubmit={registrarEntrevista}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="data-entrevista">Data</label>
                                    <input
                                        id="data-entrevista"
                                        type="date"
                                        value={formData.data}
                                        onChange={(event) => handleFormChange('data', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hora-entrevista">Hora</label>
                                    <input
                                        id="hora-entrevista"
                                        type="time"
                                        value={formData.hora}
                                        onChange={(event) => handleFormChange('hora', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="entrevistado">Entrevistado</label>
                                <input
                                    id="entrevistado"
                                    type="text"
                                    value={formData.entrevistado}
                                    onChange={(event) => handleFormChange('entrevistado', event.target.value)}
                                    placeholder="Nome de quem foi atendido"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="telefone">Telefone para contato</label>
                                <input
                                    id="telefone"
                                    type="tel"
                                    value={formData.telefone_contato}
                                    onChange={(event) => handleFormChange('telefone_contato', event.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="monitor">Monitor responsável</label>
                                <select
                                    id="monitor"
                                    value={formData.monitor_id}
                                    onChange={(event) => handleFormChange('monitor_id', event.target.value)}
                                >
                                    <option value="">Selecione um monitor</option>
                                    {monitores.map((monitor) => (
                                        <option key={monitor.id} value={monitor.id}>
                                            {monitor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="proxima-visita">Agendar próxima visita (opcional)</label>
                                <input
                                    id="proxima-visita"
                                    type="date"
                                    value={formData.proxima_visita}
                                    onChange={(event) => handleFormChange('proxima_visita', event.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="observacoes">Observações</label>
                                <textarea
                                    id="observacoes"
                                    rows="4"
                                    value={formData.observacoes}
                                    onChange={(event) => handleFormChange('observacoes', event.target.value)}
                                    placeholder="Resumo da visita, pontos de atenção, encaminhamentos..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Salvando...' : 'Registrar entrevista'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={fecharFormulario}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Entrevistas;
