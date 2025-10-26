import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";
import './Nav.css';

const Nav = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair?")) {
      await logout();
    }
  };
  
  return (
    <nav className="top-nav-container">
      <div className="nav-brand">
        <Link to="/" className="brand-link">CEPAS</Link>
      </div>
      
      <div className="nav-links">
        <Link to="/" className="top-nav-link">🏠 Início</Link>
        <Link to="/consulta" className="top-nav-link">📊 Consulta Geral</Link>
        <Link to="/lista-familias" className="top-nav-link">📋 Lista de Famílias</Link>
        <Link to="/cadastro" className="top-nav-link">💾 Cadastro Completo</Link>
        <Link to="/cadastro-monitor" className="top-nav-link">👤 Cadastro de Monitores</Link>
        <Link to="/monitores" className="top-nav-link">👥 Lista de Monitores</Link>
      </div>
      
      <div className="nav-user">
        <span className="user-info">
          {user?.nome_completo || user?.username || user?.email}
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Nav;