import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: '🏠', 
      label: '首页', 
      key: 'dashboard',
      description: '待办事项与概览'
    },
    { 
      path: '/projects', 
      icon: '📁', 
      label: '项目管理', 
      key: 'projects',
      description: '项目概览与管理'
    },
    { 
      path: '/profile', 
      icon: '👤', 
      label: '个人中心', 
      key: 'profile',
      description: '个人信息管理'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">🚀</div>
        {!collapsed && <div className="brand-text">项目管理</div>}
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="nav-menu">
        {menuItems.map(item => (
          <div key={item.key} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && (
                <div>
                  <div className="nav-text">{item.label}</div>
                  <div className="nav-description">{item.description}</div>
                </div>
              )}
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
