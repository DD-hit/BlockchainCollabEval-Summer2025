import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Task.css';

const TaskAssignment = ({ user }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: '中',
    estimatedHours: '',
    dueDate: '',
    requirements: [''],
    deliverables: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // 模拟API调用
      setTimeout(() => {
        setProject({
          id: parseInt(projectId),
          name: '区块链投票系统',
          description: '基于以太坊的去中心化投票平台'
        });

        setMembers([
          { username: 'alice', address: '0x1234...5678', role: '前端开发' },
          { username: 'bob', address: '0x2345...6789', role: '智能合约开发' },
          { username: 'charlie', address: '0x3456...7890', role: '测试工程师' },
          { username: 'david', address: '0x4567...8901', role: 'UI设计师' }
        ]);
      }, 500);
    } catch (error) {
      console.error('获取项目数据失败:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData({ ...formData, requirements: newRequirements });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, '']
    });
  };

  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: newRequirements });
  };

  const handleDeliverableChange = (index, value) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, '']
    });
  };

  const removeDeliverable = (index) => {
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证表单
    if (!formData.title.trim()) {
      setError('任务标题不能为空');
      setLoading(false);
      return;
    }

    if (!formData.assignee) {
      setError('请选择任务负责人');
      setLoading(false);
      return;
    }

    if (!formData.dueDate) {
      setError('请设置截止日期');
      setLoading(false);
      return;
    }

    if (new Date(formData.dueDate) <= new Date()) {
      setError('截止日期必须晚于当前时间');
      setLoading(false);
      return;
    }

    const validRequirements = formData.requirements.filter(req => req.trim());
    const validDeliverables = formData.deliverables.filter(del => del.trim());

    try {
      const taskData = {
        ...formData,
        requirements: validRequirements,
        deliverables: validDeliverables,
        projectId: parseInt(projectId),
        creator: user.username,
        status: '未开始',
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/project/${projectId}`);
      } else {
        setError(data.message || '任务分配失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="task-assignment">
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-assignment">
      <div className="container">
        <div className="page-header">
          <h1>📋 分配新任务</h1>
          <p>为项目 "{project.name}" 分配新任务</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          {/* 基本信息 */}
          <div className="form-section">
            <h3>📝 任务基本信息</h3>
            
            <div className="form-group">
              <label htmlFor="title">任务标题 *</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                placeholder="请输入任务标题"
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
                placeholder="详细描述任务内容、目标和背景"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignee">任务负责人 *</label>
                <select
                  id="assignee"
                  name="assignee"
                  className="form-control"
                  value={formData.assignee}
                  onChange={handleChange}
                  required
                >
                  <option value="">请选择负责人</option>
                  {members.map((member, index) => (
                    <option key={index} value={member.username}>
                      {member.username} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="priority">任务优先级</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="低">低优先级</option>
                  <option value="中">中优先级</option>
                  <option value="高">高优先级</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="estimatedHours">预估工时（小时）</label>
                <input
                  type="number"
                  id="estimatedHours"
                  name="estimatedHours"
                  className="form-control"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="预估完成时间"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">截止日期 *</label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* 任务要求 */}
          <div className="form-section">
            <div className="section-header">
              <h3>📋 任务要求</h3>
              <button type="button" onClick={addRequirement} className="btn btn-secondary btn-sm">
                ➕ 添加要求
              </button>
            </div>
            
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="requirement-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={requirement}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  placeholder="输入具体的任务要求"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="btn btn-danger btn-sm"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 交付物 */}
          <div className="form-section">
            <div className="section-header">
              <h3>📦 预期交付物</h3>
              <button type="button" onClick={addDeliverable} className="btn btn-secondary btn-sm">
                ➕ 添加交付物
              </button>
            </div>
            
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="deliverable-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={deliverable}
                  onChange={(e) => handleDeliverableChange(index, e.target.value)}
                  placeholder="输入预期的交付物"
                />
                {formData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="btn btn-danger btn-sm"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 团队成员预览 */}
          <div className="form-section">
            <h3>👥 项目团队成员</h3>
            <div className="members-preview">
              {members.map((member, index) => (
                <div key={index} className="member-preview-card">
                  <div className="member-avatar-small">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-preview-info">
                    <strong>{member.username}</strong>
                    <span>{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/project/${projectId}`)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '分配中...' : '📋 分配任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskAssignment;