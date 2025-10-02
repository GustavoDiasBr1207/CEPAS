/* global __firebase_config, __initial_auth_token, __app_id */
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

// Ativar logging do Firestore para debug
setLogLevel('Debug');

// Configurações e Variáveis Globais (injetadas pelo ambiente)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// CORREÇÃO CRÍTICA DO FIREBASE:
// O __app_id pode vir com barras ou pontos (ex: "id_do_app/src/App.js"), o que quebra a referência do Firestore.
// Normalizamos o ID para garantir que ele seja um único segmento de documento.
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/\//g, '-').replace(/\./g, '_');

// Ícones SVG para melhor estética
const HomeIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const UsersIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const MonitorIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog"><circle cx="18" cy="15" r="3"/><path d="M20.9 19.8a2 2 0 0 0 0-3.6"/><path d="M12.92 10C12.92 7.8 11.12 6 8.92 6S4.92 7.8 4.92 10"/><path d="M2 21a8 8 0 0 1 12.91-6.73"/></svg>);
const ListIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>);

// --- Componentes Reutilizáveis ---
const NavButton = ({ title, icon: Icon, onClick, isActive }) => (
    <li>
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{title}</span>
        </button>
    </li>
);

// Componente simples para a página inicial
const Home = ({ setCurrentView }) => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] bg-gray-50 p-4">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl text-center border-t-4 border-indigo-500 max-w-2xl w-full animate-fadeIn">
            <HomeIcon className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Portal **CEPAS** {/* Título ajustado para corresponder ao app.test.js */}</h1>
            <p className="text-lg text-gray-600 mb-10">Utilize os botões abaixo ou o menu superior para navegar entre os módulos de cadastro e consulta.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <button
                    onClick={() => setCurrentView('CadastroFamilia')}
                    className="w-full inline-flex flex-col items-center justify-center bg-green-500 text-white px-6 py-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:bg-green-600 hover:shadow-xl transform hover:scale-[1.03]"
                >
                    <UsersIcon className="w-8 h-8 mb-2" />
                    Cadastrar Família
                </button>
                <button
                    onClick={() => setCurrentView('CadastroMonitor')}
                    className="w-full inline-flex flex-col items-center justify-center bg-yellow-500 text-gray-900 px-6 py-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:bg-yellow-600 hover:shadow-xl transform hover:scale-[1.03]"
                >
                    <MonitorIcon className="w-8 h-8 mb-2" />
                    Cadastrar Monitor
                </button>
                <button
                    onClick={() => setCurrentView('Consulta')}
                    className="w-full inline-flex flex-col items-center justify-center bg-indigo-500 text-white px-6 py-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 hover:bg-indigo-600 hover:shadow-xl transform hover:scale-[1.03]"
                >
                    <ListIcon className="w-8 h-8 mb-2" />
                    Acessar Consulta
                </button>
            </div>
        </div>
    </div>
);

// Componente de Cadastro de Monitor
const CadastroMonitor = ({ db, userId }) => {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');
    const [mensagem, setMensagem] = useState('');

    const handleCadastro = useCallback(async (e) => {
        e.preventDefault();
        setMensagem('');

        if (senha !== confirmaSenha) {
            setMensagem('Erro: A senha e a confirmação de senha não coincidem.');
            return;
        }

        if (!db || !userId) {
            setMensagem('Erro: O Firebase ainda não está pronto ou o usuário não está autenticado.');
            return;
        }

        const monitorData = {
            nomeCompleto,
            email,
            telefone,
            senhaPura: senha, // Nota: Senhas NUNCA devem ser salvas sem hash em produção. Aqui, é um placeholder.
            created_at: new Date().toISOString(),
            usuario_responsavel: userId,
        };

        try {
            // Caminho corrigido pelo appId normalizado
            const monitorRef = doc(db, `artifacts/${appId}/users/${userId}/monitores`, email);
            await setDoc(monitorRef, monitorData);
            setMensagem('Monitor cadastrado com sucesso!');
            setNomeCompleto('');
            setEmail('');
            setTelefone('');
            setSenha('');
            setConfirmaSenha('');
        } catch (error) {
            console.error('Erro ao cadastrar monitor:', error);
            setMensagem(`Erro ao cadastrar monitor: ${error.message}`);
        }
    }, [nomeCompleto, email, telefone, senha, confirmaSenha, db, userId]);

    return (
        <div className="p-8 bg-white shadow-2xl rounded-2xl border-t-4 border-yellow-500 max-w-3xl mx-auto my-8 animate-fadeIn">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                <MonitorIcon className="w-8 h-8 text-yellow-600 mr-3" /> Cadastro de Monitor
            </h2>
            <form onSubmit={handleCadastro} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            id="nome"
                            type="text"
                            value={nomeCompleto}
                            onChange={(e) => setNomeCompleto(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input
                        id="telefone"
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            id="senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmaSenha" className="block text-sm font-medium text-gray-700">Confirme a Senha</label>
                        <input
                            id="confirmaSenha"
                            type="password"
                            value={confirmaSenha}
                            onChange={(e) => setConfirmaSenha(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-xl text-lg font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 transform hover:scale-[1.01]"
                >
                    Cadastrar Monitor
                </button>
            </form>

            {mensagem && (
                <div
                    className={`mt-6 text-center font-semibold p-4 rounded-xl shadow-inner ${mensagem.startsWith('Erro') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}
                >
                    {mensagem}
                </div>
            )}
        </div>
    );
};

// Componente de Cadastro de Família (Aba Família)
const CadastroFamilia = ({ db, userId }) => {
    const [idFamilia, setIdFamilia] = useState('');
    const [nomeFamilia, setNomeFamilia] = useState('');
    const [migracao, setMigracao] = useState('Não');
    const [estadoOrigem, setEstadoOrigem] = useState('');
    const [cidadeOrigem, setCidadeOrigem] = useState('');
    const [recebeBeneficio, setRecebeBeneficio] = useState('Não');
    const [possuiPlanoSaude, setPossuiPlanoSaude] = useState('Não');
    const [observacoes, setObservacoes] = useState('');
    const [mensagem, setMensagem] = useState('');

    const handleCadastro = useCallback(async (e) => {
        e.preventDefault();
        setMensagem('');

        if (!db || !userId) {
            setMensagem('Erro: O Firebase ainda não está pronto ou o usuário não está autenticado.');
            return;
        }

        const data = {
            id_familia: idFamilia,
            nome_familia: nomeFamilia,
            migracao,
            recebe_beneficio: recebeBeneficio,
            possui_plano_saudeconvenio: possuiPlanoSaude,
            observacoes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            usuario_responsavel: userId,
        };

        // Adiciona campos de origem apenas se houver migração
        if (migracao === 'Sim') {
            data.estado_origem = estadoOrigem;
            data.cidade_origem = cidadeOrigem;
        }

        try {
            // Caminho corrigido pelo appId normalizado
            const familiaRef = doc(db, `artifacts/${appId}/users/${userId}/familias`, idFamilia);
            await setDoc(familiaRef, data);
            setMensagem('Família cadastrada com sucesso!');

            // Limpa o formulário
            setIdFamilia('');
            setNomeFamilia('');
            setMigracao('Não');
            setEstadoOrigem('');
            setCidadeOrigem('');
            setRecebeBeneficio('Não');
            setPossuiPlanoSaude('Não');
            setObservacoes('');

        } catch (error) {
            console.error('Erro ao cadastrar família:', error);
            setMensagem(`Erro ao cadastrar família: ${error.message}`);
        }
    }, [idFamilia, nomeFamilia, migracao, estadoOrigem, cidadeOrigem, recebeBeneficio, possuiPlanoSaude, observacoes, db, userId]);

    return (
        <div className="p-8 bg-white shadow-2xl rounded-2xl border-t-4 border-green-500 max-w-4xl mx-auto my-8 animate-fadeIn">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                <UsersIcon className="w-8 h-8 text-green-600 mr-3" /> Cadastro de Família
            </h2>
            <form onSubmit={handleCadastro} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="id_familia" className="block text-sm font-medium text-gray-700">ID Família (Chave Única)</label>
                        <input
                            id="id_familia"
                            type="text"
                            value={idFamilia}
                            onChange={(e) => setIdFamilia(e.target.value)}
                            placeholder="Ex: FML-001"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="nome_familia" className="block text-sm font-medium text-gray-700">Nome Família/Responsável</label>
                        <input
                            id="nome_familia"
                            type="text"
                            value={nomeFamilia}
                            onChange={(e) => setNomeFamilia(e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="migracao" className="block text-sm font-medium text-gray-700">Família Migrou?</label>
                        <select
                            id="migracao"
                            value={migracao}
                            onChange={(e) => setMigracao(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                        >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                        </select>
                    </div>

                    <div className={migracao === 'Sim' ? 'block' : 'hidden'}>
                        <label htmlFor="estado_origem" className="block text-sm font-medium text-gray-700">Estado de Origem</label>
                        <input
                            id="estado_origem"
                            type="text"
                            value={estadoOrigem}
                            onChange={(e) => setEstadoOrigem(e.target.value)}
                            placeholder="Ex: Minas Gerais"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required={migracao === 'Sim'}
                        />
                    </div>

                    <div className={migracao === 'Sim' ? 'block' : 'hidden'}>
                        <label htmlFor="cidade_origem" className="block text-sm font-medium text-gray-700">Cidade de Origem</label>
                        <input
                            id="cidade_origem"
                            type="text"
                            value={cidadeOrigem}
                            onChange={(e) => setCidadeOrigem(e.target.value)}
                            placeholder="Ex: Belo Horizonte"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition-colors"
                            required={migracao === 'Sim'}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="beneficio" className="block text-sm font-medium text-gray-700">Recebe Benefício Social?</label>
                        <select
                            id="beneficio"
                            value={recebeBeneficio}
                            onChange={(e) => setRecebeBeneficio(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                        >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="plano_saude" className="block text-sm font-medium text-gray-700">Possui Plano de Saúde/Convênio?</label>
                        <select
                            id="plano_saude"
                            value={possuiPlanoSaude}
                            onChange={(e) => setPossuiPlanoSaude(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                        >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações Adicionais</label>
                    <textarea
                        id="observacoes"
                        rows="3"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informações relevantes sobre a família, necessidades especiais, etc."
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-xl text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-[1.01]"
                >
                    Salvar Cadastro da Família
                </button>
            </form>

            {mensagem && (
                <div
                    className={`mt-6 text-center font-semibold p-4 rounded-xl shadow-inner ${mensagem.startsWith('Erro') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}
                >
                    {mensagem}
                </div>
            )}
        </div>
    );
};

// Componente de Consulta
const Consulta = ({ familias, monitores, isAuthReady, connectionError, checkBackendStatus }) => {
    // Simula a tentativa de conexão (que agora é disparada periodicamente pelo App principal)
    if (connectionError) {
        return (
            <div className="p-8 bg-white shadow-2xl rounded-2xl border-t-4 border-red-500 max-w-4xl mx-auto my-8">
                <h2 className="text-3xl font-bold text-red-700 mb-4 flex items-center">
                    <ListIcon className="w-8 h-8 text-red-600 mr-3" /> Status do Backend (Oracle)
                </h2>
                <p className="text-lg text-gray-600">Não foi possível verificar a conexão com o backend (Oracle).</p>
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-300">
                    <p className="font-semibold text-red-800 mb-2">Possíveis Causas:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        <li>O serviço `cepas-backend` não está ativo ou a porta `3001` não está escutando.</li>
                        <li>A rota de status (`/api/status`) não existe ou retornou um erro (ex: 404).</li>
                        <li>O backend está ativo, mas não conseguiu conectar ao banco de dados Oracle (verifique as logs).</li>
                    </ul>
                </div>
                <button
                    onClick={checkBackendStatus}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Tentar Novamente
                </button>
                <code className="block mt-4 p-3 bg-gray-100 rounded-lg text-sm font-mono text-gray-700">docker compose logs cepas-backend</code>
            </div>
        );
    }

    if (!isAuthReady) {
        return (
            <div className="p-8 bg-white shadow-2xl rounded-2xl border-t-4 border-indigo-500 max-w-xl mx-auto my-8 text-center">
                <p className="text-lg text-gray-600">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10">
            <div className="bg-white p-8 shadow-2xl rounded-2xl border-t-4 border-indigo-500 animate-fadeIn">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                    <ListIcon className="w-8 h-8 text-indigo-600 mr-3" /> Famílias Cadastradas ({familias.length})
                </h2>
                {familias.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhuma família encontrada. Cadastre uma para começar.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">ID Família</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Migrou</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Plano Saúde</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {familias.map(f => (
                                    <tr key={f.id_familia} className="hover:bg-indigo-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.id_familia}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{f.nome_familia}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${f.migracao === 'Sim' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                {f.migracao}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{f.possui_plano_saudeconvenio}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white p-8 shadow-2xl rounded-2xl border-t-4 border-yellow-500 animate-fadeIn">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                    <MonitorIcon className="w-8 h-8 text-yellow-600 mr-3" /> Monitores Cadastrados ({monitores.length})
                </h2>
                {monitores.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhum monitor encontrado.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Nome Completo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Telefone</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {monitores.map(m => (
                                    <tr key={m.email} className="hover:bg-yellow-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.nomeCompleto}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.telefone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Componente Principal (App) ---
const App = () => {
    const [currentView, setCurrentView] = useState('Home');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [familias, setFamilias] = useState([]);
    const [monitores, setMonitores] = useState([]);
    const [connectionError, setConnectionError] = useState(false);

    // 1. Inicialização do Firebase e Autenticação
    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing.");
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            setDb(firestore);
            setAuth(authInstance);

            // Tenta autenticar
            onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Tenta login com token inicial ou anonimamente
                    try {
                        if (initialAuthToken) {
                            const userCredential = await signInWithCustomToken(authInstance, initialAuthToken);
                            setUserId(userCredential.user.uid);
                        } else {
                            const userCredential = await signInAnonymously(authInstance);
                            setUserId(userCredential.user.uid);
                        }
                    } catch (error) {
                        console.error("Erro na autenticação:", error);
                        // Se falhar, usa um ID anônimo temporário
                        setUserId(crypto.randomUUID());
                    }
                }
                // Garante que o estado de autenticação seja marcado como pronto
                setIsAuthReady(true);
            });
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
            // Se o Firebase falhar na inicialização, marca como pronto para mostrar o erro de forma apropriada
            setIsAuthReady(true);
        }
    }, []);

    // CORREÇÃO: Função de checagem de status ajustada para a rota /api/status (padrão comum) e
    // melhor tratamento de erros de conexão e 404
    const checkBackendStatus = useCallback(async () => {
        // Implementar lógica de backoff de forma robusta aqui
        const BACKEND_URL = 'http://localhost:3001';
        const STATUS_ENDPOINT = '/api/status';

        try {
            // Tentamos acessar a rota de status do backend (mudando para /api/status)
            const response = await fetch(BACKEND_URL + STATUS_ENDPOINT);

            if (response.status === 200) {
                const data = await response.json();
                if (data.status === 'OK' && data.db_status === 'connected') {
                    setConnectionError(false); // Conectado com sucesso ao Oracle
                } else {
                    setConnectionError(true); // Backend rodando, mas DB não (Erro interno do backend)
                    console.error("Backend está OK, mas falhou ao conectar ao Oracle (DB Status: " + data.db_status + ")");
                }
            } else if (response.status === 404) {
                setConnectionError(true);
                console.error("Backend rodando, mas a rota " + STATUS_ENDPOINT + " não foi encontrada (404). Verifique a implementação do backend.");
            } else {
                setConnectionError(true); // Backend retornou um código diferente de 200 (e não 404)
                console.error("Backend retornou um código de status inesperado: " + response.status);
            }
        } catch (error) {
            // Se o fetch falhar totalmente (problema de rede/container), é o problema de "tentar conectar"
            setConnectionError(true);
            console.error("Erro de conexão total com o backend (porta 3001). Possivelmente container travado/falho.", error);
        }
    }, []);

    // 2. Carregamento de Dados (Famílias e Monitores) via Firestore
    useEffect(() => {
        if (db && userId) {
            // Inicia a verificação de status do backend
            checkBackendStatus();

            // Listener para Famílias
            const familiasColRef = collection(db, `artifacts/${appId}/users/${userId}/familias`);
            const qFamilias = query(familiasColRef);
            const unsubscribeFamilias = onSnapshot(qFamilias, (snapshot) => {
                const loadedFamilias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFamilias(loadedFamilias);
            }, (error) => {
                console.error("Erro ao carregar Famílias:", error);
            });

            // Listener para Monitores
            const monitoresColRef = collection(db, `artifacts/${appId}/users/${userId}/monitores`);
            const qMonitores = query(monitoresColRef);
            const unsubscribeMonitores = onSnapshot(qMonitores, (snapshot) => {
                const loadedMonitores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMonitores(loadedMonitores);
            }, (error) => {
                console.error("Erro ao carregar Monitores:", error);
            });

            // O timer garante que a verificação de status do backend seja periódica
            const intervalId = setInterval(checkBackendStatus, 10000); // Verifica a cada 10 segundos

            // Limpeza na desmontagem
            return () => {
                unsubscribeFamilias();
                unsubscribeMonitores();
                clearInterval(intervalId);
            };
        }
    }, [db, userId, checkBackendStatus]);

    const renderContent = () => {
        const props = { db, auth, userId, isAuthReady, familias, monitores, connectionError, checkBackendStatus };

        // Exibe um loading state enquanto a autenticação não estiver pronta
        if (!isAuthReady) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[80vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
                    <p className="ml-4 mt-4 text-xl text-gray-600">Autenticando e carregando dados...</p>
                </div>
            );
        }

        switch (currentView) {
            case 'CadastroMonitor':
                return <CadastroMonitor {...props} />;
            case 'CadastroFamilia':
                return <CadastroFamilia {...props} />;
            case 'Consulta':
                return <Consulta {...props} />;
            case 'Home':
            default:
                return <Home setCurrentView={setCurrentView} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-gray-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <MonitorIcon className="w-6 h-6 text-indigo-400 mr-2" />
                            <span className="text-xl font-bold text-white tracking-wider">CEPAS</span>
                        </div>
                        <nav>
                            {/* CORREÇÃO DO LAYOUT: Adicionando list-none para garantir que os bullet points sumam */}
                            <ul className="flex space-x-2 list-none p-0 m-0">
                                <NavButton title="Início" icon={HomeIcon} onClick={() => setCurrentView('Home')} isActive={currentView === 'Home'} />
                                <NavButton title="Cad. Família" icon={UsersIcon} onClick={() => setCurrentView('CadastroFamilia')} isActive={currentView === 'CadastroFamilia'} />
                                <NavButton title="Cad. Monitor" icon={MonitorIcon} onClick={() => setCurrentView('CadastroMonitor')} isActive={currentView === 'CadastroMonitor'} />
                                <NavButton title="Consulta" icon={ListIcon} onClick={() => setCurrentView('Consulta')} isActive={currentView === 'Consulta'} />
                            </ul>
                        </nav>
                        <div className="text-sm text-gray-400 hidden md:block">User ID: <span className="font-mono text-xs">{userId || 'Anônimo'}</span></div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {renderContent()}
            </main>

            <style jsx="true">{`
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default App;
