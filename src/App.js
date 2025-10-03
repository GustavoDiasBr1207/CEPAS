import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// MANTENHA O CSS SE NECESSÁRIO
import './App.css'; 

// Importa os componentes de PÁGINA e o componente de NAVEGAÇÃO
import Nav from './components/Nav'; 
import ConsultaGeral from './pages/ConsultaGeral'; // Importa a página de Consulta final
import CadastroFamilia from './pages/CadastroFamilia'; // Importa a página de Cadastro

// Componente simples para a página inicial
const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Bem-vindo ao Sistema CEPAS!
      </h1>
      <p className="text-gray-600 mb-6">
        Use a navegação acima para acessar as funcionalidades de Cadastro e Consulta.
      </p>
      <Link 
        to="/consulta" 
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105"
      >
        Iniciar Consulta
      </Link>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="App">
        {/* Usa o componente Nav para a barra de navegação */}
        <Nav />

        {/* Definição das rotas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consulta" element={<ConsultaGeral />} />
          <Route path="/cadastro" element={<CadastroFamilia />} />
          <Route path="*" element={<h1 className="text-red-600 p-8 text-center">404 - Página não encontrada</h1>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
