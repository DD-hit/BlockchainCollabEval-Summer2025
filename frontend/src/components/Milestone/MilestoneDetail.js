import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { milestoneAPI, subtaskAPI } from '../../utils/api';
import './Milestone.css';

const MilestoneDetail = ({ user }) => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('MilestoneDetail mounted, milestoneId:', milestoneId);
    if (milestoneId) {
      loadMilestoneData();
    } else {
      setError('里程碑ID不存在');
      setLoading(false);
    }
  }, [milestoneId]);

  const loadMilestoneData = async () => {
    try {
      console.log('Loading milestone data for ID:', milestoneId);
      setLoading(true);
      setError('');
      
      // 先尝试获取里程碑详情
      const milestoneRes = await milestoneAPI.getMilestoneDetail(milestoneId);
      console.log('Milestone response:', milestoneRes);
      
      if (milestoneRes.data && milestoneRes.data.success) {
        setMilestone(milestoneRes.data.data);
        console.log('Milestone data set:', milestoneRes.data.data);
        
        // 然后获取子任务
        try {
          const subtasksRes = await subtaskAPI.getSubtaskList(milestoneId);
          console.log('Subtasks response:', subtasksRes);
          
          if (subtasksRes.data && subtasksRes.data.success) {
            setSubtasks(subtasksRes.data.data || []);
          } else {
            console.log('No subtasks found or failed to load subtasks');
            setSubtasks([]);
          }
        } catch (subtaskError) {
          console.error('加载子任务失败:', subtaskError);
          setSubtasks([]);
        }
      } else {
        setError(milestoneRes.data?.message || '获取里程碑失败');
      }
      
    } catch (error) {
      console.error('加载里程碑数据失败:', error);
      setError('加载数据失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#718096',
      'in_progress': '#ed8936',
      'completed': '#48bb78'
    };
    return colorMap[status] || '#718096';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待办',
      'in_progress': '进行中',
      'completed': '已完成'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="milestone-detail">
      {/* 页面头部 */}
      <div className="page-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          ← 返回
        </button>
        
        <h1 className="page-title">
          {loading ? '加载中...' : error ? '加载失败' : milestone ? milestone.milestoneName : '里程碑详情'}
        </h1>
        
        <p className="page-subtitle">
          里程碑ID: {milestoneId}
        </p>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>加载里程碑数据中...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <h3>❌ 加载失败</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(-1)}
          >
            返回
          </button>
        </div>
      )}

      {!loading && !error && milestone && (
        <>
          {/* 里程碑信息 */}
          <div className="milestone-info-card">
            <h2>里程碑信息</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>名称:</label>
                <span>{milestone.milestoneName}</span>
              </div>
              <div className="info-item">
                <label>描述:</label>
                <span>{milestone.description || '无描述'}</span>
              </div>
              <div className="info-item">
                <label>截止时间:</label>
                <span>{milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : '未设置'}</span>
              </div>
              <div className="info-item">
                <label>优先级:</label>
                <span>{milestone.priority || '未设置'}</span>
              </div>
            </div>
          </div>

          {/* 子任务列表 */}
          <div className="subtasks-section">
            <div className="section-header">
              <h2>子任务 ({subtasks.length})</h2>
              <button className="btn btn-primary">
                ➕ 添加任务
              </button>
            </div>
            
            {subtasks.length > 0 ? (
              <div className="subtasks-grid">
                {subtasks.map(task => (
                  <div key={task.subtaskId} className="subtask-card">
                    <div className="subtask-header">
                      <h4>{task.taskName}</h4>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    <p className="subtask-description">{task.description}</p>
                    <div className="subtask-meta">
                      <span>任务ID: {task.subtaskId}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>暂无子任务</h3>
                <p>为这个里程碑添加一些任务来开始工作吧</p>
                <button className="btn btn-primary">
                  ➕ 创建第一个任务
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MilestoneDetail;

