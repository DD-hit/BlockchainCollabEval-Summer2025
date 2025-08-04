import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, milestoneAPI, subtaskAPI } from '../../utils/api';
import './ProjectDetail.css';

const ProjectDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, milestonesRes] = await Promise.all([
        projectAPI.getProjectDetail(id),
        milestoneAPI.getMilestoneList(id)
      ]);

      if (projectRes.data && projectRes.data.success) {
        setProject(projectRes.data.data);
      } else {
        setError('获取项目详情失败');
      }

      if (milestonesRes.data && milestonesRes.data.success) {
        const milestonesData = milestonesRes.data.data;
        setMilestones(milestonesData);
        
        // 加载所有里程碑的任务
        const allTasks = [];
        for (const milestone of milestonesData) {
          try {
            const tasksRes = await subtaskAPI.getSubtaskList(milestone.milestoneId);
            if (tasksRes.data.success) {
              allTasks.push(...tasksRes.data.data.map(task => ({
                ...task,
                milestoneName: milestone.title
              })));
            }
          } catch (error) {
            console.error(`加载里程碑 ${milestone.milestoneId} 的任务失败:`, error);
          }
        }
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getProjectIcon = (projectName) => {
    if (projectName?.includes('区块链') || projectName?.includes('智能合约')) return '⛓️';
    if (projectName?.includes('投票')) return '🗳️';
    if (projectName?.includes('DeFi') || projectName?.includes('借贷')) return '💰';
    if (projectName?.includes('NFT')) return '🎨';
    if (projectName?.includes('交易')) return '💱';
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

  const getTaskStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#48bb78';
      case 'in_progress': return '#4299e1';
      case 'pending': return '#ed8936';
      default: return '#718096';
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="project-detail-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载项目详情中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>❌ 加载失败</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadProjectData}>
          重试
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error-container">
        <h3>❌ 项目不存在</h3>
        <p>未找到指定的项目</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          返回项目列表
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail">
      {/* 项目头部 */}
      <div className="project-header">
        <div className="header-content">
          <div className="project-info">
            <div className="project-title-section">
              <div className="project-icon">
                {getProjectIcon(project.projectName)}
              </div>
              <div>
                <h1 className="project-title">{project.projectName}</h1>
                <div className="project-badges">
                  <span className="status-badge" style={{ background: getStatusColor(project.status || 'active') }}>
                    {project.status === 'active' ? '进行中' : 
                     project.status === 'completed' ? '已完成' : 
                     project.status === 'planning' ? '规划中' : '活跃'}
                  </span>
                  {project.blockchainType && (
                    <span className="blockchain-badge">{project.blockchainType}</span>
                  )}
                  {project.enableDAO && (
                    <span className="dao-badge">DAO</span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="project-description">{project.description}</p>
            
            <div className="project-meta">
              <div className="meta-item">
                <span className="meta-label">创建者</span>
                <span className="meta-value">👤 {project.projectOwner}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">创建时间</span>
                <span className="meta-value">📅 {new Date(project.createdAt || project.createTime).toLocaleDateString()}</span>
              </div>
              {project.startTime && (
                <div className="meta-item">
                  <span className="meta-label">开始时间</span>
                  <span className="meta-value">🚀 {new Date(project.startTime).toLocaleDateString()}</span>
                </div>
              )}
              {project.endTime && (
                <div className="meta-item">
                  <span className="meta-label">结束时间</span>
                  <span className="meta-value">🏁 {new Date(project.endTime).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="project-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${id}/milestones`)}
            >
              📋 里程碑管理
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${id}/tasks`)}
            >
              ✅ 任务管理
            </button>
            <button className="btn btn-primary">
              ⚙️ 项目设置
            </button>
          </div>
        </div>
      </div>

      {/* 进度统计 */}
      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{calculateProgress()}%</div>
            <div className="stat-label">总体进度</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{milestones.length}</div>
            <div className="stat-label">里程碑</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">任务总数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 概览
        </button>
        <button 
          className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          🎯 里程碑
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          ✅ 任务
        </button>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-grid">
              <div className="overview-section">
                <h3>📈 项目进度</h3>
                <div className="progress-chart">
                  <div className="progress-bar-large">
                    <div 
                      className="progress-fill-large"
                      style={{ 
                        width: `${calculateProgress()}%`,
                        background: getStatusColor(project.status || 'active')
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">{calculateProgress()}% 完成</div>
                </div>
              </div>
              
              <div className="overview-section">
                <h3>🎯 最近里程碑</h3>
                <div className="recent-milestones">
                  {milestones.slice(0, 3).map(milestone => (
                    <div key={milestone.milestoneId} className="milestone-item">
                      <div className="milestone-info">
                        <h4>{milestone.title}</h4>
                        <p>{milestone.description}</p>
                      </div>
                      <div className="milestone-date">
                        {new Date(milestone.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-content">
            <div className="milestones-header">
              <h3>项目里程碑</h3>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/project/${id}/milestones`)}
              >
                + 添加里程碑
              </button>
            </div>
            <div className="milestones-list">
              {milestones.map(milestone => (
                <div key={milestone.milestoneId} className="milestone-card">
                  <div className="milestone-header">
                    <h4>{milestone.title}</h4>
                    <span className="milestone-date">
                      📅 {new Date(milestone.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-tasks">
                    <span>任务: {tasks.filter(t => t.milestoneId === milestone.milestoneId).length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-content">
            <div className="tasks-header">
              <h3>项目任务</h3>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/project/${id}/tasks`)}
              >
                📋 任务看板
              </button>
            </div>
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.subtaskId} className="task-card">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span 
                      className="task-status"
                      style={{ background: getTaskStatusColor(task.status) }}
                    >
                      {task.status === 'completed' ? '已完成' :
                       task.status === 'in_progress' ? '进行中' :
                       task.status === 'pending' ? '待开始' : '未知'}
                    </span>
                  </div>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span>📋 {task.milestoneName}</span>
                    {task.endDate && (
                      <span>📅 {new Date(task.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;

