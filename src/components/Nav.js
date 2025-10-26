import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";

/**
 * Componente de Navegação Principal (Nav.js)
 * Renderiza a barra superior de navegação com links para as rotas da aplicação.
 * Usa Tailwind CSS para estilização e controle de autenticação.
 */
const Nav = () => {
  const { user, logout, hasPermission } = useAuth();
  
  const linkClass = "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-800 hover:bg-green-100 hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 font-medium text-sm";
  const activeClass = "bg-green-100 text-green-900 shadow-md";

  // Função utilitária para determinar se o link está ativo
  const isLinkActive = (path) => {
    return window.location.pathname === path ? activeClass : "";
  };

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair?")) {
      await logout();
    }
  };
  
  return (
    <nav className="bg-gradient-to-r from-gray-50 to-blue-50 shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo à esquerda */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              CEPAS
            </Link>
          </div>
          
          {/* Links de navegação no centro */}
          <div className="flex items-center gap-3">
            <Link to="/" className={`${linkClass} ${isLinkActive('/')}`}>
              🏠 Início
            </Link>
            <Link to="/consulta" className={`${linkClass} ${isLinkActive('/consulta')}`}>
              📊 Consulta Geral
            </Link>
            <Link to="/lista-familias" className={`${linkClass} ${isLinkActive('/lista-familias')}`}>
              📋 Lista de Famílias
            </Link>
            <Link to="/cadastro" className={`${linkClass} ${isLinkActive('/cadastro')}`}>
              💾 Cadastro Completo
            </Link>
            <Link to="/cadastro-monitor" className={`${linkClass} ${isLinkActive('/cadastro-monitor')}`}>
              👤 Cadastro de Monitores
            </Link>
            <Link to="/monitores" className={`${linkClass} ${isLinkActive('/monitores')}`}>
              👥 Lista de Monitores
            </Link>
          </div>
          
          {/* Área do usuário à direita */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
              {user?.nome_completo || user?.username}
            </span>
            <button 
              onClick={handleLogout} 
              className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 hover:shadow-md"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;