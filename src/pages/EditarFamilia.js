// src/pages/EditarFamilia.js
import React, { useState, useEffect } from 'react';
import Formulario from '../components/Formulario';

const EditarFamilia = ({ familiaId, onVoltar, onSucesso }) => {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [connectionStatus, setConnectionStatus] = useState('testing');
    const [dadosOriginais, setDadosOriginais] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

    // Testar conexão e carregar dados quando a página carrega
    useEffect(() => {
        const testConnection = async () => {
            try {
                const pingUrl = `${API_BASE_URL}/ping`;
                const response = await fetch(pingUrl);
                if (response.ok) {
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('error');
                }
            } catch (error) {
                setConnectionStatus('error');
            }
        };

        const carregarDadosFamilia = async () => {
            if (!familiaId) return;
            
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/familia/${familiaId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        setDadosOriginais(result.data);
                    }
                } else {
                    setMessage({ text: 'Erro ao carregar dados da família', type: 'error' });
                }
            } catch (error) {
                setMessage({ text: `Erro: ${error.message}`, type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        const inicializar = async () => {
            await testConnection();
            if (familiaId) {
                await carregarDadosFamilia();
            }
            setLoadingData(false);
        };
        inicializar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [familiaId]);

    // Função para carregar família específica
    const carregarFamilia = async (id) => {
        try {
            console.log(`Carregando família ID: ${id}`);
            const response = await fetch(`${API_BASE_URL}/familia/${id}`);
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar família: ${response.status}`);
            }
            
            const dados = await response.json();
            console.log('Dados carregados:', dados);
            
            return dados;
        } catch (error) {
            console.error('Erro ao carregar família:', error);
            throw error;
        }
    };

    const handleSave = async (dadosDaFamilia) => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        try {
            console.log('=== INICIANDO EDIÇÃO ===');
            console.log(`Editando família ID: ${familiaId}`);
            console.log('Dados da família sendo enviados:', JSON.stringify(dadosDaFamilia, null, 2));
            
            // Fazer requisição de atualização
            const url = `${API_BASE_URL}/familia/${familiaId}`;
            console.log('URL de atualização:', url);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosDaFamilia)
            });

            console.log('Status da resposta:', response.status);
            
            // Tenta ler a resposta como JSON primeiro
            const responseText = await response.text();
            console.log('Resposta bruta do servidor:', responseText);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Erro ao fazer parse da resposta JSON:', parseError);
                throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${responseData.message || responseData.error || 'Erro desconhecido'}`);
            }

            console.log('✅ Família atualizada com sucesso:', responseData);
            
            setMessage({ 
                text: `✅ ${responseData.message || 'Família atualizada com sucesso!'}`, 
                type: 'success' 
            });

            // Chama callback de sucesso se fornecido
            if (onSucesso) {
                setTimeout(() => onSucesso(), 2000);
            }

        } catch (err) {
            console.error('❌ Erro ao atualizar família:', err);
            
            setMessage({ 
                text: `❌ Erro ao atualizar família: ${err.message}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTesteCadastro = async () => {
        // Dados de exemplo para teste (usando dados originais se disponível)
        const dadosTeste = dadosOriginais ? {
            ...dadosOriginais,
            nomeResponsavel: dadosOriginais.nomeResponsavel + ' (Editado)',
            observacoesFamilia: (dadosOriginais.observacoesFamilia || '') + ' - Atualizado via edição'
        } : {
            // Dados de fallback se não houver dados originais
            nomeResponsavel: 'Família Teste Editada',
            cpfResponsavel: '123.456.789-00',
            telefoneResponsavel: '(11) 99999-9999',
            rendaFamiliar: '1500.00',
            numeroMembros: '4',
            
            logradouro: 'Rua Teste Editada',
            numero: '123',
            bairro: 'Bairro Teste',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            
            possuiAnimais: 'sim',
            tipoAnimal: 'Cachorro',
            quantidadeAnimais: '2',
            
            tipoMoradia: 'Casa',
            materialParedes: 'Tijolo',
            materialTelhado: 'Telha',
            numeroComodos: '5',
            
            abastecimentoAgua: 'Rede pública',
            destinoLixo: 'Coleta pública',
            esgotamento: 'Rede pública',
            
            observacoesFamilia: 'Família teste para edição - dados atualizados'
        };
        
        await handleSave(dadosTeste);
    };

    if (loadingData) {
        return (
            <div className="formulario-container">
                <div className="loading-message">
                    ⏳ Carregando dados da família...
                </div>
            </div>
        );
    }

    if (!dadosOriginais) {
        return (
            <div className="formulario-container">
                <div className="message error">
                    ❌ Não foi possível carregar os dados da família
                </div>
                <button onClick={onVoltar} className="btn-secondary">
                    ← Voltar para Lista
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="formulario-container">
                <div className="formulario-header">
                    <h1>✏️ Editar Família</h1>
                    <p>Modifique os dados da família ID: {familiaId}</p>
                </div>

                {/* Botão Voltar */}
                <div className="form-actions" style={{ marginBottom: '20px' }}>
                    <button onClick={onVoltar} className="btn-secondary">
                        ← Voltar para Lista
                    </button>
                </div>

                {/* Mensagens de status */}
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Debug e Teste */}
                <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    marginBottom: '20px' 
                }}>
                    <h3>🔧 Informações de Debug</h3>
                    <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
                    <p><strong>Rota de Edição:</strong> PUT /familia/{familiaId}</p>
                    <p><strong>Status da Conexão:</strong> {connectionStatus}</p>
                    {message.text && <p><strong>Última mensagem:</strong> {message.text}</p>}
                    
                    <button 
                        onClick={handleTesteCadastro}
                        disabled={loading}
                        style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        {loading ? '⏳ Atualizando...' : '🧪 Testar Atualização com Dados de Exemplo'}
                    </button>
                </div>
            </div>

            {/* Formulário */}
            <Formulario 
                onSave={handleSave} 
                loading={loading}
                dadosIniciais={dadosOriginais}
                modoEdicao={true}
            />
        </div>
    );
};

export default EditarFamilia;