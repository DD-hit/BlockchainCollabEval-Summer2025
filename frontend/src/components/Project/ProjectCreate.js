import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Project.css';

const ProjectCreate = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    members: [''],
    tasks: [{ title: '', description: '', priority: '中', estimatedHours: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const addMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, '']
    });
  };

  const removeMember = (index) => {
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: newMembers });
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index][field] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { title: '', description: '', priority: '中', estimatedHours: '' }]
    });
  };

  const removeTask = (index) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证表单
    if (!formData.name.trim()) {
      setError('项目名称不能为空');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('项目描述不能为空');
      setLoading(false);
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('结束日期必须晚于开始日期');
      setLoading(false);
      return;
    }

    // 过滤空成员
    const validMembers = formData.members.filter(member => member.trim());
    if (validMembers.length === 0) {
      setError('至少需要添加一个项目成员');
      setLoading(false);
      return;
    }

    // 验证任务
    const validTasks = formData.tasks.filter(task => task.title.trim());
    if (validTasks.length === 0) {
      setError('至少需要添加一个预设任务');
      setLoading(false);
      return;
    }

    try {
      const projectData = {
        ...formData,
        members: validMembers,
        tasks: validTasks,
        creator: user.username,
        creatorAddress: user.address
      };

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || '创建项目失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-create">
      <div className="container">
        <div className="page-header">
          <h1>🚀 创建新项目</h1>
          <p>设置项目信息、添加团队成员并预设任务</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="project-form">
          {/* 基本信息 */}
          <div className="form-section">
            <h3>📋 基本信息</h3>
            
            <div className="form-group">
              <label htmlFor="name">项目名称 *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入项目名称"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">项目描述 *</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="详细描述项目目标、功能和技术要求"
                required
              />
            </div>

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
                <label htmlFor="endDate">预计结束日期 *</label>
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

          {/* 团队成员 */}
          <div className="form-section">
            <div className="section-header">
              <h3>👥 团队成员</h3>
              <button type="button" onClick={addMember} className="btn btn-secondary btn-sm">
                ➕ 添加成员
              </button>
            </div>
            
            {formData.members.map((member, index) => (
              <div key={index} className="member-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  placeholder="输入成员用户名或区块链地址"
                />
                {formData.members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="btn btn-danger btn-sm"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 预设任务 */}
          <div className="form-section">
            <div className="section-header">
              <h3>📝 预设任务</h3>
              <button type="button" onClick={addTask} className="btn btn-secondary btn-sm">
                ➕ 添加任务
              </button>
            </div>
            
            {formData.tasks.map((task, index) => (
              <div key={index} className="task-input-group">
                <div className="task-header">
                  <h4>任务 {index + 1}</h4>
                  {formData.tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ 删除
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label>任务标题 *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                    placeholder="请输入任务标题"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>任务描述</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={task.description}
                    onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                    placeholder="详细描述任务要求和交付物"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>优先级</label>
                    <select
                      className="form-control"
                      value={task.priority}
                      onChange={(e) => handleTaskChange(index, 'priority', e.target.value)}
                    >
                      <option value="低">低优先级</option>
                      <option value="中">中优先级</option>
                      <option value="高">高优先级</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>预估工时（小时）</label>
                    <input
                      type="number"
                      className="form-control"
                      value={task.estimatedHours}
                      onChange={(e) => handleTaskChange(index, 'estimatedHours', e.target.value)}
                      placeholder="预估完成时间"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '创建中...' : '🚀 创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;