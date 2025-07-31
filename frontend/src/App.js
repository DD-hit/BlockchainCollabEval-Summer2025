import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// 组件导入
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectCreate from './components/Project/ProjectCreate';
import ProjectDetail from './components/Project/ProjectDetail';
import FileUpload from './components/Task/FileUpload';
import TaskAssignment from './components/Task/TaskAssignment';
import Navbar from './components/Layout/Navbar';

// 新增组件导入
import MilestoneList from './components/Milestone/MilestoneList';
import MilestoneForm from './components/Milestone/MilestoneForm';
import SubtaskList from './components/Subtask/SubtaskList';
import SubtaskForm from './components/Subtask/SubtaskForm';

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
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
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
          
          {/* 受保护的路由 */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/create" 
            element={user ? <ProjectCreate user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:id" 
            element={user ? <ProjectDetail user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/upload" 
            element={user ? <FileUpload user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/task/assign" 
            element={user ? <TaskAssignment user={user} /> : <Navigate to="/login" />} 
          />
          
          {/* 里程碑路由 */}
          <Route 
            path="/project/:projectId/milestones" 
            element={user ? <MilestoneList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/milestone/create" 
            element={user ? <MilestoneForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/milestone/:milestoneId/edit" 
            element={user ? <MilestoneForm isEdit={true} /> : <Navigate to="/login" />} 
          />
          
          {/* 子任务路由 */}
          <Route 
            path="/project/:projectId/milestone/:milestoneId/subtasks" 
            element={user ? <SubtaskList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/milestone/:milestoneId/subtask/create" 
            element={user ? <SubtaskForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/project/:projectId/milestone/:milestoneId/subtask/:subtaskId/edit" 
            element={user ? <SubtaskForm isEdit={true} /> : <Navigate to="/login" />} 
          />
          
          {/* 默认路由 */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

