import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createMonitor } from '../services/cepasService';
import './ListaFamilias.css'; // reuse existing page styles for a consistent look

const CadastroMonitor = () => {
    const { makeAuthenticatedRequest } = useAuth();
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [observacao, setObservacao] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [connectionStatus, setConnectionStatus] = useState('testing');
    const navigate = useNavigate();

    useEffect(() => {
        const check = async () => {
            try {
                const res = await makeAuthenticatedRequest('/ping');
                setConnectionStatus((res && res.status !== undefined) ? (res.ok ? 'connected' : 'error') : 'connected');
            } catch (e) {
                setConnectionStatus('error');
            }
        };
        check();
    }, [makeAuthenticatedRequest]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!nome || !email) {
            setMessage({ type: 'error', text: 'Nome e e-mail são obrigatórios.' });
            return;
        }

        const payload = { nome, telefone: telefone || null, email, observacao: observacao || null };

        try {
            setLoading(true);
            const res = await createMonitor(payload);
            const idCreated = res.ID || res.id_monitor || '';
            setMessage({ type: 'success', text: `Monitor criado com sucesso${idCreated ? ` (ID: ${idCreated})` : ''}` });
            setNome(''); setTelefone(''); setEmail(''); setObservacao('');
            setTimeout(() => navigate('/consulta'), 900);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Erro ao criar o monitor.' });
        } finally {
            setLoading(false);
        }
    };

    const testCreate = async () => {
        setMessage({ text: '', type: '' });
        const sample = { nome: 'Monitor Teste', telefone: '000000000', email: `monitor.teste+${Date.now()}@exemplo.com`, observacao: 'Teste automático' };
        try {
            setLoading(true);
            const res = await createMonitor(sample);
            const idCreated = res.ID || res.id_monitor || '';
            setMessage({ type: 'success', text: `Monitor criado (teste) ${idCreated ? `(ID: ${idCreated})` : ''}` });
        } catch (err) {
            setMessage({ type: 'error', text: `Erro no teste: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formulario-container">
            <div className="formulario-header">
                <h1>👤 Cadastro de Monitor</h1>
                <p>Cadastre os monitores responsáveis pelas entrevistas e pelo acompanhamento de famílias.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
                {connectionStatus === 'testing' && <div className="message">🔄 Testando conexão com o backend...</div>}
                {connectionStatus === 'connected' && <div className="message success">✅ Backend conectado e funcionando</div>}
                {connectionStatus === 'error' && <div className="message error">❌ Erro de conexão com o backend</div>}
            </div>

            {message.text && (
                <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="form-actions" style={{ marginBottom: 18 }}>
                <button onClick={testCreate} className="btn-secondary" disabled={loading}>🧪 Testar cadastro (exemplo)</button>
            </div>

            <div className="familia-card" style={{ maxWidth: 800, margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <div className="info-row">
                        <strong style={{ minWidth: 140 }}>Nome *</strong>
                        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef6' }} />
                    </div>

                    <div className="info-row">
                        <strong style={{ minWidth: 140 }}>E-mail *</strong>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef6' }} />
                    </div>

                    <div className="info-row">
                        <strong style={{ minWidth: 140 }}>Telefone</strong>
                        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef6' }} />
                    </div>

                    <div className="info-row">
                        <strong style={{ minWidth: 140 }}>Observação</strong>
                        <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} placeholder="Observações opcionais" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eef6' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Voltar</button>
                        <button type="submit" className="btn-edit" disabled={loading}>{loading ? 'Enviando...' : 'Cadastrar Monitor'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CadastroMonitor;
