import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { milestoneAPI } from '../../utils/api';
import './Milestone.css';

const MilestoneForm = ({ isEdit = false }) => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && milestoneId) {
      fetchMilestoneDetail();
    }
  }, [isEdit, milestoneId]);

  const fetchMilestoneDetail = async () => {
    try {
      const data = await milestoneAPI.getMilestoneDetail(milestoneId);
      if (data.success && data.data.length > 0) {
        const milestone = data.data[0];
        setFormData({
          title: milestone.title,
          description: milestone.description,
          startDate: milestone.startTime?.split(' ')[0] || '',
          endDate: milestone.endTime?.split(' ')[0] || ''
        });
      }
    } catch (err) {
      setError(`获取里程碑详情失败: ${err.message}`);
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
      setError('里程碑标题不能为空');
      setLoading(false);
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('结束日期必须晚于开始日期');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        ...(isEdit ? {} : { projectId: parseInt(projectId) })
      };

      const data = isEdit 
        ? await milestoneAPI.updateMilestone(milestoneId, submitData)
        : await milestoneAPI.createMilestone(submitData);

      if (data.success) {
        navigate(`/project/${projectId}/milestones`);
      } else {
        setError(data.message || `${isEdit ? '更新' : '创建'}里程碑失败`);
      }
    } catch (err) {
      setError(`${isEdit ? '更新' : '创建'}里程碑失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="milestone-form-container">
      <div className="container">
        <div className="page-header">
          <h1>{isEdit ? '📝 编辑里程碑' : '➕ 创建里程碑'}</h1>
          <p>{isEdit ? '修改里程碑信息' : '为项目添加新的里程碑'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="milestone-form">
          <div className="form-section">
            <h3>📋 基本信息</h3>
            
            <div className="form-group">
              <label htmlFor="title">里程碑标题 *</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入里程碑标题"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="详细描述里程碑的目标和要求"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>📅 时间安排</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">开始日期 *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="form-control"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">结束日期 *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="form-control"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate(`/project/${projectId}/milestones`)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '保存中...' : (isEdit ? '✅ 更新里程碑' : '➕ 创建里程碑')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestoneForm;