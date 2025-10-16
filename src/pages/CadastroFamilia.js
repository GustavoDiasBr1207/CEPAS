// src/pages/CadastroFamilia.js
import React, { useState } from 'react';
import { Save } from 'lucide-react';
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
        <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-green-100 flex flex-col items-center font-sans">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-3xl w-full max-w-5xl transition-all duration-300">
                <h1 className="text-4xl font-black mb-6 text-center text-green-800 flex items-center justify-center">
                    <Save className="h-8 w-8 mr-3 text-green-600" />
                    Cadastro Completo de Família
                </h1>

                <p className="text-center text-gray-600 mb-6">Preencha todos os dados da família para um cadastro completo no sistema CEPAS</p>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-md font-medium ${message.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                {loading && (
                    <div className="mb-6 text-center p-4 bg-blue-50 rounded-md text-blue-700 font-medium">Cadastrando família... Por favor, aguarde.</div>
                )}

                <Formulario onSave={handleSave} disabled={loading} />

                <div className="mt-6 flex justify-end">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md shadow hover:bg-gray-300">Ir para topo</button>
                </div>
            </div>
        </div>
    );
};

export default CadastroFamilia;