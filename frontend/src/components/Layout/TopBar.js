import React, { useState, useRef, useEffect } from 'react';
import './TopBar.css';

const TopBar = ({ user, currentProject, onProjectChange, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const userMenuRef = useRef(null);
  const projectMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const projects = [
    { id: 1, name: '区块链投票系统', status: 'active', progress: 75 },
    { id: 2, name: '智能合约审计工具', status: 'active', progress: 45 },
    { id: 3, name: 'DeFi 借贷平台', status: 'planning', progress: 20 },
    { id: 4, name: 'NFT 交易市场', status: 'completed', progress: 100 }
  ];

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
        setShowProjectMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {/* 项目选择器 */}
        <div className="project-selector" ref={projectMenuRef}>
          <div 
            className="current-project"
            onClick={() => setShowProjectMenu(!showProjectMenu)}
          >
            <div className="project-info">
              <h4>{currentProject.name}</h4>
              <p>{currentProject.description}</p>
            </div>
            <span>▼</span>
          </div>
          
          {showProjectMenu && (
            <div className="project-dropdown">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className="project-option"
                  onClick={() => {
                    onProjectChange(project);
                    setShowProjectMenu(false);
                  }}
                >
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p>进度: {project.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 搜索栏 */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索项目、任务、成员..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="top-bar-right">
        {/* 通知按钮 */}
        <div className="notification-btn" ref={notificationRef}>
          <span>🔔</span>
          <span className="notification-badge"></span>
        </div>

        {/* 用户菜单 */}
        <div className="user-menu" ref={userMenuRef}>
          <div 
            className="user-avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="avatar-circle">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <h4>{user.username}</h4>
              <p>{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
            </div>
            <span>▼</span>
          </div>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-item">
                <span>👤</span>
                个人资料
              </div>
              <div className="dropdown-item">
                <span>⚙️</span>
                设置
              </div>
              <div className="dropdown-item">
                <span>💰</span>
                钱包
              </div>
              <div className="dropdown-item logout" onClick={onLogout}>
                <span>🚪</span>
                退出登录
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;

