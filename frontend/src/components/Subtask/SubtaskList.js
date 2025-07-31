import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subtaskAPI } from '../../utils/api';
import './Subtask.css';

const SubtaskList = () => {
  const { projectId, milestoneId } = useParams();
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubtasks();
  }, [milestoneId]);

  const fetchSubtasks = async () => {
    try {
      setLoading(true);
      const data = await subtaskAPI.getSubtaskList(milestoneId);
      
      if (data.success) {
        setSubtasks(data.data);
      } else {
        setError(data.message || '获取子任务列表失败');
      }
    } catch (err) {
      setError(`获取子任务列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('确定要删除这个子任务吗？')) return;

    try {
      const data = await subtaskAPI.deleteSubtask(subtaskId);
      
      if (data.success) {
        setSubtasks(subtasks.filter(s => s.subtaskId !== subtaskId));
      } else {
        setError(data.message || '删除子任务失败');
      }
    } catch (err) {
      setError(`删除子任务失败: ${err.message}`);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '🔴 高优先级';
      case 'medium': return '🟡 中优先级';
      case 'low': return '🟢 低优先级';
      default: return priority;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ 待开始';
      case 'in_progress': return '🔄 进行中';
      case 'completed': return '✅ 已完成';
      default: return status;
    }
  };

  if (loading) return <div className="loading">⏳ 加载中...</div>;

  return (
    <div className="subtask-container">
      <div className="container">
        <div className="page-header">
          <h1>📝 子任务管理</h1>
          <Link 
            to={`/project/${projectId}/milestone/${milestoneId}/subtask/create`} 
            className="btn btn-primary"
          >
            ➕ 创建子任务
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="subtask-list">
          {subtasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>暂无子任务</h3>
              <p>为这个里程碑创建第一个子任务</p>
              <Link 
                to={`/project/${projectId}/milestone/${milestoneId}/subtask/create`} 
                className="btn btn-primary"
              >
                ➕ 创建子任务
              </Link>
            </div>
          ) : (
            subtasks.map(subtask => (
              <div key={subtask.subtaskId} className="subtask-card">
                <div className="subtask-header">
                  <h3>{subtask.title}</h3>
                  <div className="subtask-badges">
                    <span className={`status-badge ${subtask.status}`}>
                      {getStatusText(subtask.status)}
                    </span>
                    <span className={`priority-badge ${getPriorityColor(subtask.priority)}`}>
                      {getPriorityText(subtask.priority)}
                    </span>
                  </div>
                </div>
                
                <p className="subtask-description">{subtask.description}</p>
                
                <div className="subtask-meta">
                  <div className="assignee-info">
                    <span className="meta-label">👤 负责人:</span>
                    <span className="assignee">{subtask.assignedTo || '未分配'}</span>
                  </div>
                  <div className="date-info">
                    <span className="meta-label">📅 时间:</span>
                    <span className="date-range">
                      {subtask.startTime} - {subtask.endTime}
                    </span>
                  </div>
                </div>
                
                <div className="subtask-actions">
                  <Link 
                    to={`/project/${projectId}/milestone/${milestoneId}/subtask/${subtask.subtaskId}/edit`}
                    className="btn btn-sm btn-primary"
                  >
                    ✏️ 编辑
                  </Link>
                  <button 
                    onClick={() => handleDeleteSubtask(subtask.subtaskId)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="back-actions">
          <Link to={`/project/${projectId}/milestones`} className="btn btn-secondary">
            ← 返回里程碑列表
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubtaskList;