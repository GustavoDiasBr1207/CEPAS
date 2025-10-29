// src/pages/CadastroFamilia.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Formulario from '../components/Formulario';
import { API_BASE_URL } from '../config/api';

const CadastroFamilia = () => {
    const { makeAuthenticatedRequest } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [connectionStatus, setConnectionStatus] = useState('testing');

    // Testar conexão quando a página carrega
    useEffect(() => {
        const testConnection = async () => {
            try {
                await makeAuthenticatedRequest('/ping');
                setConnectionStatus('connected');
            } catch (error) {
                setConnectionStatus('error');
            }
        };
        testConnection();
    }, [makeAuthenticatedRequest]);

    const handleSave = async (dadosDaFamilia) => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        try {
            console.log('=== INICIANDO CADASTRO ===');
            console.log('Dados da família sendo enviados:', JSON.stringify(dadosDaFamilia, null, 2));
            
            // Teste de conectividade primeiro
            console.log('Testando conectividade...');
            
            const pingResponse = await makeAuthenticatedRequest('/ping');
            console.log('Status do ping:', pingResponse);
            
            // Fazer requisição de cadastro
            console.log('Iniciando cadastro da família...');
            
            const response = await makeAuthenticatedRequest('/familia-completa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosDaFamilia)
            });
            
            console.log('=== RESPOSTA DO BACKEND ===');
            console.log('Resposta completa:', response);
            
            setMessage({
                text: `🎉 Família cadastrada com sucesso! ID: ${response.id_familia || response.ID}`,
                type: 'success'
            });
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 5000);
            
        } catch (error) {
            console.error('=== ERRO NO CADASTRO ===');
            console.error('Erro completo:', error);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            
            setMessage({
                text: `❌ Erro ao cadastrar família: ${error.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const testDirectConnection = async () => {
        const dadosTeste = {
            nome_familia: "Família Teste Sistema",
            migracao: "Teste",
            estado_origem: "Ceará",
            cidade_origem: "Fortaleza",
            recebe_beneficio: 1,
            possui_plano_saude: 0,
            convenio: "",
            observacoes: "Teste do sistema - " + new Date().toLocaleString(),
            endereco: {
                quadra: "A",
                rua: "Rua de Teste",
                numero_casa: "123",
                complemento: "Teste automático"
            },
            animal: {
                tem_animal: 1,
                qtd_animais: 1,
                qual_animal: "Cão"
            },
            estrutura: {
                tipo_habitacao: "Casa",
                energia_eletrica: 1,
                material_parede: "Tijolo"
            },
            saneamento: {
                horta: 0,
                tem_banheiro: 1,
                dest_lixo: "Coleta pública"
            }
        };
        
        await handleSave(dadosTeste);
    };

    return (
        <div className="cadastro-familia-page">
            <div className="page-header">
                <h1>Nova Família - Cadastro Completo</h1>
                <p>Preencha todos os dados da família para um cadastro completo no sistema CEPAS</p>
                
                {/* Status de conexão */}
                <div className={`connection-status ${connectionStatus}`}>
                    {connectionStatus === 'testing' && (
                        <>🔄 Testando conexão com o backend...</>
                    )}
                    {connectionStatus === 'connected' && (
                        <>✅ Backend conectado e funcionando</>
                    )}
                    {connectionStatus === 'error' && (
                        <>❌ Erro de conexão com o backend - Verifique se o Docker está rodando</>
                    )}
                </div>
            </div>
            
            {message.text && (
                <div className={`message ${message.type}`}>
                    <div className="message-content">
                        {message.type === 'success' && <span className="message-icon">✅</span>}
                        {message.type === 'error' && <span className="message-icon">❌</span>}
                        <span className="message-text">{message.text}</span>
                    </div>
                </div>
            )}
            
            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Cadastrando família no banco de dados... Por favor, aguarde.</p>
                </div>
            )}
            
            {/* Seção de Debug */}
            {connectionStatus === 'connected' && (
                <div className="debug-section">
                    <button 
                        onClick={() => testDirectConnection()} 
                        className="test-button"
                        disabled={loading}
                    >
                        🧪 Testar Cadastro com Dados de Exemplo
                    </button>
                    
                    <details style={{ marginTop: '15px', textAlign: 'left' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            🔍 Informações de Debug
                        </summary>
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '10px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
                            <p><strong>Rota de Cadastro:</strong> /familia-completa</p>
                            <p><strong>Status da Conexão:</strong> {connectionStatus}</p>
                            <p><strong>Última mensagem:</strong> {message.text || 'Nenhuma'}</p>
                        </div>
                    </details>
                </div>
            )}
            
            <Formulario onSave={handleSave} disabled={loading} />
            
            <style jsx>{`
                .cadastro-familia-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .page-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .page-header h1 {
                    color: #2c5aa0;
                    margin-bottom: 10px;
                    font-size: 28px;
                }
                
                .page-header p {
                    color: #666;
                    font-size: 16px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .connection-status {
                    margin-top: 15px;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 14px;
                    display: inline-block;
                }
                
                .connection-status.testing {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                
                .connection-status.connected {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .connection-status.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .debug-section {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border: 1px dashed #6c757d;
                }
                
                .test-button {
                    background: linear-gradient(135deg, #6f42c1 0%, #8a63d2 100%);
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }
                
                .test-button:hover:not(:disabled) {
                    background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
                    transform: translateY(-1px);
                }
                
                .test-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .message {
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    font-weight: 500;
                    border-left: 5px solid;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    animation: slideIn 0.3s ease-out;
                }
                
                .message-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .message-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .message-text {
                    font-size: 16px;
                    line-height: 1.4;
                }
                
                .message.success {
                    background-color: #d4edda;
                    border-color: #28a745;
                    color: #155724;
                    border-left-color: #28a745;
                }
                
                .message.error {
                    background-color: #f8d7da;
                    border-color: #dc3545;
                    color: #721c24;
                    border-left-color: #dc3545;
                }
                
                .loading {
                    text-align: center;
                    padding: 25px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-radius: 8px;
                    margin-bottom: 25px;
                    color: #1565c0;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 15px;
                    border: 4px solid #bbdefb;
                    border-top: 4px solid #1565c0;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 768px) {
                    .page-header h1 {
                        font-size: 24px;
                    }
                    
                    .page-header p {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CadastroFamilia;