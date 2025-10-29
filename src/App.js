import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
// Importa ícones necessários para o componente Consulta e Cadastro
import { Loader, Save, Clipboard, User } from 'lucide-react';
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
import { API_BASE_URL } from './config/api';

// ------------------------------------
// 1. Componentes de Página
// ------------------------------------

/**
 * Componente de Consulta Dinâmica (GET)
 * Permite ao usuário buscar dados de qualquer tabela permitida.
 */
const Home = ({ pingStatus }) => {
        const { hasPermission } = useAuth();
        const statusColor = pingStatus && pingStatus.startsWith('✅') ? 'text-green-700' : (pingStatus && pingStatus.startsWith('❌') ? 'text-red-700' : 'text-yellow-700');
    const cards = [
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
                <div className="home-hero">
                    <div className="formulario-header">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Bem-vindo ao Sistema CEPAS!</h1>
                        <p className="text-gray-600 mt-2">Cadastre famílias e monitores, acompanhe visitas e gere listagens detalhadas.</p>
                        <div className={`mt-3 inline-block px-4 py-2 border rounded-lg font-semibold ${statusColor} bg-white/80 home-status`}>Status do Backend: <span className="font-bold">{pingStatus}</span></div>
                    </div>
                </div>

                <section className="cards-section home-cards">
                    <div className="cards-grid">
                        {visibleCards.map((card) => (
                            <Link key={card.to} to={card.to} className="card-link">
                                <div className="card" style={{ ['--card-color']: card.color }}>
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
                    {/* Rota /consulta removida */}
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
