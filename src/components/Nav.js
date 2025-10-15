import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de Navegação Principal (Nav.js)
 * Renderiza a barra superior de navegação com links para as rotas da aplicação.
 * Usa Tailwind CSS para estilização.
 */
const Nav = () => {
  const linkClass = "hover:text-blue-400 transition-colors p-2 rounded-lg";
  const activeClass = "bg-gray-700 text-blue-300 shadow-inner";

  // Função utilitária para determinar se o link está ativo (simples)
  const isLinkActive = (path) => {
    // Nota: Em um projeto real, você usaria o hook 'useLocation' para isso.
    // Aqui, faremos uma simplificação visual.
    return window.location.pathname === path ? activeClass : "text-white";
  };
  
  return (
    <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-10">
      <ul className="flex justify-center space-x-6 text-white font-medium">
        <li>
          <Link to="/" className={`${linkClass} ${isLinkActive('/')}`}>
            🏠 Início
          </Link>
        </li>
        <li>
          <Link to="/consulta" className={`${linkClass} ${isLinkActive('/consulta')}`}>
            📊 Consulta (Famílias)
          </Link>
        </li>
        <li>
          <Link to="/cadastro" className={`${linkClass} ${isLinkActive('/cadastro')}`}>
            ➕ Cadastrar Família
          </Link>
        </li>
        <li>
          <Link to="/consulta-avancada" className={`${linkClass} ${isLinkActive('/consulta-avancada')}`}>
            ⚙️ Consulta Dinâmica
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
