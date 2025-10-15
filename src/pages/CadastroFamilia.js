// src/pages/CadastroFamilia.js
import React, { useState } from 'react';
import Formulario from '../components/Formulario';
import * as cepasService from '../services/cepasService';

const CadastroFamilia = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSave = async (dadosDaFamilia) => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        try {
            console.log('Enviando dados da família:', dadosDaFamilia);
            const resposta = await cepasService.createFamilia(dadosDaFamilia);
            console.log('Resposta do backend:', resposta);
            
            setMessage({
                text: `Família cadastrada com sucesso! ID: ${resposta.id_familia}`,
                type: 'success'
            });
            
            // Opcional: Limpar o formulário após sucesso
            // window.location.reload(); // ou implementar reset do formulário
            
        } catch (error) {
            console.error('Erro ao cadastrar família:', error);
            setMessage({
                text: `Erro ao cadastrar família: ${error.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-familia-page">
            <div className="page-header">
                <h1>Nova Família - Cadastro Completo</h1>
                <p>Preencha todos os dados da família para um cadastro completo no sistema CEPAS</p>
            </div>
            
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
            
            {loading && (
                <div className="loading">
                    <p>Cadastrando família... Por favor, aguarde.</p>
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
                
                .message {
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    font-weight: 500;
                }
                
                .message.success {
                    background-color: #d4edda;
                    border: 1px solid #c3e6cb;
                    color: #155724;
                }
                
                .message.error {
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                }
                
                .loading {
                    text-align: center;
                    padding: 20px;
                    background-color: #e3f2fd;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    color: #1565c0;
                    font-weight: 500;
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