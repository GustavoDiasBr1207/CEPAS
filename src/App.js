import React, { useState, useEffect } from 'react';
// Importa ícones necessários para o componente Consulta e Cadastro
import { Search, Loader, Zap, AlertTriangle, CheckCircle, Save } from 'lucide-react';

// Importa os novos componentes
import CadastroFamilia from './pages/CadastroFamilia';
import TesteCadastro from './components/TesteCadastro';
import ConsultaCadastros from './pages/ConsultaCadastros';

// URL base do seu backend (o servidor Express rodará na porta 3001)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'; 

// ------------------------------------
// 1. Componentes de Página
// ------------------------------------

/**
 * Componente de Consulta Dinâmica (GET)
 * Permite ao usuário buscar dados de qualquer tabela permitida.
 */
const ConsultaGeral = ({ setPage }) => {
    // Estado para a consulta
    const [tableName, setTableName] = useState('');
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(
      "Digite o nome da tabela (ex: Familia) e clique em Consultar."
    );

    // Endpoint do backend é: /api/dados/:tableName
    const fetchData = async () => {
        if (!tableName) {
            setStatus("❌ Informe o nome da tabela!");
            return;
        }

        setLoading(true);
        setData([]);
        setColumns([]);
        setStatus(`Conectando ao backend e consultando a tabela ${tableName}...`);

        try {
            // Rota CORRIGIDA para /api/dados/:tableName (usando o global API_BASE_URL)
            const url = `${API_BASE_URL}/dados/${tableName}`;
            const response = await fetch(url);

            if (!response.ok) {
                // Tenta ler o erro do corpo da resposta, que pode ser HTML ou texto.
                const errorText = await response.text(); 
                throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}...`);
            }

            const jsonData = await response.json();

            if (jsonData.length === 0) {
                setStatus("⚠️ Nenhum dado encontrado.");
            } else {
                // Filtra valores complexos que não podem ser renderizados diretamente
                const filteredData = jsonData.map(row => {
                    const newRow = {};
                    Object.entries(row).forEach(([key, value]) => {
                        // Verifica se o valor é um objeto (mas não null) e não é uma das primitivas
                        if (
                            value !== null &&
                            typeof value === 'object' &&
                            !Array.isArray(value)
                        ) {
                            newRow[key] = '[Objeto não renderizável]';
                        } else {
                            newRow[key] = value;
                        }
                    });
                    return newRow;
                });

                setData(filteredData);
                setColumns(Object.keys(filteredData[0]));
                setStatus(`✅ Consulta realizada com sucesso! ${filteredData.length} registros encontrados.`);
            }
        } catch (err) {
            console.error(err);
            setStatus(`❌ Erro na consulta! Detalhes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') fetchData();
    };

    const renderStatus = () => {
        let icon;
        let colorClass;
        if (status.startsWith('❌')) {
            icon = <AlertTriangle className="mr-2" />;
            colorClass = 'text-red-600';
        } else if (status.startsWith('✅')) {
            icon = <CheckCircle className="mr-2" />;
            colorClass = 'text-green-600';
        } else if (status.startsWith('⚠️')) {
            icon = <AlertTriangle className="mr-2" />;
            colorClass = 'text-yellow-600';
        } else {
            icon = <Zap className="mr-2" />;
            colorClass = 'text-gray-700';
        }

        return (
            <p className={`mt-4 font-semibold flex items-center ${colorClass}`}>
                {icon}
                {status}
            </p>
        );
    };

    const renderTable = () => {
        if (!data || data.length === 0) return <p>Nenhum dado encontrado.</p>;

        return (
            <div className="overflow-x-auto mt-6 shadow-xl rounded-xl border border-gray-200 max-h-[60vh] md:max-h-[70vh]">
                <table className="min-w-full bg-white border-collapse">
                    <thead className="bg-blue-700 text-white sticky top-0 z-10 shadow-md">
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="py-3 px-4 text-left font-bold uppercase tracking-wider text-sm border-r border-blue-600 last:border-r-0">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex} 
                                className={`border-t border-gray-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition duration-150`}
                            >
                                {columns.map((col) => (
                                    <td key={col} className="py-3 px-4 whitespace-nowrap text-gray-800 text-sm font-medium border-r border-gray-200 last:border-r-0">
                                        {row[col] !== null ? row[col].toString() : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center font-sans">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-3xl w-full max-w-5xl transition-all duration-300">
                <h1 className="text-4xl font-black mb-6 text-center text-blue-900 flex items-center justify-center">
                    <Search className="h-8 w-8 mr-3 text-blue-600" />
                    Consulta de Tabela Dinâmica
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Use esta ferramenta para consultar qualquer tabela permitida (e.g., Monitor, Area, Familia, Membro) diretamente no seu banco de dados Oracle.
                </p>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                    <input
                        type="text"
                        placeholder="Nome da tabela (ex: Familia)"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-grow border-2 border-gray-300 p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition duration-200 shadow-inner text-lg"
                        disabled={loading}
                    />
                    <button
                        onClick={fetchData}
                        disabled={loading || tableName.trim() === ''}
                        className="bg-blue-600 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                Consultando...
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5 mr-2" />
                                Consultar Tabela
                            </>
                        )}
                    </button>
                </div>

                {renderStatus()}
                {data.length > 0 && renderTable()}

                <button 
                    onClick={() => setPage('home')} 
                    className="mt-8 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg shadow hover:bg-gray-300 transition-colors font-medium"
                >
                    Voltar para Home
                </button>
            </div>
        </div>
    );
};

/*
Backup (removed): Componente CadastroFamiliaAntigo — caso precise restaurar, desfazer a remoção.
const CadastroFamiliaAntigo = ({ setPage }) => { ... }
*/

/**
 * Componente simples para a página inicial (Home).
 */
const Home = ({ setPage, pingStatus }) => {
    // Estilos dinâmicos para o status do ping
    const statusColor = pingStatus.startsWith('✅') ? 'bg-green-100 text-green-700 border-green-400' : 
                        pingStatus.startsWith('❌') ? 'bg-red-100 text-red-700 border-red-400' :
                        'bg-yellow-100 text-yellow-700 border-yellow-400';

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-md w-full border border-gray-200">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    Bem-vindo ao Sistema CEPAS!
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    A plataforma de gestão integrada para Monitoramento Social.
                </p>
                
                {/* Status do Backend */}
                <div className={`p-3 border rounded-lg font-semibold text-sm mb-6 ${statusColor}`}>
                    Status do Backend: {pingStatus}
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => setPage('consulta')} 
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-blue-700 transform hover:scale-[1.02]"
                    >
                        Acessar Consulta Geral
                    </button>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => setPage('consulta-cadastros')}
                                className="w-full sm:w-1/2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-green-700"
                            >
                                Consulta Cadastros
                            </button>

                            <button 
                                onClick={() => setPage('cadastro')} 
                                className="w-full sm:w-1/2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-green-700"
                            >
                                Cadastro Completo de Família
                            </button>
                        </div>
                    {/* Cadastro antigo removido - botão eliminado to prefer new CadastroCompleto */}
                    <button 
                        onClick={() => setPage('teste')} 
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-purple-700 transform hover:scale-[1.02]"
                    >
                        🧪 Testes do Sistema
                    </button>
                </div>
            </div>
        </div>
    );
};


// ------------------------------------
// 2. Componente de Navegação (Nav)
// ------------------------------------

const Nav = ({ currentPage, setPage }) => {
        const navItems = [
        { name: 'Home', page: 'home' },
        { name: 'Consulta Geral', page: 'consulta' },
        { name: 'Cadastro Completo', page: 'cadastro' },
            { name: 'Consulta Cadastros', page: 'consulta-cadastros' },
        { name: '🧪 Testes', page: 'teste' },
    ];

    return (
        <header className="bg-white shadow-lg sticky top-0 z-10">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="text-2xl font-black text-blue-800">
                    CEPAS
                </div>
                <div className="flex space-x-4">
                    {navItems.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => setPage(item.page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 
                                ${currentPage === item.page 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </nav>
        </header>
    );
};

// ------------------------------------
// 3. Componente Principal (App)
// ------------------------------------

const App = () => {
    // Estado para gerenciar a página atual
    const [currentPage, setCurrentPage] = useState('home');
    // Estado para exibir o status do backend
    const [pingStatus, setPingStatus] = useState('⏳ Conectando...');

    // Função para verificar o status do backend
    const checkBackendStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ping`);
            const text = await response.text();
            setPingStatus(text);
        } catch (error) {
            console.error("Erro ao conectar com o backend:", error);
            setPingStatus('❌ Backend indisponível (Erro de rede/CORS)');
        }
    };

    // Executa o ping na montagem do componente
    useEffect(() => {
        checkBackendStatus();
    }, []);

    // Função para renderizar a página correta baseada no estado
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home setPage={setCurrentPage} pingStatus={pingStatus} />;
            case 'consulta':
                // A ConsultaGeral agora usa o código do seu Consulta.js
                return <ConsultaGeral setPage={setCurrentPage} />;
            case 'consulta-cadastros':
                return <ConsultaCadastros setPage={setCurrentPage} />;
            case 'cadastro':
                // Novo cadastro completo
                return <CadastroFamilia />;
            case 'teste':
                // Componente de testes
                return (
                    <div>
                        <TesteCadastro />
                        <button 
                            onClick={() => setCurrentPage('home')}
                            style={{
                                margin: '20px auto',
                                display: 'block',
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Voltar para Home
                        </button>
                    </div>
                );
            default:
                return (
                    <div className="p-8 text-center min-h-[calc(100vh-80px)] flex items-center justify-center">
                        <h1 className="text-4xl text-red-600 font-bold">404 - Página não encontrada</h1>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Nav currentPage={currentPage} setPage={setCurrentPage} />
            <main>
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
