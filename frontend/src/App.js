import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AntdMainLayout from './components/Layout/AntdMainLayout';
import AntdDashboard from './components/Dashboard/AntdDashboard';
import ProjectList from './components/Project/ProjectList';
import CreateProject from './components/Project/CreateProject';
import UserProfile from './components/Profile/UserProfile';
import MilestoneDetail from './components/Milestone/MilestoneDetail';
import 'antd/dist/reset.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      setUser({ username, token });
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" /> : <Register />} 
            />
            
            <Route 
              path="/*" 
              element={
                user ? (
                  <AntdMainLayout user={user} onLogout={handleLogout}>
                    <Routes>
                      <Route path="/dashboard" element={<AntdDashboard user={user} />} />
                      <Route path="/profile" element={<UserProfile user={user} />} />
                      <Route path="/projects" element={<ProjectList user={user} />} />
                      <Route path="/projects/create" element={<CreateProject user={user} />} />
                      <Route path="/milestones/:milestoneId" element={<MilestoneDetail user={user} />} />
                      <Route path="/projects/members" element={<div>成员管理页面</div>} />
                      <Route path="/projects/milestones" element={<div>里程碑页面</div>} />
                      <Route path="/projects/tasks" element={<div>子任务页面</div>} />
                      <Route path="/team" element={<div>团队协作页面</div>} />
                      <Route path="/docs" element={<div>文档中心页面</div>} />
                      <Route path="/storage" element={<div>数据存储页面</div>} />
                      <Route path="/analytics" element={<div>数据分析页面</div>} />
                      <Route path="/settings" element={<div>系统设置页面</div>} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </AntdMainLayout>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;