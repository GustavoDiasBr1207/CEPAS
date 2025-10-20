import React, { useState, useEffect } from 'react';
import Tabela from '../components/Tabela'; 
// Importa o serviço que criamos para buscar os dados do backend
import { getFamilias } from '../services/cepasService'; 


const ConsultaGeral = () => {
    // 1. Estado para armazenar os dados carregados do Oracle DB
    const [familias, setFamilias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Efeito para carregar os dados quando o componente é montado
    useEffect(() => {
        const fetchFamilias = async () => {
            try {
                // Limpa o estado de erro e define loading como true
                setError(null);
                setIsLoading(true);

                // CHAMA A FUNÇÃO DE API do seu backend
                const data = await getFamilias();
                
                // Armazena os dados no estado
                setFamilias(data);
            } catch (err) {
                // Em caso de falha na requisição
                setError(`Falha ao carregar dados: ${err.message}`);
                console.error("Erro ao buscar famílias:", err);
            } finally {
                // Finaliza o estado de loading
                setIsLoading(false);
            }
        };

        fetchFamilias();
    }, []); // O array vazio garante que a função só roda UMA VEZ ao montar

    // 3. Define as colunas baseadas no schema Oracle
    const colunas = [
        { 
            key: 'ID_FAMILIA', 
            label: 'ID',
            render: (value) => `#${value}`
        },
        { 
            key: 'NOME_FAMILIA', 
            label: 'Família',
            render: (value) => (
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {value || 'Não informado'}
                </div>
            )
        },
        { 
            key: 'NOME_RESPONSAVEL', 
            label: 'Responsável',
            render: (value) => value || 'Não informado'
        },
        { 
            key: 'COMPOSICAO_FAMILIAR', 
            label: 'Membros',
            render: (value) => value || '👥 0'
        },
        { 
            key: 'ENDERECO_COMPLETO', 
            label: 'Localização',
            render: (value) => {
                if (!value || value === 'Não informado') return '📍 Não informado';
                return value.length > 35 ? '📍 ' + value.substring(0, 35) + '...' : '📍 ' + value;
            }
        },
        { 
            key: 'STATUS_CEPAS', 
            label: 'CEPAS',
            render: (value) => value || '⭕ Nenhuma'
        },
        { 
            key: 'STATUS_BENEFICIO', 
            label: 'Benefício',
            render: (value) => value || '❌ Não'
        },
        { 
            key: 'CONDICOES_HABITACAO', 
            label: 'Habitação',
            render: (value) => {
                if (!value || value === 'Não informado') return '🏠 N/I';
                return value.length > 25 ? value.substring(0, 25) + '...' : value;
            }
        },
        { 
            key: 'STATUS_ENTREVISTA', 
            label: 'Entrevista',
            render: (value) => value || '⏳ Pendente'
        },
        { 
            key: 'DATA_CADASTRO', 
            label: 'Cadastro',
            render: (value) => {
                if (!value) return 'N/A';
                const data = new Date(value);
                return data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                });
            }
        }
    ];

    // 4. Renderização condicional
    if (isLoading) {
        return <h1>Carregando dados...</h1>;
    }

    if (error) {
        return <h1 style={{ color: 'red' }}>Erro: {error}</h1>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
                    📋 Consulta Geral de Famílias
                </h1>
                <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
                    Visualize e gerencie todas as famílias cadastradas no sistema CEPAS
                </p>
            </div>

            {/* Estatísticas resumidas baseadas no schema */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '15px', 
                marginBottom: '25px' 
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #3498db, #2980b9)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.length}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>👨‍👩‍👧‍👦 Famílias</p>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #27ae60, #229954)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.reduce((total, familia) => total + (familia.TOTAL_MEMBROS || 0), 0)}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>👥 Pessoas</p>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.reduce((total, familia) => total + (familia.CRIANCAS_ATIVAS_CEPAS || 0), 0)}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>🎯 Crianças CEPAS</p>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.filter(f => f.RECEBE_BENEFICIO).length}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>💰 Com Benefícios</p>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.filter(f => f.POSSUI_PLANO_SAUDE).length}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>🏥 Plano Saúde</p>
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                        {familias.filter(f => !f.DATA_ENTREVISTA).length}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>⏳ Entrevistas Pendentes</p>
                </div>
            </div>

            {/* Tabela de dados */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{
                    background: '#f8f9fa',
                    padding: '15px 20px',
                    borderBottom: '1px solid #dee2e6'
                }}>
                    <h3 style={{ margin: 0, color: '#495057' }}>
                        Lista Completa de Famílias
                    </h3>
                </div>
                <Tabela 
                    data={familias}    // Passamos o estado (famílias)
                    columns={colunas}  // Passamos as colunas definidas
                />
            </div>
        </div>
    );
};

export default ConsultaGeral;