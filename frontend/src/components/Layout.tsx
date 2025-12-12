import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>WATT</h1>
          <p>Web App Test Tool</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <span className="icon">📊</span>
            Dashboard
          </Link>
          <Link to="/suites" className="nav-item">
            <span className="icon">📋</span>
            Test Suites
          </Link>
          <Link to="/executions" className="nav-item">
            <span className="icon">▶️</span>
            Executions
          </Link>
          <Link to="/environments" className="nav-item">
            <span className="icon">🌍</span>
            Environments
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-email">{user?.email}</div>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
