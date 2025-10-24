import React, { useEffect, useState } from 'react';
import MonitorForm from '../components/MonitorForm';

const CadastroMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const pingUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ping`;
        const response = await fetch(pingUrl);
        if (response.ok) setConnectionStatus('connected'); else setConnectionStatus('error');
      } catch (err) {
        setConnectionStatus('error');
      }
    };
    testConnection();
  }, []);

  const handleSuccess = (res) => {
    setMessage({ text: 'Monitor cadastrado com sucesso!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3500);
  };

  return (
    <div className="cadastro-familia-page">
      <div className="page-header text-center">
        <h1>Cadastro de Monitores</h1>
        <p>Cadastre os monitores que realizarão entrevistas e visitas no sistema.</p>
        <div className={`connection-status ${connectionStatus}`} style={{ marginTop: 12 }}>
          {connectionStatus === 'testing' && <>🔄 Testando conexão com o backend...</>}
          {connectionStatus === 'connected' && <>✅ Backend conectado e funcionando</>}
          {connectionStatus === 'error' && <>❌ Erro de conexão com o backend - Verifique se o servidor está rodando</>}
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`} style={{ maxWidth: 980, margin: '18px auto' }}>
          <div className="message-content">
            {message.type === 'success' && <span className="message-icon">✅</span>}
            <span className="message-text">{message.text}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        <MonitorForm onSuccess={handleSuccess} />
      </div>
      <style jsx>{`
        .cadastro-familia-page { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .page-header h1 { color: #2c5aa0; margin-bottom: 10px; font-size: 28px; }
        .page-header p { color: #666; font-size: 16px; max-width: 600px; margin: 0 auto; }
        .connection-status { margin-top: 15px; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; }
        .connection-status.testing { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .connection-status.connected { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .connection-status.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      `}</style>
    </div>
  );
};

export default CadastroMonitor;
