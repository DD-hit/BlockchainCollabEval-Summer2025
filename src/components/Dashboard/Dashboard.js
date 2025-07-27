import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取项目数据
    setTimeout(() => {
      setProjects([
        {
          id: 1,
          name: '区块链投票系统',
          description: '基于以太坊的去中心化投票平台',
          status: '进行中',
          progress: 65,
          members: 4,
          tasks: 8,
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          name: '智能合约审计工具',
          description: '自动化智能合约安全审计系统',
          status: '已完成',
          progress: 100,
          members: 3,
          tasks: 12,
          createdAt: '2024-01-10'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>📊 项目仪表板</h1>
          <p>欢迎回来，{user.username}！</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>总项目数</h3>
            <div className="stat-number">{projects.length}</div>
          </div>
          <div className="stat-card">
            <h3>进行中项目</h3>
            <div className="stat-number">
              {projects.filter(p => p.status === '进行中').length}
            </div>
          </div>
          <div className="stat-card">
            <h3>已完成项目</h3>
            <div className="stat-number">
              {projects.filter(p => p.status === '已完成').length}
            </div>
          </div>
        </div>

        <div className="projects-section">
          <div className="section-header">
            <h2>我的项目</h2>
            <Link to="/project/create" className="btn btn-primary">
              ➕ 创建新项目
            </Link>
          </div>

          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <span className={`status-badge ${project.status}`}>
                    {project.status}
                  </span>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-stats">
                  <span>👥 {project.members} 成员</span>
                  <span>📋 {project.tasks} 任务</span>
                </div>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span>{project.progress}%</span>
                </div>
                <div className="project-actions">
                  <Link 
                    to={`/project/${project.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
