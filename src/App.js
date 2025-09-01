import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Consulta from './components/Consulta';
import './App.css'; // Mantenha outros imports de CSS aqui

// Componente simples para a página inicial
const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Bem-vindo ao sistema de Consulta Oracle!
      </h1>
      <p className="text-gray-600 mb-6">
        Use a navegação acima para acessar as funcionalidades.
      </p>
      <Link 
        to="/consulta" 
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105"
      >
        Ir para a Consulta
      </Link>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="App">
        {/* Barra de navegação */}
        <nav className="bg-gray-800 p-4">
          <ul className="flex justify-center space-x-6 text-white font-medium">
            <li>
              <Link to="/" className="hover:text-gray-300 transition-colors">
                Início
              </Link>
            </li>
            <li>
              <Link to="/consulta" className="hover:text-gray-300 transition-colors">
                Consulta
              </Link>
            </li>
          </ul>
        </nav>

        {/* Definição das rotas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consulta" element={<Consulta />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
