import React, { useState } from 'react';
// Importe o serviço que você vai criar em src/services/cepasService.js
// Vamos assumir que ele tem uma função chamada 'createFamilia'
// import * as cepasService from '../services/cepasService'; 

function Formulario({ onSave }) {
    // 1. Estado para armazenar os dados do formulário
    // Ajuste esses campos de acordo com a sua tabela 'FAMILIA'
    const [formData, setFormData] = useState({
        nome: '',
        membros: 0,
        endereco: ''
    });

    // 2. Função que atualiza o estado a cada digitação
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: name === 'membros' ? parseInt(value) : value // Converte 'membros' para número
        }));
    };

    // 3. Função que lida com o envio do formulário
    const handleSubmit = (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Chamada da função passada via props (do componente 'page' pai)
        onSave(formData);
    };

    return (
        <div className="formulario-container">
            <h2>Cadastro de Família</h2>
            <form onSubmit={handleSubmit}>
                
                {/* Campo Nome */}
                <div className="form-group">
                    <label htmlFor="nome">Nome da Família:</label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Campo Membros */}
                <div className="form-group">
                    <label htmlFor="membros">Número de Membros:</label>
                    <input
                        type="number"
                        id="membros"
                        name="membros"
                        value={formData.membros}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>

                {/* Campo Endereço */}
                <div className="form-group">
                    <label htmlFor="endereco">Endereço:</label>
                    <input
                        type="text"
                        id="endereco"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Botão de Envio */}
                <button type="submit">Salvar Cadastro</button>
            </form>
        </div>
    );
}

export default Formulario;