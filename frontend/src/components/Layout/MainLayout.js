import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

const MainLayout = ({ user, onLogout, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentProject, setCurrentProject] = useState({
    id: 1,
    name: '区块链投票系统',
    description: '基于以太坊的去中心化投票平台'
  });

  return (
    <div className="main-layout">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar 
          user={user}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
          onLogout={onLogout}
        />
        <div className="work-area">
          {children ? children : <Outlet context={{ currentProject, setCurrentProject }} />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;



