import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subtaskAPI } from '../../utils/api';
import './Subtask.css';

const SubtaskForm = ({ isEdit = false }) => {
  const { projectId, milestoneId, subtaskId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    startTime: '',
    endTime: '',
    priority: 'medium',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && subtaskId) {
      fetchSubtaskDetail();
    }
  }, [isEdit, subtaskId]);

  const fetchSubtaskDetail = async () => {
    try {
      const data = await subtaskAPI.getSubtaskDetail(subtaskId);
      if (data.success && data.data.length > 0) {
        const subtask = data.data[0];
        setFormData({
          title: subtask.title,
          description: subtask.description,
          assignedTo: subtask.assignedTo || '',
          startTime: subtask.startTime?.split(' ')[0] || '',
          endTime: subtask.endTime?.split(' ')[0] || '',
          priority: subtask.priority || 'medium',
          status: subtask.status || 'pending'
        });
      }
    } catch (err) {
      setError(`获取子任务详情失败: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证表单
    if (!formData.title.trim()) {
      setError('子任务标题不能为空');
      setLoading(false);
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError('结束时间必须晚于开始时间');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        ...(isEdit ? {} : { milestoneId: parseInt(milestoneId) })
      };

      const data = isEdit 
        ? await subtaskAPI.updateSubtask(subtaskId, submitData)
        : await subtaskAPI.createSubtask(submitData);

      if (data.success) {
        navigate(`/project/${projectId}/milestone/${milestoneId}/subtasks`);
      } else {
        setError(data.message || `${isEdit ? '更新' : '创建'}子任务失败`);
      }
    } catch (err) {
      setError(`${isEdit ? '更新' : '创建'}子任务失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subtask-form-container">
      <div className="container">
        <div className="page-header">
          <h1>{isEdit ? '📝 编辑子任务' : '➕ 创建子任务'}</h1>
          <p>{isEdit ? '修改子任务信息' : '为里程碑添加新的子任务'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="subtask-form">
          <div className="form-section">
            <h3>📋 基本信息</h3>
            
            <div className="form-group">
              <label htmlFor="title">子任务标题 *</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入子任务标题"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">任务描述</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="详细描述任务内容和要求"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>👤 分配信息</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedTo">负责人</label>
                <input
                  type="text"
                  id="assignedTo"
                  name="assignedTo"
                  className="form-control"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="输入负责人用户名"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">优先级</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">🟢 低优先级</option>
                  <option value="medium">🟡 中优先级</option>
                  <option value="high">🔴 高优先级</option>
                </select>
              </div>
            </div>

            {isEdit && (
              <div className="form-group">
                <label htmlFor="status">任务状态</label>
                <select
                  id="status"
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">⏳ 待开始</option>
                  <option value="in_progress">🔄 进行中</option>
                  <option value="completed">✅ 已完成</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>📅 时间安排</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">开始时间 *</label>
                <input
                  type="date"
                  id="startTime"
                  name="startTime"
                  className="form-control"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">结束时间 *</label>
                <input
                  type="date"
                  id="endTime"
                  name="endTime"
                  className="form-control"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate(`/project/${projectId}/milestone/${milestoneId}/subtasks`)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '保存中...' : (isEdit ? '✅ 更新子任务' : '➕ 创建子任务')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubtaskForm;