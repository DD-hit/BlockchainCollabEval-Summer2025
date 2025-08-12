import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import TodoList from './TodoList';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 加载项目统计和最近项目
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/api/projectMembers/my-projects'),
        api.get('/api/subtasks/my-tasks')
      ]);

      if (projectsRes.data.success) {
        const projects = projectsRes.data.data;
        setRecentProjects(projects.slice(0, 5));
        setStats(prev => ({ ...prev, totalProjects: projects.length }));
      }

      if (tasksRes.data.success) {
        const tasks = tasksRes.data.data;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status !== 'completed').length;
        
        setStats(prev => ({
          ...prev,
          totalTasks: tasks.length,
          completedTasks: completed,
          pendingTasks: pending
        }));
      }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>欢迎回来，{user.username}！</h1>
        <p>这里是您的工作概览</p>
      </div>

      <div className="dashboard-grid">
        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalProjects}</h3>
              <p>参与项目</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.totalTasks}</h3>
              <p>总任务数</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completedTasks}</h3>
              <p>已完成</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats.pendingTasks}</h3>
              <p>待处理</p>
            </div>
          </div>
        </div>

        {/* 待办事项 */}
        <div className="dashboard-section">
          <TodoList user={user} />
        </div>

        {/* 最近项目 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>🚀 最近项目</h3>
            <Link to="/projects" className="view-all-btn">查看全部</Link>
          </div>
          
          <div className="recent-projects">
            {recentProjects.map(project => (
              <Link 
                key={project.id} 
                to={`/project/${project.id}`}
                className="project-card"
              >
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                <div className="project-meta">
                  <span className="project-role">{project.role}</span>
                  <span className="project-date">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
