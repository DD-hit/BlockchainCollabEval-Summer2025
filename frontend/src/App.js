import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { accountAPI } from './utils/api';

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
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username');
    const address = sessionStorage.getItem('address');
    
    if (token && username && address) {
      setUser({ token, username, address });
    }
    setLoading(false);
  }, []);

  // 页面卸载时通知后端用户离线
  useEffect(() => {
    const handleBeforeUnload = () => {
      const username = sessionStorage.getItem('username');
      const token = sessionStorage.getItem('token');
      
      console.log('🔄 页面即将卸载');
      console.log('👤 用户名:', username);
      console.log('🔑 Token存在:', !!token);
      
      if (username && token) {
        try {
          // 使用 sendBeacon API 确保在页面卸载时也能发送请求
          const data = JSON.stringify({ username });
          const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/accounts/logout`;
          console.log('📤 页面卸载，发送logout请求到:', url);
          console.log('📦 发送数据:', data);
          
          // 创建Blob对象，确保正确的Content-Type
          const blob = new Blob([data], { type: 'application/json' });
          const success = navigator.sendBeacon(url, blob);
          console.log('📡 sendBeacon发送结果:', success);
        } catch (error) {
          console.error('❌ 页面卸载通知失败:', error);
        }
      } else {
        console.log('⚠️ 用户名或token不存在，跳过logout通知');
      }
    };

    // 监听页面卸载事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      // 获取用户名，用于token过期时的logout调用
      const username = sessionStorage.getItem('username');
      console.log('🚪 开始登出，用户名:', username);
      
      // 调用后端logout接口，通知后端更新用户状态为离线
      const response = await accountAPI.logout(username);
      console.log('📡 登出API响应:', response);
      console.log('✅ 登出成功，已通知后端更新用户状态');
    } catch (error) {
      console.error('❌ 登出通知失败:', error);
      // 即使后端通知失败，也要清除前端会话
    } finally {
      // 清除前端会话数据
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('address');
      setUser(null);
      console.log('🧹 前端会话已清除');
    }
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

