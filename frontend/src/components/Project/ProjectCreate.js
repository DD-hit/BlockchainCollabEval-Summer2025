"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { projectAPI } from "../../utils/api"
import "./Project.css"

// 将日期和时间组合成MySQL DATETIME格式
function combineToDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  return `${dateStr} ${timeStr}:00` // 格式: YYYY-MM-DD HH:mm:ss
}

export default function ProjectCreate({ user }) {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [ownerAddress, setOwnerAddress] = useState(user?.address || "")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = "项目名称必填"
    if (!ownerAddress.trim()) e.ownerAddress = "负责人地址必填"
    const start = combineToDateTime(startDate, startTime)
    const end = combineToDateTime(endDate, endTime)
    if (start && end && start > end) e.time = "开始时间不能晚于结束时间"
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
        startTime: combineToDateTime(startDate, startTime),
        endTime: combineToDateTime(endDate, endTime)
      });

      if (response.ok) {
        // 创建成功后跳转并传递刷新标志
        navigate('/projects', { 
          state: { shouldRefresh: true, message: '项目创建成功！' }
        });
      } else {
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
    <div className="project-create container">
      <h2>新建项目</h2>
      {error && <div className="error-message">{error}</div>}
      <form className="project-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            项目名称<span style={{ color: "red" }}>*</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入项目名称" />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>

        <div className="form-row">
          <label>项目描述</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="项目背景、目标等"
          />
        </div>

        <div className="form-row">
          <label>
            负责人地址<span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="项目负责人的区块链地址"
          />
          {errors.ownerAddress && <div className="error">{errors.ownerAddress}</div>}
        </div>

        <div className="form-row">
          <label>开始时间</label>
          <div className="row">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <label>结束时间</label>
          <div className="row">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          {errors.time && <div className="error">{errors.time}</div>}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/projects")} disabled={submitting}>
            取消
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "创建中..." : "创建项目"}
          </button>
        </div>
      </form>
    </div>
  )
}





