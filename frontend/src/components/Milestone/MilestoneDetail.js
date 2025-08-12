import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SubtaskManagement from '../Subtask/SubtaskManagement';
import './MilestoneDetail.css';

const MilestoneDetail = ({ user }) => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId && milestoneId) {
      loadMilestoneData();
    }
  }, [projectId, milestoneId]);

  const loadMilestoneData = async () => {
    try {
      setLoading(true);
      
      // 并行加载里程碑详情和项目信息
      const [milestoneRes, projectRes] = await Promise.all([
        api.get(`/api/milestones/getMilestoneDetail/${milestoneId}`), // 修正路径
        api.get(`/api/projectManager/getProjectDetail/${projectId}`)  // 修正路径
      ]);

      if (milestoneRes.data.success) {
        setMilestone(milestoneRes.data.data);
      } else {
        setError('获取里程碑详情失败');
      }

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }
    } catch (error) {
      console.error('加载里程碑数据失败:', error);
      setError('加载里程碑数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': '#f59e0b',
      'active': '#00d4ff',
      'completed': '#10b981',
      'paused': '#ef4444'
    };
    return colors[status] || colors.planning;
  };

  const getStatusText = (status) => {
    const texts = {
      'planning': '规划中',
      'active': '进行中',
      'completed': '已完成',
      'paused': '已暂停'
    };
    return texts[status] || '规划中';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '未设置';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const calculateProgress = () => {
    // 这里可以根据子任务完成情况计算进度
    return milestone?.status === 'completed' ? 100 : 
           milestone?.status === 'active' ? 60 : 0;
  };

  if (loading) {
    return <div className="loading">加载里程碑详情...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!milestone) {
    return <div className="error">里程碑不存在</div>;
  }

  const isProjectOwner = project?.projectOwner === user.username;

  return (
    <div className="milestone-detail">
      {/* 里程碑头部 */}
      <div className="milestone-header">
        <div className="header-content">
          <div className="milestone-info">
            <div className="breadcrumb">
              <span 
                className="breadcrumb-item"
                onClick={() => navigate(`/project/${projectId}`)}
              >
                {project?.projectName}
              </span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">里程碑详情</span>
            </div>
            
            <div className="milestone-title-section">
              <div className="milestone-icon">🎯</div>
              <div>
                <h1 className="milestone-title">{milestone.title}</h1>
                <div className="milestone-badges">
                  <span 
                    className="status-badge" 
                    style={{ background: getStatusColor(milestone.status) }}
                  >
                    {getStatusText(milestone.status)}
                  </span>
                  <span className="date-badge">
                    {formatDate(milestone.startTime)} - {formatDate(milestone.endTime)}
                  </span>
                </div>
              </div>
            </div>
            
            {milestone.description && (
              <p className="milestone-description">{milestone.description}</p>
            )}
          </div>
          
          <div className="milestone-actions">
            <button 
              className="btn-secondary"
              onClick={() => navigate(`/project/${projectId}`)}
            >
              返回项目
            </button>
            {isProjectOwner && (
              <button className="btn-primary">
                编辑里程碑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 里程碑概览 */}
      <div className="milestone-overview">
        <div className="overview-grid">
          <div className="overview-card">
            <h3>📈 完成进度</h3>
            <div className="progress-section">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill-large"
                  style={{ 
                    width: `${calculateProgress()}%`,
                    background: getStatusColor(milestone.status)
                  }}
                ></div>
              </div>
              <div className="progress-text">{calculateProgress()}% 完成</div>
            </div>
          </div>

          <div className="overview-card">
            <h3>📊 任务统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">总任务</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">已完成</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">进行中</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">待开始</div>
              </div>
            </div>
          </div>

          <div className="overview-card">
            <h3>⏰ 时间信息</h3>
            <div className="time-info">
              <div className="time-item">
                <span className="time-label">开始时间:</span>
                <span className="time-value">{formatDate(milestone.startTime)}</span>
              </div>
              <div className="time-item">
                <span className="time-label">结束时间:</span>
                <span className="time-value">{formatDate(milestone.endTime)}</span>
              </div>
              <div className="time-item">
                <span className="time-label">创建时间:</span>
                <span className="time-value">{formatDate(milestone.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 子任务管理 */}
      <div className="subtask-section">
        <SubtaskManagement 
          projectId={projectId}
          milestoneId={milestoneId}
          user={user}
          isProjectOwner={isProjectOwner}
        />
      </div>
    </div>
  );
};

export default MilestoneDetail;
