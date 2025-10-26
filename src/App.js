import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
// Importa ícones necessários para o componente Consulta e Cadastro
import { Search, Loader, Zap, AlertTriangle, CheckCircle, Save, Clipboard, User, Sun, Moon } from 'lucide-react';
import './Home.css';

// Importa os novos componentes
import CadastroFamilia from './pages/CadastroFamilia';
import ListaFamilias from './pages/ListaFamilias';
import EditarFamilia from './pages/EditarFamilia';
import CadastroMonitor from './pages/CadastroMonitor';
import ListaMonitores from './pages/ListaMonitores';

// Importa componentes de autenticação
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';

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
    const { makeAuthenticatedRequest } = useAuth();
    
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
            // Rota CORRIGIDA para /api/dados/:tableName usando autenticação
            const jsonData = await makeAuthenticatedRequest(`/dados/${tableName}`);

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

/* Cadastro antigo removido. O novo cadastro completo permanece em `./pages/CadastroFamilia.js`. */

/**
 * Componente simples para a página inicial (Home) - redesign com cards.
 */
const Home = ({ pingStatus }) => {
    const { hasPermission } = useAuth();
    const statusColor = pingStatus.startsWith('✅') ? 'text-green-700' : pingStatus.startsWith('❌') ? 'text-red-700' : 'text-yellow-700';

    const cards = [
        {
            title: 'Consulta Geral',
            desc: 'Consulte qualquer tabela do banco (Monitor, Area, Familia, Membro).',
            to: '/consulta',
            color: '#2563eb',
            icon: <Search />,
            permission: null // Todos podem acessar
        },
        {
            title: 'Cadastro de Monitores',
            desc: 'Cadastre monitores responsáveis pelas entrevistas e monitoramento.',
            to: '/cadastro-monitor',
            color: '#059669',
            icon: <User />,
            permission: ['admin', 'coordenador']
        },
        {
            title: 'Lista de Monitores',
            desc: 'Veja, edite ou exclua monitores cadastrados.',
            to: '/monitores',
            color: '#0ea5a4',
            icon: <User />,
            permission: ['admin', 'coordenador']
        },
        {
            title: 'Cadastro Completo',
            desc: 'Cadastre famílias com endereço, membros e dados complementares.',
            to: '/cadastro',
            color: '#16a34a',
            icon: <Save />,
            permission: ['monitor', 'coordenador', 'admin']
        },
        {
            title: 'Lista de Famílias',
            desc: 'Visualize, edite ou exclua registros já cadastrados.',
            to: '/lista-familias',
            color: '#1e40af',
            icon: <Clipboard />,
            permission: null // Todos podem acessar
        }
    ];

    const visibleCards = cards.filter(card => 
        !card.permission || hasPermission(card.permission)
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-blue-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Bem-vindo ao Sistema CEPAS!</h1>
                        <p className="text-gray-600 mt-2">A plataforma de gestão integrada para Monitoramento Social.</p>
                    </div>
                    <div className="mt-3 md:mt-0">
                        <div className={`inline-block px-4 py-2 border rounded-lg font-semibold ${statusColor} bg-white/80`}>Status do Backend: <span className="font-bold">{pingStatus}</span></div>
                    </div>
                </header>

                <section className="cards-section">
                    <div className="cards-grid">
                        {visibleCards.map((card) => (
                            <Link key={card.to} to={card.to} className="card-link">
                                <div className="card">
                                    <div className="card-top">
                                        <div className="card-icon" style={{ backgroundColor: card.color }}>{card.icon}</div>
                                        <div className="card-go">Ir →</div>
                                    </div>
                                    <h3 className="card-title">{card.title}</h3>
                                    <p className="card-desc">{card.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <footer className="mt-10 text-sm text-gray-500">Use os cartões acima para navegar rapidamente pelas principais funcionalidades.</footer>
            </div>
        </div>
    );
};


// ------------------------------------
// 3. Componente Principal (App)
// ------------------------------------

// Componente wrapper para verificar autenticação
const AppContent = () => {
    const { isAuthenticated, isLoading, makeAuthenticatedRequest } = useAuth();
    
    // Estado para exibir o status do backend
    const [pingStatus, setPingStatus] = useState('⏳ Conectando...');

    // Função para verificar o status do backend
    const checkBackendStatus = async () => {
        try {
            const response = await makeAuthenticatedRequest('/ping');
            setPingStatus(response?.message || 'Backend conectado');
        } catch (error) {
            console.error("Erro ao conectar com o backend:", error);
            setPingStatus('❌ Backend indisponível (Erro de rede/CORS)');
        }
    };

    // Executa o ping na montagem do componente
    useEffect(() => {
        checkBackendStatus();
    }, [makeAuthenticatedRequest]);

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <Loader className="animate-spin" size={48} />
                <div>Verificando autenticação...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    function EditarFamiliaWrapper(props) {
        const { id } = useParams();
        return <EditarFamilia familiaId={id} {...props} />;
    }

    return (
        <>
            <Nav />
            <main>
                <Routes>
                    <Route path="/" element={<Home pingStatus={pingStatus} />} />
                    <Route path="/consulta" element={<ConsultaGeral />} />
                    
                    {/* Rotas protegidas para criação/edição */}
                    <Route 
                        path="/cadastro" 
                        element={
                            <ProtectedRoute requiredRoles={['monitor', 'coordenador', 'admin']}>
                                <CadastroFamilia />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/cadastro-monitor" 
                        element={
                            <ProtectedRoute requiredRoles={['coordenador', 'admin']}>
                                <CadastroMonitor />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/monitores" 
                        element={
                            <ProtectedRoute requiredRoles={['coordenador', 'admin']}>
                                <ListaMonitores />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Rotas de visualização */}
                    <Route path="/lista-familias" element={<ListaFamilias />} />
                    <Route 
                        path="/editar-familia/:id" 
                        element={
                            <ProtectedRoute requiredRoles={['monitor', 'coordenador', 'admin']}>
                                <EditarFamiliaWrapper />
                            </ProtectedRoute>
                        } 
                    />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
