import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
// Importa ícones necessários para o componente Consulta e Cadastro
import { Search, Loader, Zap, AlertTriangle, CheckCircle, Save } from 'lucide-react';

// Importa os novos componentes
import CadastroFamilia from './pages/CadastroFamilia';
import ListaFamilias from './pages/ListaFamilias';
import EditarFamilia from './pages/EditarFamilia';
import TesteCadastro from './components/TesteCadastro';

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

/**
 * Componente funcional para o Cadastro de Família (ANTIGO - mantido para compatibilidade).
 * O novo cadastro completo está em CadastroFamilia.js
 */
const CadastroFamiliaAntigo = ({ setPage }) => {
    // Estado para os dados do formulário
    const [formData, setFormData] = useState({
        NOME_CHEFE: '',
        RENDA_FAMILIAR: '', // Receberá string, será convertido para número
        ENDERECO: '',
        ID_AREA: '', // Receberá string, será convertido para número
    });

    // Estado para o status da operação
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(
        "Preencha os campos abaixo para cadastrar uma nova família."
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Função auxiliar para renderizar o status
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("Enviando dados para o backend...");

        const tableName = 'FAMILIA';

        // Converte valores numéricos
        const payload = {
            ...formData,
            RENDA_FAMILIAR: parseFloat(formData.RENDA_FAMILIAR) || null,
            ID_AREA: parseInt(formData.ID_AREA, 10) || null,
        };

        try {
            const url = `${API_BASE_URL}/dados/${tableName}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 409) {
                setStatus("⚠️ Erro: Conflito de ID. O ID_FAMILIA já existe no banco de dados.");
            } else if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}...`);
            } else {
                // Sucesso (201 Created)
                const result = await response.json();
                setStatus(`✅ Família cadastrada com sucesso! ID Gerado/Usado: ${result.ID}`);
                
                // Limpa o formulário após o sucesso
                setFormData({
                    NOME_CHEFE: '',
                    RENDA_FAMILIAR: '',
                    ENDERECO: '',
                    ID_AREA: '',
                });
            }

        } catch (err) {
            console.error(err);
            setStatus(`❌ Erro no cadastro! Detalhes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-green-100 flex flex-col items-center font-sans">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-3xl w-full max-w-lg transition-all duration-300">
                <h1 className="text-4xl font-black mb-6 text-center text-green-800 flex items-center justify-center">
                    <Save className="h-8 w-8 mr-3 text-green-600" />
                    Cadastro de Família
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Insira as informações da nova família para cadastrar na tabela FAMILIA.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Campo NOME_CHEFE */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Nome do Chefe de Família (NOME_CHEFE)</span>
                        <input
                            type="text"
                            name="NOME_CHEFE"
                            value={formData.NOME_CHEFE}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-green-500/50 transition duration-200 shadow-inner"
                            disabled={loading}
                        />
                    </label>

                    {/* Campo RENDA_FAMILIAR */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Renda Familiar (RENDA_FAMILIAR)</span>
                        <input
                            type="number"
                            name="RENDA_FAMILIAR"
                            value={formData.RENDA_FAMILIAR}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="Ex: 2500.50"
                            required
                            className="mt-1 block w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-green-500/50 transition duration-200 shadow-inner"
                            disabled={loading}
                        />
                    </label>

                    {/* Campo ENDERECO */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Endereço (ENDERECO)</span>
                        <input
                            type="text"
                            name="ENDERECO"
                            value={formData.ENDERECO}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-green-500/50 transition duration-200 shadow-inner"
                            disabled={loading}
                        />
                    </label>

                    {/* Campo ID_AREA */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">ID da Área (ID_AREA - Chave Estrangeira)</span>
                        <input
                            type="number"
                            name="ID_AREA"
                            value={formData.ID_AREA}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-green-500/50 transition duration-200 shadow-inner"
                            disabled={loading}
                        />
                    </label>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-extrabold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                Cadastrando...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Salvar Família
                            </>
                        )}
                    </button>
                </form>

                {renderStatus()}

                <button 
                    onClick={() => setPage('home')} 
                    className="mt-8 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg shadow hover:bg-gray-300 transition-colors font-medium w-full"
                >
                    Voltar para Home
                </button>
            </div>
        </div>
    );
};

/**
 * Componente simples para a página inicial (Home).
 */
const Home = ({ pingStatus }) => {
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
                    <Link to="/consulta" className="w-full block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-blue-700 transform hover:scale-[1.02] text-center">Acessar Consulta Geral</Link>
                    <Link to="/cadastro" className="w-full block bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-green-700 transform hover:scale-[1.02] text-center">Cadastro Completo de Família</Link>
                    <Link to="/lista-familias" className="w-full block bg-blue-800 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-blue-900 transform hover:scale-[1.02] text-center">📋 Lista Famílias</Link>
                    <Link to="/cadastro-antigo" className="w-full block bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-yellow-700 transform hover:scale-[1.02] text-center">Cadastro Antigo (Simples)</Link>
                    <Link to="/teste" className="w-full block bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all duration-300 hover:bg-purple-700 transform hover:scale-[1.02] text-center">🧪 Testes do Sistema</Link>
                </div>
            </div>
        </div>
    );
};


// ------------------------------------
// 2. Componente de Navegação (Nav)
// ------------------------------------

const Nav = () => {
    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Consulta Geral', path: '/consulta' },
        { name: 'Cadastro Completo', path: '/cadastro' },
        { name: '📋 Lista Famílias', path: '/lista-familias' },
        { name: 'Cadastro Antigo', path: '/cadastro-antigo' },
        { name: '🧪 Testes', path: '/teste' },
    ];
    return (
        <header className="bg-white shadow-lg sticky top-0 z-10">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="text-2xl font-black text-blue-800">
                    CEPAS
                </div>
                <div className="flex space-x-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600`}
                        >
                            {item.name}
                        </Link>
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
    // Estado para controlar a edição de família
    const [familiaEditandoId, setFamiliaEditandoId] = useState(null);

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

    // Função para navegar para edição de família
    const handleEditarFamilia = (idFamilia) => {
        setFamiliaEditandoId(idFamilia);
        setCurrentPage('editar-familia');
    };

    // Função para voltar da edição para a lista
    const handleVoltarParaLista = () => {
        setFamiliaEditandoId(null);
        setCurrentPage('lista-familias');
    };

    // Função para sucesso da edição
    const handleSucessoEdicao = () => {
        setFamiliaEditandoId(null);
        setCurrentPage('lista-familias');
    };

    // Função para renderizar a página correta baseada no estado
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home setCurrentPage={setCurrentPage} pingStatus={pingStatus} />;
            case 'consulta':
                // A ConsultaGeral agora usa o código do seu Consulta.js
                return <ConsultaGeral setPage={setCurrentPage} />;
            case 'cadastro':
                // Novo cadastro completo
                return <CadastroFamilia />;
            case 'lista-familias':
                // Lista e gerenciamento de famílias
                return <ListaFamilias onEditarFamilia={handleEditarFamilia} />;
            case 'editar-familia':
                // Edição de família
                return (
                    <EditarFamilia 
                        familiaId={familiaEditandoId}
                        onVoltar={handleVoltarParaLista}
                        onSucesso={handleSucessoEdicao}
                    />
                );
            case 'cadastro-antigo':
                // Cadastro antigo mantido para compatibilidade
                return <CadastroFamiliaAntigo setPage={setCurrentPage} />;
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

    function EditarFamiliaWrapper(props) {
        const { id } = useParams();
        return <EditarFamilia familiaId={id} {...props} />;
    }

    return (
        <BrowserRouter>
            <Nav currentPage={null} setPage={() => {}} />
            <main>
                <Routes>
                    <Route path="/" element={<Home setPage={() => {}} pingStatus={pingStatus} />} />
                    <Route path="/consulta" element={<ConsultaGeral setPage={() => {}} />} />
                    <Route path="/cadastro" element={<CadastroFamilia />} />
                    <Route path="/lista-familias" element={<ListaFamilias />} />
                    <Route path="/editar-familia/:id" element={<EditarFamiliaWrapper />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
};

export default App;
