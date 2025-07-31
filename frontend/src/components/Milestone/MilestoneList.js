import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { milestoneAPI } from '../../utils/api';
import './Milestone.css';

const MilestoneList = () => {
  const { projectId } = useParams();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await milestoneAPI.getMilestoneList(projectId);
      
      if (data.success) {
        setMilestones(data.data);
      } else {
        setError(data.message || '获取里程碑列表失败');
      }
    } catch (err) {
      setError(`获取里程碑列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('确定要删除这个里程碑吗？')) return;

    try {
      const data = await milestoneAPI.deleteMilestone(milestoneId);
      
      if (data.success) {
        setMilestones(milestones.filter(m => m.milestoneId !== milestoneId));
      } else {
        setError(data.message || '删除里程碑失败');
      }
    } catch (err) {
      setError(`删除里程碑失败: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">⏳ 加载中...</div>;

  return (
    <div className="milestone-container">
      <div className="container">
        <div className="page-header">
          <h1>📋 项目里程碑</h1>
          <Link to={`/project/${projectId}/milestone/create`} className="btn btn-primary">
            ➕ 创建里程碑
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="milestone-list">
          {milestones.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>暂无里程碑</h3>
              <p>创建第一个里程碑来开始项目管理</p>
              <Link to={`/project/${projectId}/milestone/create`} className="btn btn-primary">
                ➕ 创建里程碑
              </Link>
            </div>
          ) : (
            milestones.map(milestone => (
              <div key={milestone.milestoneId} className="milestone-card">
                <div className="milestone-header">
                  <h3>{milestone.title}</h3>
                  <span className={`status-badge ${milestone.status}`}>
                    {milestone.status === 'pending' ? '⏳ 待开始' : 
                     milestone.status === 'in_progress' ? '🔄 进行中' : 
                     milestone.status === 'completed' ? '✅ 已完成' : milestone.status}
                  </span>
                </div>
                
                <p className="milestone-description">{milestone.description}</p>
                
                <div className="milestone-meta">
                  <div className="date-info">
                    <span className="date-label">📅 时间范围:</span>
                    <span className="date-range">
                      {milestone.startTime} - {milestone.endTime}
                    </span>
                  </div>
                </div>
                
                <div className="milestone-actions">
                  <Link 
                    to={`/project/${projectId}/milestone/${milestone.milestoneId}/subtasks`}
                    className="btn btn-sm btn-secondary"
                  >
                    📝 查看子任务
                  </Link>
                  <Link 
                    to={`/project/${projectId}/milestone/${milestone.milestoneId}/edit`}
                    className="btn btn-sm btn-primary"
                  >
                    ✏️ 编辑
                  </Link>
                  <button 
                    onClick={() => handleDeleteMilestone(milestone.milestoneId)}
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
          <Link to={`/project/${projectId}`} className="btn btn-secondary">
            ← 返回项目详情
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MilestoneList;