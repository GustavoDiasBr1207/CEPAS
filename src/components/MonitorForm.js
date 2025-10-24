import React, { useState } from 'react';
import { createMonitor, updateMonitor } from '../services/cepasService';
import { useNavigate } from 'react-router-dom';
import './Formulario.css';

const MonitorForm = ({ initial = {}, onSuccess = null, mode = 'create', monitorId = null }) => {
  const [nome, setNome] = useState(initial.nome || '');
  const [telefone, setTelefone] = useState(initial.telefone || '');
  const [email, setEmail] = useState(initial.email || '');
  const [observacao, setObservacao] = useState(initial.observacao || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    if (!nome.trim()) return 'Nome é obrigatório.';
    if (!email.trim()) return 'E-mail é obrigatório.';
    // regra simples de validação de email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'E-mail inválido.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      const payload = { nome, telefone, email, observacao };
      let res;
      if (mode === 'edit' && monitorId) {
        res = await updateMonitor(monitorId, payload);
        setSuccess('Monitor atualizado com sucesso!');
      } else {
        res = await createMonitor(payload);
        setSuccess('Monitor cadastrado com sucesso!');
      }
      if (typeof onSuccess === 'function') {
        try { onSuccess(res); } catch (e) { /* ignore */ }
      }
      // Redireciona para a Home como fallback
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      console.error('Erro ao criar monitor:', err);
      setError(err.message || 'Erro ao cadastrar monitor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formulario-container">
      <h2 className="formulario-header" style={{ textAlign: 'left', paddingBottom: 10 }}>
        Cadastro de Monitor
      </h2>

      {error && <div className="message error" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div className="message success" style={{ marginBottom: 12 }}>{success}</div>}

      <form onSubmit={handleSubmit} className="familia-form">
        <fieldset className="form-section">
          <legend>Dados do Monitor</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" name="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observacao">Observação</label>
            <textarea id="observacao" name="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows="4" />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>{loading ? '⏳ Cadastrando...' : '💾 Cadastrar Monitor'}</button>
        </div>
      </form>
    </div>
  );
};

export default MonitorForm;
