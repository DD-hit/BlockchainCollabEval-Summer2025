import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <h2>🔗 区块链协同开发系统</h2>
        </Link>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-item">
            📊 仪表板
          </Link>
          <Link to="/project/create" className="navbar-item">
            ➕ 创建项目
          </Link>
          
          <div className="navbar-user">
            <span className="user-info">
              👤 {user.username} ({user.address?.slice(0, 6)}...{user.address?.slice(-4)})
            </span>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;