import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectAPI } from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getMyProjects();
      
      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        setError(response.data.message || '获取项目列表失败');
      }
    } catch (error) {
      console.error('加载项目失败:', error);
      setError('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const getProjectIcon = (projectName) => {
    if (projectName.includes('区块链') || projectName.includes('智能合约')) return '⛓️';
    if (projectName.includes('投票')) return '🗳️';
    if (projectName.includes('DeFi') || projectName.includes('借贷')) return '💰';
    if (projectName.includes('NFT')) return '🎨';
    if (projectName.includes('交易')) return '💱';
    return '🚀';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#48bb78';
      case 'completed': return '#38a169';
      case 'planning': return '#ed8936';
      case 'paused': return '#718096';
      default: return '#4299e1';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载项目中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>❌ 加载失败</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadProjects}>
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">项目管理</h1>
            <p className="page-subtitle">管理您的所有项目</p>
          </div>
          <div className="view-controls">
            <span className="results-count">共 {projects.length} 个项目</span>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/project/create')}
            >
              + 创建项目
            </button>
          </div>
        </div>
      </div>
      
      <div className={`projects-container ${viewMode}`}>
        {projects.length > 0 ? (
          projects.map(project => (
            <div key={project.projectId} className="project-card">
              <Link to={`/project/${project.projectId}`} className="project-link">
                <div 
                  className="project-cover"
                  style={{ background: `linear-gradient(135deg, ${getStatusColor('active')} 0%, ${getStatusColor('active')}88 100%)` }}
                >
                  <div className="cover-overlay">
                    <div className="project-badges">
                      <span className="status-badge" style={{ background: getStatusColor('active') }}>
                        进行中
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '48px', color: 'white' }}>
                    {getProjectIcon(project.projectName)}
                  </div>
                </div>
                
                <div className="project-info">
                  <h3 className="project-name">{project.projectName}</h3>
                  <div className="project-meta">
                    <span>�� {new Date(project.startTime || Date.now()).toLocaleDateString()}</span>
                    <span>👤 {project.projectOwner || user?.username || '未知'}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>项目进度</span>
                      <span>0%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: '0%',
                          background: getStatusColor('active')
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="tech-tags">
                    <span className="tech-tag">项目管理</span>
                    <span className="tech-tag">协同开发</span>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>暂无项目</h3>
            <p>开始创建您的第一个项目吧！</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/project/create')}
            >
              创建项目
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

