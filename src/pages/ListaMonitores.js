import React, { useEffect, useState } from 'react';
import { getMonitores, deleteMonitor } from '../services/cepasService';
import MonitorForm from '../components/MonitorForm';

const ListaMonitores = () => {
  const [monitores, setMonitores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editing, setEditing] = useState(null); // monitor object being edited

  const fetchMonitores = async () => {
    setLoading(true);
    try {
      const res = await getMonitores();
      // Service may return array or { data: [...] }
      const rows = Array.isArray(res) ? res : (res.data || res);
      setMonitores(rows || []);
    } catch (err) {
      console.error('Erro ao buscar monitores:', err);
      setMessage({ text: 'Erro ao buscar monitores: ' + (err.message || err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitores();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este monitor?')) return;
    try {
      await deleteMonitor(id);
      setMessage({ text: 'Monitor excluído com sucesso', type: 'success' });
      fetchMonitores();
    } catch (err) {
      console.error('Erro ao excluir monitor:', err);
      setMessage({ text: 'Erro ao excluir monitor: ' + (err.message || err), type: 'error' });
    }
  };

  const handleEditClick = (monitor) => {
    // Convert keys to more friendly shape if needed
    setEditing(monitor);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAfterSave = (res) => {
    setMessage({ text: 'Alteração salva com sucesso', type: 'success' });
    setEditing(null);
    fetchMonitores();
  };

  const renderCard = (m) => {
    const id = m.ID_MONITOR || m.id_monitor || m.ID || m.ID_MON;
    const nome = m.NOME || m.nome || m.NOME_MONITOR || '';
    const telefone = m.TELEFONE || m.telefone || '';
    const email = m.EMAIL || m.email || '';
    const observacao = m.OBSERVACAO || m.observacao || '';
    const created = m.CREATED_AT || m.created_at || m.CREATED_AT || '';

    return (
      <div key={id} className="familia-card">
        <div className="familia-header">
          <h3>{nome || '—'}</h3>
          <div className="familia-id">ID: {id}</div>
        </div>

        <div className="familia-info">
          <div className="info-row"><strong>📞 Telefone:</strong><span>{telefone || '—'}</span></div>
          <div className="info-row"><strong>✉️ E-mail:</strong><span>{email || '—'}</span></div>
          <div className="info-row"><strong>📝 Observação:</strong><span>{observacao || '—'}</span></div>
          {created && <div className="info-row"><strong>🗓️ Cadastrado em:</strong><span>{new Date(created).toLocaleString ? new Date(created).toLocaleString() : String(created)}</span></div>}
        </div>

        <div className="familia-actions">
          <button className="btn-edit" onClick={() => handleEditClick(m)}>✏️ Editar</button>
          <button className="btn-danger" onClick={() => handleDelete(id)}>🗑️ Deletar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="formulario-container">
      <div className="formulario-header">
        <h1>Lista de Monitores Cadastrados</h1>
        <p>Gerencie os monitores cadastrados no sistema</p>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {editing && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 8 }}>Editando: {editing.NOME || editing.nome}</h2>
          <MonitorForm initial={{ nome: editing.NOME || editing.nome || '', telefone: editing.TELEFONE || editing.telefone || '', email: editing.EMAIL || editing.email || '', observacao: editing.OBSERVACAO || editing.observacao || '' }} mode="edit" monitorId={editing.ID_MONITOR || editing.id_monitor} onSuccess={handleAfterSave} />
        </div>
      )}

      {loading ? (
        <div className="loading-message">Carregando monitores...</div>
      ) : (
        <div className="familias-grid">
          {monitores.length === 0 ? <div className="empty-state"><h3>Nenhum monitor encontrado</h3><p>Cadastre novos monitores através do formulário.</p></div> : monitores.map(renderCard)}
        </div>
      )}
    </div>
  );
};

export default ListaMonitores;
