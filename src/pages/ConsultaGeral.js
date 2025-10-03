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

    // 3. Define as colunas (consistente com o exemplo do Tabela.js e o backend)
    // O backend geralmente retorna nomes em maiúsculas (ex: ID, NOME_FAMILIA)
    const colunas = ['ID', 'NOME_FAMILIA', 'MEMBROS', 'ENDERECO'];

    // 4. Renderização condicional
    if (isLoading) {
        return <h1>Carregando dados...</h1>;
    }

    if (error) {
        return <h1 style={{ color: 'red' }}>Erro: {error}</h1>;
    }

    return (
        <div>
            <h1>Consulta Geral de Famílias</h1>
            <p>Total de registros encontrados: {familias.length}</p>
            <Tabela 
                data={familias}    // Passamos o estado (famílias)
                columns={colunas}  // Passamos as colunas definidas
            />
        </div>
    );
};

export default ConsultaGeral;