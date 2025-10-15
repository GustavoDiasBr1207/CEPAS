// src/components/TesteCadastro.js
import React, { useState } from 'react';
import * as cepasService from '../services/cepasService';

const TesteCadastro = () => {
    const [resultado, setResultado] = useState('');
    const [loading, setLoading] = useState(false);

    const dadosExemplo = {
        nome_familia: "Família Silva",
        migracao: "Rural para urbana",
        estado_origem: "Ceará",
        cidade_origem: "Fortaleza",
        recebe_beneficio: 1,
        possui_plano_saude: 0,
        convenio: "",
        observacoes: "Família participativa da comunidade",
        
        endereco: {
            id_area: 1,
            quadra: "A",
            rua: "Rua das Flores",
            numero_casa: "123",
            complemento: "Próximo ao mercado central"
        },
        
        animal: {
            tem_animal: 1,
            qtd_animais: 2,
            qual_animal: "Cães de pequeno porte"
        },
        
        estrutura: {
            tipo_habitacao: "Casa",
            tipo_lote: "Próprio",
            situacao_convivencia: "Somente a família",
            energia_eletrica: 1,
            material_parede: "Tijolo",
            material_piso: "Cimento",
            material_cobertura: "Telha",
            qtd_quartos: 3,
            qtd_camas: 4,
            tipo_camas: "2 Solteiro, 1 Casal, 1 Beliche"
        },
        
        saneamento: {
            horta: 1,
            arvore_frutifera: 1,
            como_escoa: "Fossa séptica",
            tem_banheiro: 1,
            dest_lixo: "Coleta pública",
            bebe_agua: "Filtrada",
            trata_agua: "Coleta"
        }
    };

    const testarCadastro = async () => {
        setLoading(true);
        setResultado('');
        
        try {
            console.log('Testando cadastro com dados:', dadosExemplo);
            const resposta = await cepasService.createFamilia(dadosExemplo);
            setResultado(`✅ Sucesso! Família cadastrada com ID: ${resposta.id_familia}\n\nDetalhes:\n${JSON.stringify(resposta, null, 2)}`);
        } catch (error) {
            setResultado(`❌ Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testarConexao = async () => {
        setLoading(true);
        setResultado('');
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/ping`);
            const text = await response.text();
            setResultado(`📡 Teste de conexão: ${text}`);
        } catch (error) {
            setResultado(`❌ Erro de conexão: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testarAreas = async () => {
        setLoading(true);
        setResultado('');
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'}/dados/Area`);
            const areas = await response.json();
            setResultado(`📍 Áreas disponíveis:\n${JSON.stringify(areas, null, 2)}`);
        } catch (error) {
            setResultado(`❌ Erro ao buscar áreas: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '800px', 
            margin: '0 auto',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '20px'
        }}>
            <h2>🧪 Testes do Sistema CEPAS</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button 
                    onClick={testarConexao}
                    disabled={loading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Testando...' : 'Testar Conexão'}
                </button>
                
                <button 
                    onClick={testarAreas}
                    disabled={loading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Carregando...' : 'Listar Áreas'}
                </button>
                
                <button 
                    onClick={testarCadastro}
                    disabled={loading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Cadastrando...' : 'Testar Cadastro'}
                </button>
            </div>

            {resultado && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflow: 'auto'
                }}>
                    {resultado}
                </div>
            )}

            <div style={{ 
                marginTop: '20px', 
                padding: '15px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                fontSize: '14px'
            }}>
                <h4>📋 Dados de Exemplo</h4>
                <pre style={{ 
                    fontSize: '11px', 
                    overflow: 'auto',
                    maxHeight: '200px',
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '4px'
                }}>
                    {JSON.stringify(dadosExemplo, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default TesteCadastro;