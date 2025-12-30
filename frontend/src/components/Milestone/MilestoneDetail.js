import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { milestoneAPI } from '../../utils/api';
import SubtaskManagement from '../Subtask/SubtaskManagement';
import { calculateMilestoneStatus, getStatusColor, getStatusText } from '../../utils/overdueUtils';
import './MilestoneDetail.css';

const MilestoneDetail = ({ user }) => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 编辑相关状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (projectId && milestoneId) {
      loadMilestoneData();
    }
  }, [projectId, milestoneId]);

  // 监听子任务状态变化，自动刷新里程碑数据
  useEffect(() => {

    
    const handleSubtaskChange = (event) => {
      
      // 只有当事件中的milestoneId匹配当前里程碑时才刷新
      if (event.detail.milestoneId == milestoneId) {
        loadMilestoneData();
      }
    };

    // 监听自定义事件
    window.addEventListener('subtaskStatusChanged', handleSubtaskChange);
    
    
    return () => {
      window.removeEventListener('subtaskStatusChanged', handleSubtaskChange);
      
    };
  }, [milestoneId]);

  const loadMilestoneData = async () => {
    try {
      setLoading(true);
      
      // 并行加载里程碑详情、项目信息和子任务列表
      const [milestoneRes, projectRes, subtasksRes] = await Promise.all([
        api.get(`/api/milestones/getMilestoneDetail/${milestoneId}`), // 修正路径
        api.get(`/api/projectManager/getProjectDetail/${projectId}`),  // 修正路径
        api.get(`/api/subtasks/getSubtaskList/${milestoneId}`)
      ]);

      if (milestoneRes.data.success) {
        const milestoneData = milestoneRes.data.data;
        setMilestone(milestoneData);
        // 初始化编辑表单
        setEditForm({
          title: milestoneData.title || '',
          description: milestoneData.description || '',
          startDate: milestoneData.startTime ? milestoneData.startTime.split(' ')[0] : '',
          endDate: milestoneData.endTime ? milestoneData.endTime.split(' ')[0] : '',
        });
      } else {
        setError('获取里程碑详情失败');
      }

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      let subtasksData = [];
      if (subtasksRes.data.success) {
        subtasksData = subtasksRes.data.data || [];
        setSubtasks(subtasksData);
      }

      // 根据子任务完成情况动态更新里程碑状态
      if (milestoneRes.data.success) {
        // 使用工具函数计算里程碑状态（包括没有子任务的情况）
        const actualStatus = calculateMilestoneStatus(milestoneRes.data.data, subtasksData);
        
        // 如果计算出的状态与数据库状态不一致，更新数据库
        if (actualStatus !== milestoneRes.data.data.status) {
          try {
            await milestoneAPI.updateStatus(milestoneId, actualStatus);
            // 更新本地状态
            setMilestone(prev => ({ ...prev, status: actualStatus }));
          } catch (updateError) {
            console.error(`更新里程碑 ${milestoneId} 状态失败:`, updateError);
          }
        }
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
      'in_progress': '#3b82f6',
      'completed': '#10b981',
      'overdue': '#ef4444'
    };
    return colors[status] || colors['in_progress'];
  };

  const getStatusText = (status) => {
    const texts = {
      'in_progress': '进行中',
      'completed': '已完成',
      'overdue': '已逾期'
    };
    return texts[status] || '进行中';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    try {
      // 处理MySQL时间戳格式
      let date;
      if (typeof dateString === 'number') {
        // 如果是时间戳数字
        date = new Date(dateString * 1000);
      } else {
        // 如果是字符串格式
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return '未设置';
      
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error, dateString);
      return '未设置';
    }
  };

  const calculateProgress = () => {
    // 根据子任务完成情况计算进度
    if (subtasks.length === 0) {
      // 如果没有子任务，根据里程碑状态返回默认进度
      if (milestone?.status === 'completed') return 100;
      if (milestone?.status === 'in_progress') return 0;
      return 0;
    }
    
    // 计算已完成子任务的比例
    const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed');
    const progressPercentage = (completedSubtasks.length / subtasks.length) * 100;
    
    return Math.round(progressPercentage);
  };

  // 添加动态进度条动画
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const targetProgress = calculateProgress();
    const duration = 1000; // 1秒动画
    const steps = 60;
    const increment = targetProgress / steps;
    const stepDuration = duration / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= targetProgress) {
        currentProgress = targetProgress;
        clearInterval(timer);
      }
      setAnimatedProgress(currentProgress);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [milestone?.status, subtasks]);

  // 时间格式化函数
  const toDateTime = (dateStr) => {
    if (!dateStr) return null;
    return `${dateStr} 00:00:00`;
  };

  // 处理编辑里程碑
  const handleEdit = () => {
    setShowEditModal(true);
  };

  // 处理更新里程碑
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      alert("请输入里程碑名称");
      return;
    }

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      startDate: toDateTime(editForm.startDate),
      endDate: toDateTime(editForm.endDate),
    };

    setUpdating(true);
    try {
      const response = await milestoneAPI.update(milestoneId, payload);
      if (response.ok) {
        setShowEditModal(false);
        // 重新加载里程碑数据
        await loadMilestoneData();
        alert('里程碑更新成功');
      } else {
        alert(response.error?.message || "更新失败");
      }
    } catch (error) {
      console.error('更新里程碑失败:', error);
      alert('更新里程碑失败');
    } finally {
      setUpdating(false);
    }
  };

  // 重置编辑表单
  const resetEditForm = () => {
    if (milestone) {
      setEditForm({
        title: milestone.title || '',
        description: milestone.description || '',
        startDate: milestone.startTime ? milestone.startTime.split(' ')[0] : '',
        endDate: milestone.endTime ? milestone.endTime.split(' ')[0] : '',
      });
    }
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
                    style={{ background: getStatusColor(calculateMilestoneStatus(milestone, subtasks)) }}
                  >
                    {getStatusText(calculateMilestoneStatus(milestone, subtasks))}
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
              <button 
                className="btn-primary"
                onClick={handleEdit}
              >
                编辑里程碑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 里程碑概览 */}
      <div className="milestone-overview">
        {/* 左侧概览卡片 */}
        <div className="overview-grid">
          <div className="overview-card">
            <h3>📈 完成进度</h3>
            <div className="progress-section">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill-large"
                  style={{ 
                    width: `${animatedProgress}%`,
                    background: getStatusColor(milestone.status)
                  }}
                ></div>
              </div>
              <div className="progress-text2">{Math.round(animatedProgress)}% 完成</div>
            </div>
          </div>

          <div className="overview-card">
            <h3>📊 任务统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{subtasks.length}</div>
                <div className="stat-label">总任务</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{subtasks.filter(s => s.status === 'completed').length}</div>
                <div className="stat-label">已完成</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{subtasks.filter(s => s.status === 'in_progress').length}</div>
                <div className="stat-label">进行中</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{subtasks.filter(s => {
                  if (s.status === 'completed') return false;
                  if (s.endTime) {
                    const now = new Date();
                    const endTime = new Date(s.endTime);
                    return now > endTime;
                  }
                  return false;
                }).length}</div>
                <div className="stat-label">已逾期</div>
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
            </div>
          </div>
        </div>

        {/* 右侧信息面板 */}
        <div className="milestone-sidebar">
          <h3 className="sidebar-title">🎯 里程碑信息</h3>
          
          <div className="sidebar-section">
            <h4>基本信息</h4>
            <div className="sidebar-info">
              <div className="sidebar-info-item">
                <span className="sidebar-label">状态</span>
                <span className="sidebar-value">{getStatusText(milestone.status)}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="sidebar-label">创建时间</span>
                <span className="sidebar-value">{formatDate(milestone.startTime)}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="sidebar-label">截止时间</span>
                <span className="sidebar-value">{formatDate(milestone.endTime)}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>项目信息</h4>
            <div className="sidebar-info">
              <div className="sidebar-info-item">
                <span className="sidebar-label">项目名称</span>
                <span className="sidebar-value">{project?.projectName || '未知'}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="sidebar-label">项目负责人</span>
                <span className="sidebar-value">{project?.projectOwner || '未知'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>快速操作</h4>
            <div className="sidebar-info">
              <div 
                className="sidebar-info-item" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/project/${projectId}`)}
              >
                <span className="sidebar-label">查看项目</span>
                <span className="sidebar-value">→</span>
              </div>
              {isProjectOwner && (
                <div 
                  className="sidebar-info-item" 
                  style={{ cursor: 'pointer' }}
                  onClick={handleEdit}
                >
                  <span className="sidebar-label">编辑里程碑</span>
                  <span className="sidebar-value">→</span>
                </div>
              )}
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
          onSubtaskChange={loadMilestoneData}
        />
      </div>

      {/* 编辑里程碑模态框 */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑里程碑</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="modal-body">
              <div className="form-group">
                <label>里程碑名称 *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  placeholder="请输入里程碑名称"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="请输入里程碑描述"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  取消
                </button>
                <button type="submit" disabled={updating}>
                  {updating ? "更新中..." : "更新里程碑"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneDetail;
