import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { CalendarDays, CheckCircle2, Clock3, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendario.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
    format: (date, formatStr) => format(date, formatStr, { locale: ptBR }),
    parse: (value, formatString, baseDate) => parse(value, formatString, baseDate, { locale: ptBR }),
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales
});

const TIPO_CONFIG = {
    realizada: {
        label: 'Entrevistas realizadas',
        color: '#1d4ed8'
    },
    agendada: {
        label: 'Visitas agendadas',
        color: '#f97316'
    }
};

const Calendario = () => {
    const { makeAuthenticatedRequest, hasPermission } = useAuth();

    const [rawEvents, setRawEvents] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [tipoFiltro, setTipoFiltro] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionFeedback, setActionFeedback] = useState(null);
    const [processingEventId, setProcessingEventId] = useState(null);

    const carregarEventos = useCallback(async () => {
        if (!hasPermission(['monitor', 'coordenador', 'admin'])) {
            setError('Você não tem permissão para visualizar o calendário.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest('/entrevistas/calendario');
            setRawEvents(response?.events || []);
            setMetrics(response?.metrics || null);
        } catch (err) {
            console.error('Erro ao carregar calendário:', err);
            setError(err?.message || 'Erro ao carregar calendário de entrevistas.');
        } finally {
            setLoading(false);
        }
    }, [hasPermission, makeAuthenticatedRequest]);

    useEffect(() => {
        carregarEventos();
    }, [carregarEventos]);

    const eventosFiltrados = useMemo(() => {
        const filtrados = rawEvents
            .filter((evento) => tipoFiltro === 'all' || evento.tipo === tipoFiltro)
            .map((evento) => ({
                ...evento,
                title: evento.titulo,
                start: new Date(evento.data),
                end: new Date(evento.data),
                allDay: true
            }));

        return filtrados;
    }, [rawEvents, tipoFiltro]);

    const eventPropGetter = useCallback((event) => {
        const config = TIPO_CONFIG[event.tipo];
        if (!config) return {};

        return {
            className: `calendario-evento evento-${event.tipo}`,
            style: {
                backgroundColor: config.color,
                borderColor: config.color
            }
        };
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
    }, []);

    const limparSelecao = useCallback(() => setSelectedEvent(null), []);

    const handleMarcarCumprida = useCallback(async (event) => {
        if (!event || event.tipo !== 'agendada') {
            return;
        }

        const confirmado = window.confirm('Confirmar que esta visita foi cumprida? A agenda será removida.');
        if (!confirmado) return;

        setProcessingEventId(event.id);
        setActionFeedback(null);

        try {
            const response = await makeAuthenticatedRequest(`/entrevistas/${event.entrevista_id}/concluir-agendamento`, {
                method: 'PATCH',
                body: JSON.stringify({ origem: 'calendario' })
            });

            setActionFeedback({
                type: 'success',
                message: response?.message || 'Visita marcada como cumprida com sucesso.'
            });

            await carregarEventos();
            setSelectedEvent(null);
        } catch (err) {
            console.error('Erro ao concluir agendamento:', err);
            setActionFeedback({
                type: 'error',
                message: err?.message || 'Erro ao concluir agendamento.'
            });
        } finally {
            setProcessingEventId(null);
        }
    }, [carregarEventos, makeAuthenticatedRequest]);

    return (
        <div className="calendario-container">
            <header className="calendario-header">
                <div className="calendario-header-titulo">
                    <CalendarDays size={28} />
                    <div>
                        <h1>Calendário de Entrevistas</h1>
                        <p>Acompanhe entrevistas realizadas e próximas visitas em uma visão única.</p>
                    </div>
                </div>
                <button className="calendario-btn" onClick={carregarEventos} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                    Atualizar
                </button>
            </header>

            <section className="calendario-controles">
                <div className="filtros">
                    <button
                        type="button"
                        className={`filtro-btn ${tipoFiltro === 'all' ? 'ativo' : ''}`}
                        onClick={() => setTipoFiltro('all')}
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${tipoFiltro === 'realizada' ? 'ativo' : ''}`}
                        onClick={() => setTipoFiltro('realizada')}
                    >
                        Realizadas
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${tipoFiltro === 'agendada' ? 'ativo' : ''}`}
                        onClick={() => setTipoFiltro('agendada')}
                    >
                        Agendadas
                    </button>
                </div>

                <div className="legenda">
                    {Object.entries(TIPO_CONFIG).map(([tipo, config]) => (
                        <span key={tipo} className="legenda-item">
                            <span className="legenda-cor" style={{ backgroundColor: config.color }} />
                            {config.label}
                        </span>
                    ))}
                </div>
            </section>

            {error && (
                <div className="calendario-alerta erro">{error}</div>
            )}

            {actionFeedback && !error && (
                <div className={`calendario-alerta ${actionFeedback.type === 'error' ? 'erro' : 'sucesso'}`}>
                    {actionFeedback.message}
                </div>
            )}

            {loading ? (
                <div className="calendario-loading">Carregando calendário...</div>
            ) : (
                <div className="calendario-conteudo">
                    <div className="calendario-area-principal">
                        <Calendar
                            localizer={localizer}
                            events={eventosFiltrados}
                            startAccessor="start"
                            endAccessor="end"
                            views={{ month: true, agenda: true }}
                            defaultView="month"
                            messages={{
                                month: 'Mês',
                                agenda: 'Agenda',
                                today: 'Hoje',
                                previous: 'Anterior',
                                next: 'Próximo'
                            }}
                            eventPropGetter={eventPropGetter}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={limparSelecao}
                            selectable
                        />
                    </div>

                    <aside className="calendario-sidebar">
                        <div className="sidebar-card">
                            <h2>Indicadores</h2>
                            {metrics ? (
                                <ul>
                                    <li>
                                        <CheckCircle2 />
                                        <div>
                                            <strong>{metrics.entrevistasRealizadas}</strong>
                                            <span>Entrevistas registradas</span>
                                        </div>
                                    </li>
                                    <li>
                                        <Clock3 />
                                        <div>
                                            <strong>{metrics.visitasAgendadas}</strong>
                                            <span>Visitas agendadas</span>
                                        </div>
                                    </li>
                                    <li>
                                        <CalendarDays />
                                        <div>
                                            <strong>{metrics.visitasAgendadasFuturas}</strong>
                                            <span>Visitas futuras</span>
                                        </div>
                                    </li>
                                    <li>
                                        <Users />
                                        <div>
                                            <strong>{metrics.visitasNosProximos7Dias}</strong>
                                            <span>Nos próximos 7 dias</span>
                                        </div>
                                    </li>
                                </ul>
                            ) : (
                                <p>Nenhum indicador disponível.</p>
                            )}
                        </div>

                        <div className="sidebar-card">
                            <h2>Detalhes do evento</h2>
                            {selectedEvent ? (
                                <div className="detalhes-evento">
                                    <h3>{selectedEvent.titulo}</h3>
                                    <p><strong>Data:</strong> {format(new Date(selectedEvent.data), "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                    <p><strong>Família:</strong> {selectedEvent.familia_nome}</p>
                                    {selectedEvent.entrevistado && (
                                        <p><strong>Entrevistado:</strong> {selectedEvent.entrevistado}</p>
                                    )}
                                    {selectedEvent.telefone_contato && (
                                        <p><strong>Contato:</strong> {selectedEvent.telefone_contato}</p>
                                    )}
                                    {selectedEvent.monitor_nomes?.length > 0 && (
                                        <p><strong>Monitores:</strong> {selectedEvent.monitor_nomes.join(', ')}</p>
                                    )}
                                    {selectedEvent.usuario_responsavel && (
                                        <p><strong>Registrado por:</strong> {selectedEvent.usuario_responsavel}</p>
                                    )}
                                    {selectedEvent.data_entrevista_base && (
                                        <p><strong>Entrevista de origem:</strong> {format(new Date(selectedEvent.data_entrevista_base), "dd/MM/yyyy", { locale: ptBR })}</p>
                                    )}
                                    {selectedEvent.dias_referencia !== null && selectedEvent.dias_referencia !== undefined && (
                                        <p>
                                            <strong>{selectedEvent.tipo === 'agendada' ? 'Faltam:' : 'Passaram:'}</strong> {Math.abs(selectedEvent.dias_referencia)} dia(s)
                                        </p>
                                    )}
                                    {selectedEvent.observacoes && (
                                        <p className="observacoes"><strong>Observações:</strong> {selectedEvent.observacoes}</p>
                                    )}

                                    {selectedEvent.tipo === 'agendada' && (
                                        <div className="detalhes-acoes">
                                            <button
                                                type="button"
                                                className="detalhes-btn concluir"
                                                onClick={() => handleMarcarCumprida(selectedEvent)}
                                                disabled={processingEventId === selectedEvent.id || loading}
                                            >
                                                {processingEventId === selectedEvent.id ? 'Marcando...' : 'Marcar como cumprida'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>Selecione um evento no calendário para ver os detalhes.</p>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default Calendario;
