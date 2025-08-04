import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// 布局组件
import MainLayout from './components/Layout/MainLayout';

// 页面组件
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectCreate from './components/Project/ProjectCreate';
import ProjectDetail from './components/Project/ProjectDetail';
import MilestoneManagement from './components/Milestone/MilestoneManagement';
import MilestoneDetail from './components/Milestone/MilestoneDetail';
import TaskBoard from './components/Task/TaskBoard';
import MemberManagement from './components/Member/MemberManagement';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const address = localStorage.getItem('address');
    
    if (token && username && address) {
      setUser({ token, username, address });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('address');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">⏳ 加载中...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 公开路由 */}
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/dashboard" />} 
          />
          
          {/* 受保护的路由 - 直接传递组件作为 children */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/project/create" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <ProjectCreate user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/project/:id" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <ProjectDetail user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/project/:projectId/milestones" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <MilestoneManagement user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/milestone/:milestoneId" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <MilestoneDetail user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/project/:projectId/tasks" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <TaskBoard user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/members" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <MemberManagement user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/milestones" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <MilestoneManagement user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/tasks" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <TaskBoard user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/members" 
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <div>成员管理页面 - 开发中</div>
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

