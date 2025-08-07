import React, { useState, useEffect, useRef } from 'react';
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
  const wsRef = useRef(null); // 全局WebSocket引用

  // 建立WebSocket连接
  const connectWebSocket = () => {
    // 如果已有连接，不重复建立
    if (wsRef.current) {
      console.log('🔌 WebSocket连接已存在，跳过建立');
      return;
    }
    
    console.log('🔌 开始建立WebSocket连接...');
    const ws = new WebSocket('ws://localhost:5000');
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('🔌 WebSocket连接已建立');
      const username = sessionStorage.getItem('username');
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket连接已建立',
        username: username, // 发送用户名给后端
        timestamp: Date.now()
      }));
      
      // 开始发送心跳包
      startHeartbeat(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 收到WebSocket消息:', message);
        
        if (message.type === 'connection_ack') {
          console.log('✅ 连接确认收到:', message.message);
        } else if (message.type === 'pong') {
          console.log('💓 收到心跳响应:', message.timestamp);
        }
      } catch (error) {
        console.error('❌ WebSocket消息解析错误:', error);
      }
    };
    
    ws.onclose = async (event) => {
      console.log('🔌 WebSocket连接已关闭', event.code, event.reason);
      wsRef.current = null; // 清空引用
      
      // 停止心跳包
      stopHeartbeat();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket连接错误:', error);
    };
  };

  // 心跳包定时器引用
  const heartbeatRef = useRef(null);

  // 开始发送心跳包
  const startHeartbeat = (ws) => {
    // 清除可能存在的旧定时器
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    // 每3秒发送一次心跳包
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('💓 发送心跳包');
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 3000); // 3秒
  };

  // 停止心跳包
  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      console.log('💓 停止心跳包');
    }
  };

  useEffect(() => {
    // 检查本地存储中的用户信息
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username');
    const address = sessionStorage.getItem('address');
    
    if (token && username && address) {
      setUser({ token, username, address });
      // 如果用户已登录，建立WebSocket连接
      connectWebSocket();
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (userData) => {
    setUser(userData);
    // 登录成功后建立WebSocket连接
    connectWebSocket();
  };

  const handleLogout = () => {
    console.log('🚪 开始登出');
    
    // 停止心跳包
    stopHeartbeat();
    
    // 关闭WebSocket连接
    if (wsRef.current) {
      console.log('🔌 登出时关闭WebSocket连接');
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // 清除前端会话数据
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('address');
    setUser(null);
    console.log('🧹 前端会话已清除');
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

