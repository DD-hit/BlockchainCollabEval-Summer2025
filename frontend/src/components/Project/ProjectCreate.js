"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { projectAPI } from "../../utils/api"
import "./Project.css"

export default function ProjectCreate({ user }) {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = "项目名称必填"
    if (startDate && endDate && startDate > endDate) e.time = "开始时间不能晚于结束时间"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const token = sessionStorage.getItem('token'); // 改为sessionStorage
    if (!token) {
      setError('请先登录');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const response = await projectAPI.create({
        projectName: name,
        description: description,
        projectOwner: user?.username || sessionStorage.getItem('username'), // 改为sessionStorage
        startTime: startDate ? `${startDate} 00:00:00` : null,
        endTime: endDate ? `${endDate} 23:59:59` : null
      });

      

      if (response.ok) {
        
        // 创建成功后跳转并传递刷新标志
        navigate('/projects', { 
          state: { shouldRefresh: true, message: '项目创建成功！' }
        });
      } else {
        console.error('项目创建失败:', response.error);
        setError(response.error?.message || '创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      setError('创建项目失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-create-container">
      <div className="project-create-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🚀</span>
            新建项目
          </h1>
          <p className="page-subtitle">创建一个新的协作项目，开始您的区块链开发之旅</p>
        </div>
      </div>

      <div className="project-create-card">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                项目名称
                <span className="required-mark">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="请输入项目名称" 
                  className="form-input"
                />
              </div>
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">项目描述</label>
              <div className="input-wrapper">
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="项目背景、目标等"
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="time-section">
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <div className="date-input-wrapper">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="form-input date-input"
                  />
                  <span className="input-icon">📅</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">结束时间</label>
                <div className="date-input-wrapper">
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="form-input date-input"
                  />
                  <span className="input-icon">📅</span>
                </div>
                {errors.time && <div className="error-message">{errors.time}</div>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate("/projects")} 
              disabled={submitting}
              className="btn btn-secondary"
            >
              <span className="btn-icon">❌</span>
              取消
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn btn-primary"
            >
              <span className="btn-icon">
                {submitting ? "⏳" : "✨"}
              </span>
              {submitting ? "创建中..." : "创建项目"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





