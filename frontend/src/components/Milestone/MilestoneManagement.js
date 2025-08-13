"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import MemberSelector from "../Common/MemberSelector"
import { milestoneAPI, subtaskAPI } from "../../utils/api"
import "./MilestoneManagement.css"

function toDateTime(dateStr) {
  if (!dateStr) return null
  return `${dateStr} 00:00:00`
}

function formatDate(dateString) {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return "Invalid Date"
  }
}

function getStatusColor(status) {
  const colors = {
    'in_progress': '#3b82f6',
    'completed': '#10b981',
    'overdue': '#ef4444'
  }
  return colors[status] || colors['in_progress']
}

function getStatusText(status) {
  const texts = {
    'in_progress': '进行中',
    'completed': '已完成',
    'overdue': '已逾期'
  }
  return texts[status] || '进行中'
}





export default function MilestoneManagement({ projectId, user, isProjectOwner }) {
  const [milestones, setMilestones] = useState([])
  const [milestoneProgress, setMilestoneProgress] = useState({})
  const [milestoneStatus, setMilestoneStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  const loadMilestones = async () => {
    setLoading(true)
    try {
      const response = await milestoneAPI.listByProject(projectId)
      if (response.ok && response.data) {
        const milestoneList = Array.isArray(response.data) ? response.data : []
        setMilestones(milestoneList)
        
        // 为每个里程碑加载子任务进度和状态
        const progressData = {}
        const statusData = {}
        
        for (const milestone of milestoneList) {
          try {
            // 获取子任务进度
            const progressResponse = await subtaskAPI.list(milestone.milestoneId)
            if (progressResponse.ok && progressResponse.data) {
              const subtasks = Array.isArray(progressResponse.data) ? progressResponse.data : []
              if (subtasks.length > 0) {
                const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed')
                progressData[milestone.milestoneId] = Math.round((completedSubtasks.length / subtasks.length) * 100)
                
                // 确定状态
                if (completedSubtasks.length === subtasks.length) {
                  statusData[milestone.milestoneId] = 'completed'
                  // 如果所有子任务完成，自动更新里程碑状态为已完成
                  try {
                    await milestoneAPI.updateStatus(milestone.milestoneId, 'completed')
                  } catch (updateError) {
                    console.error(`更新里程碑 ${milestone.milestoneId} 状态失败:`, updateError)
                  }
                } else {
                  statusData[milestone.milestoneId] = 'in_progress'
                }
              } else {
                progressData[milestone.milestoneId] = 0
                statusData[milestone.milestoneId] = 'in_progress'
              }
            } else {
              progressData[milestone.milestoneId] = 0
              statusData[milestone.milestoneId] = 'in_progress'
            }
          } catch (error) {
            console.error(`获取里程碑 ${milestone.milestoneId} 的子任务数据失败:`, error)
            progressData[milestone.milestoneId] = 0
            statusData[milestone.milestoneId] = 'in_progress'
          }
        }
        
        setMilestoneProgress(progressData)
        setMilestoneStatus(statusData)
      } else {
        console.error('加载里程碑失败:', response.error)
        setMilestones([])
      }
    } catch (error) {
      console.error('加载里程碑失败:', error)
      setMilestones([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMilestones()
  }, [projectId])

  // 监听子任务状态变化，自动刷新里程碑进度
  useEffect(() => {

    
    const handleSubtaskChange = (event) => {
      
      loadMilestones();
    };

    // 监听自定义事件
    window.addEventListener('subtaskStatusChanged', handleSubtaskChange);
    
    
    return () => {
      window.removeEventListener('subtaskStatusChanged', handleSubtaskChange);
      
    };
  }, [projectId]);

  // 添加刷新单个里程碑进度和状态的函数
  const refreshMilestoneProgress = async (milestoneId) => {
    try {
      const progressResponse = await subtaskAPI.list(milestoneId)
      if (progressResponse.ok && progressResponse.data) {
        const subtasks = Array.isArray(progressResponse.data) ? progressResponse.data : []
        if (subtasks.length > 0) {
          const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed')
          const progress = Math.round((completedSubtasks.length / subtasks.length) * 100)
          
          setMilestoneProgress(prev => ({
            ...prev,
            [milestoneId]: progress
          }))
          
          const status = completedSubtasks.length === subtasks.length ? 'completed' : 'in_progress'
          setMilestoneStatus(prev => ({
            ...prev,
            [milestoneId]: status
          }))
          
          // 如果所有子任务完成，自动更新里程碑状态为已完成
          if (completedSubtasks.length === subtasks.length) {
            try {
              await milestoneAPI.updateStatus(milestoneId, 'completed')
            } catch (updateError) {
              console.error(`更新里程碑 ${milestoneId} 状态失败:`, updateError)
            }
          }
        } else {
          setMilestoneProgress(prev => ({
            ...prev,
            [milestoneId]: 0
          }))
          setMilestoneStatus(prev => ({
            ...prev,
            [milestoneId]: 'in_progress'
          }))
        }
      }
    } catch (error) {
      console.error(`刷新里程碑 ${milestoneId} 进度失败:`, error)
    }
  }

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert("请输入里程碑名称")
      return
    }

    const payload = {
      projectId: parseInt(projectId),
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: toDateTime(form.startDate),
      endDate: toDateTime(form.endDate),
    }

    setCreating(true)
    try {
      const response = await milestoneAPI.create(payload)
      if (response.ok) {
        resetForm()
        setShowCreateModal(false)
        loadMilestones() // 重新加载所有里程碑数据
        alert('里程碑创建成功')
      } else {
        alert(response.error?.message || "创建失败")
      }
    } catch (error) {
      console.error('创建里程碑失败:', error)
      alert('创建里程碑失败')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone)
    setForm({
      title: milestone.title || "",
      description: milestone.description || "",
      startDate: milestone.startDate ? milestone.startDate.split(' ')[0] : "",
      endDate: milestone.endDate ? milestone.endDate.split(' ')[0] : "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert("请输入里程碑名称")
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: toDateTime(form.startDate),
      endDate: toDateTime(form.endDate),
    }

    setUpdating(true)
    try {
      const response = await milestoneAPI.update(editingMilestone.milestoneId, payload)
      if (response.ok) {
        setShowEditModal(false)
        setEditingMilestone(null)
        resetForm()
        loadMilestones() // 重新加载所有里程碑数据
        alert('里程碑更新成功')
      } else {
        alert(response.error?.message || "更新失败")
      }
    } catch (error) {
      console.error('更新里程碑失败:', error)
      alert('更新里程碑失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (milestoneId) => {
    if (!window.confirm('确定要删除这个里程碑吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await milestoneAPI.delete(milestoneId)
      if (response.ok) {
        loadMilestones() // 重新加载所有里程碑数据
        alert('里程碑删除成功')
      } else {
        alert(response.error?.message || "删除失败")
      }
    } catch (error) {
      console.error('删除里程碑失败:', error)
      alert('删除里程碑失败')
    }
  }

  const getMilestoneStats = () => {
    const total = milestones.length
    const completed = milestones.filter(m => milestoneStatus[m.milestoneId] === 'completed').length
    const inProgress = milestones.filter(m => milestoneStatus[m.milestoneId] === 'in_progress').length
    const overdue = milestones.filter(m => {
      // 检查是否逾期（基于时间）
      if (!m.startDate || !m.endDate) return false
      const now = new Date()
      const end = new Date(m.endDate)
      return now > end && milestoneStatus[m.milestoneId] !== 'completed'
    }).length

    return { total, completed, inProgress, overdue }
  }

  const stats = getMilestoneStats()

  if (loading) {
    return (
      <div className="milestone-management">
        <div className="loading">⏳ 加载里程碑中...</div>
      </div>
    )
  }

  return (
    <div className="milestone-management">
      {/* 头部 */}
      <div className="milestone-header">
        <h2>🎯 里程碑管理</h2>
        {isProjectOwner && (
          <button 
            className="create-milestone-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + 新建里程碑
          </button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="milestone-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总里程碑</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#10b981' }}>{stats.completed}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#3b82f6' }}>{stats.inProgress}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ef4444' }}>{stats.overdue}</div>
          <div className="stat-label">已逾期</div>
        </div>
      </div>

      {/* 里程碑列表 */}
      <div className="milestone-list">
        {milestones.length === 0 ? (
          <div className="no-milestones">
            <div className="no-milestones-icon">🎯</div>
            <h3>暂无里程碑</h3>
            <p>开始创建第一个里程碑来跟踪项目进度</p>
            {isProjectOwner && (
              <button 
                className="create-first-milestone-btn"
                onClick={() => setShowCreateModal(true)}
              >
                创建里程碑
              </button>
            )}
          </div>
        ) : (
          milestones.map((milestone) => {
            const status = milestoneStatus[milestone.milestoneId] || 'in_progress'
            const progress = milestoneProgress[milestone.milestoneId] || 0
            
            return (
              <div key={milestone.milestoneId} className="milestone-card">
                <div className="milestone-header-card">
                  <div className="milestone-info">
                    <h3 className="milestone-title">{milestone.title}</h3>
                    <p className="milestone-description">{milestone.description}</p>
                  </div>
                  <div className="milestone-actions">
                    <span 
                      className="status-badge"
                      style={{ background: getStatusColor(status) }}
                    >
                      {getStatusText(status)}
                    </span>
                    <Link 
                      to={`/project/${projectId}/milestone/${milestone.milestoneId}`}
                      className="detail-link-header"
                    >
                      查看详情 →
                    </Link>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="milestone-progress">
                  <div className="progress-info">
                    <span>进度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${progress}%`,
                        background: getStatusColor(status)
                      }}
                    />
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="milestone-dates">
                  <div className="date-item">
                    <span className="date-label">开始时间:</span>
                    <span className="date-value">{formatDate(milestone.startDate)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">结束时间:</span>
                    <span className="date-value">{formatDate(milestone.endDate)}</span>
                  </div>
                </div>

                {/* 操作链接 */}
                <div className="milestone-footer">
                  {isProjectOwner && (
                    <div className="action-buttons-footer">
                      <button 
                        className="edit-btn-footer"
                        onClick={() => handleEdit(milestone)}
                      >
                        编辑
                      </button>
                      <button 
                        className="delete-btn-footer"
                        onClick={() => handleDelete(milestone.milestoneId)}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 创建里程碑模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建里程碑</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>里程碑名称 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="请输入里程碑名称"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="请输入里程碑描述"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" disabled={creating}>
                  {creating ? "创建中..." : "创建里程碑"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑里程碑模态框 */}
      {showEditModal && editingMilestone && (
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
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="请输入里程碑名称"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="请输入里程碑描述"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
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
  )
}



