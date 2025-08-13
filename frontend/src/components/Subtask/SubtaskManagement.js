"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../../utils/api"
import MemberSelector from "../Common/MemberSelector"
import { projectMemberAPI } from "../../utils/api"
import "./SubtaskManagement.css"

const SubtaskManagement = ({ projectId, milestoneId, isProjectOwner, onSubtaskChange }) => {
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [projectMembers, setProjectMembers] = useState([])

  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    status: "in_progress",
    startTime: "",
    endTime: "",
  })

  // 添加优先级转换辅助函数
  const convertPriorityToNumber = (priority) => {
    const priorityMap = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    return priorityMap[priority] || 2; // 默认中等优先级
  }

  const convertNumberToPriority = (priorityNumber) => {
    const priorityMap = {
      1: 'low',
      2: 'medium',
      3: 'high'
    };
    return priorityMap[priorityNumber] || 'medium';
  }



  useEffect(() => {
    loadSubtasks()
    if (projectId) {
      loadProjectMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneId, projectId])

  const loadSubtasks = async () => {
    try {
      const response = await api.get(`/api/subtasks/getSubtaskList/${milestoneId}`)
      if (response.data.success) {
        setSubtasks(response.data.data || [])
      }
    } catch (error) {
      console.error("加载子任务列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectMembers = async () => {
    try {
      const response = await projectMemberAPI.members(projectId)
      if (response.ok) {
        setProjectMembers(response.data || [])
      }
    } catch (error) {
      console.error("加载项目成员失败:", error)
    }
  }

  const handleCreateSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtask.title.trim()) {
      alert("请输入子任务标题")
      return
    }

    try {
      const subtaskData = {
        milestoneId: Number.parseInt(milestoneId),
        title: newSubtask.title.trim(),
        status: newSubtask.status || "in_progress",
        description: newSubtask.description.trim() || null,
        assignedTo: newSubtask.assignee || null,
        startTime: newSubtask.startTime ? new Date(newSubtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: newSubtask.endTime ? new Date(newSubtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: convertPriorityToNumber(newSubtask.priority),
      }

      const response = await api.post("/api/subtasks/createSubtask", subtaskData)
      if (response.data.success) {
        setNewSubtask({
          title: "",
          description: "",
          assignee: "",
          priority: "medium",
          status: "in_progress",
          startTime: "",
          endTime: "",
        })
        setShowCreateModal(false)
        alert("子任务创建成功")
        // 重新加载子任务列表
        await loadSubtasks()
        // 通知父组件数据发生变化
        if (onSubtaskChange) {
          onSubtaskChange()
        }
        // 触发全局事件，通知其他组件刷新进度
        window.dispatchEvent(new CustomEvent('subtaskStatusChanged', {
          detail: { action: 'create', milestoneId }
        }));
      }
    } catch (error) {
      console.error("创建子任务失败:", error)
      alert(error.response?.data?.message || "创建子任务失败")
    }
  }

  const handleUpdateSubtask = async (e) => {
    e.preventDefault()
    if (!editingSubtask.title.trim()) {
      alert("请输入子任务标题")
      return
    }

    try {
      const subtaskData = {
        title: editingSubtask.title.trim(),
        status: editingSubtask.status || "in_progress",
        description: editingSubtask.description?.trim() || null,
        assignedTo: editingSubtask.assignee || null,
        startTime: editingSubtask.startTime ? new Date(editingSubtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: editingSubtask.endTime ? new Date(editingSubtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: convertPriorityToNumber(editingSubtask.priority),
      }

      const response = await api.put(`/api/subtasks/updateSubtask/${editingSubtask.subtaskId || editingSubtask.id}`, subtaskData)
      if (response.data.success) {
        setEditingSubtask(null)
        alert("子任务更新成功")
        // 重新加载子任务列表
        await loadSubtasks()
        // 通知父组件数据发生变化
        if (onSubtaskChange) {
          onSubtaskChange()
        }
        // 触发全局事件，通知其他组件刷新进度
        window.dispatchEvent(new CustomEvent('subtaskStatusChanged', {
          detail: { action: 'update', subtaskId: editingSubtask.subtaskId || editingSubtask.id, milestoneId }
        }));
      }
    } catch (error) {
      console.error("更新子任务失败:", error)
      alert("更新子任务失败")
    }
  }

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("确定要删除这个子任务吗？")) return

    try {
      const response = await api.delete(`/api/subtasks/deleteSubtask/${subtaskId}`)
      if (response.data.success) {
        alert("子任务删除成功")
        // 重新加载子任务列表
        await loadSubtasks()
        // 通知父组件数据发生变化
        if (onSubtaskChange) {
          onSubtaskChange()
        }
        // 触发全局事件，通知其他组件刷新进度
        window.dispatchEvent(new CustomEvent('subtaskStatusChanged', {
          detail: { action: 'delete', subtaskId, milestoneId }
        }));
      }
    } catch (error) {
      console.error("删除子任务失败:", error)
      alert("删除子任务失败")
    }
  }

  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      const subtask = subtasks.find(s => s.subtaskId === subtaskId || s.id === subtaskId);
      if (!subtask) {
        alert("找不到要更新的子任务");
        return;
      }

      const subtaskData = {
        title: subtask.title,
        status: newStatus,
        description: subtask.description || null,
        assignedTo: subtask.assignedTo || null,
        startTime: subtask.startTime ? new Date(subtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: subtask.endTime ? new Date(subtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: convertPriorityToNumber(subtask.priority) || 2,
      }

      const response = await api.put(`/api/subtasks/updateSubtask/${subtask.subtaskId || subtask.id}`, subtaskData)
      if (response.data.success) {
        // 重新加载子任务列表
        await loadSubtasks()
        // 通知父组件数据发生变化
        if (onSubtaskChange) {
          onSubtaskChange()
        }
        // 触发全局事件，通知其他组件刷新进度
        window.dispatchEvent(new CustomEvent('subtaskStatusChanged', {
          detail: { subtaskId, newStatus, milestoneId }
        }));
      }
    } catch (error) {
      console.error("更新任务状态失败:", error)
      alert("更新任务状态失败")
    }
  }

  const getPriorityColor = (priority) => {
    const colors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" }
    return colors[priority] || colors.medium
  }
  
  const getPriorityText = (priority) => {
    const texts = { low: "低", medium: "中", high: "高" }
    return texts[priority] || "中"
  }
  
  const getStatusColor = (status) => {
    const colors = { in_progress: "#00d4ff", completed: "#10b981" }
    return colors[status] || colors.in_progress
  }
  
  const getStatusText = (status) => {
    const texts = { in_progress: "进行中", completed: "已完成" }
    return texts[status] || "进行中"
  }
  
  const formatDate = (datetimeStr) => (datetimeStr ? new Date(datetimeStr).toLocaleDateString() : "未设置")
  const formatDateForInput = (datetimeStr) => (datetimeStr ? new Date(datetimeStr).toISOString().split("T")[0] : "")

  const stats = {
    total: subtasks.length,
    inProgress: subtasks.filter((s) => s.status === "in_progress").length,
    completed: subtasks.filter((s) => s.status === "completed").length,
  }

  if (loading) return <div className="loading">加载子任务列表...</div>

  return (
    <div className="subtask-management">
      {/* 头部 */}
      <div className="subtask-header">
        <div className="header-content">
          <h2>📋 子任务管理</h2>
          <p>管理里程碑下的所有子任务</p>
        </div>
        {isProjectOwner && (
          <button className="create-subtask-btn" onClick={() => setShowCreateModal(true)}>
            + 创建子任务
          </button>
        )}
      </div>

      {/* 统计信息 */}
      <div className="subtask-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总任务</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>

      {/* 子任务列表 */}
      <div className="subtask-list">
        {subtasks.length === 0 ? (
          <div className="no-subtasks">
            <div className="no-subtasks-icon">📋</div>
            <h3>还没有子任务</h3>
            <p>创建第一个子任务来开始工作</p>
            {isProjectOwner && (
              <button className="create-first-subtask-btn" onClick={() => setShowCreateModal(true)}>
                创建子任务
              </button>
            )}
          </div>
        ) : (
          subtasks.map((subtask) => (
            <div key={subtask.subtaskId || subtask.id} className="subtask-item">
              <div className="subtask-main">
                <div className="subtask-info">
                  <h3 className="subtask-title">{subtask.title}</h3>
                  {subtask.description && (
                    <p className="subtask-description">{subtask.description}</p>
                  )}
                  <div className="subtask-meta">
                    {subtask.assignee && (
                      <span className="assignee">
                        <span className="assignee-icon">👤</span>
                        {subtask.assignee}
                      </span>
                    )}
                    {subtask.endTime && (
                      <span className="due-date">
                        <span className="date-icon">📅</span>
                        {formatDate(subtask.endTime)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="subtask-actions">
                  <div className="subtask-badges">
                    <span 
                      className="status-badge" 
                      style={{ background: getStatusColor(subtask.status) }}
                    >
                      {getStatusText(subtask.status)}
                    </span>
                    <span 
                      className="priority-badge" 
                      style={{ background: getPriorityColor(convertNumberToPriority(subtask.priority)) }}
                    >
                      {getPriorityText(convertNumberToPriority(subtask.priority))}
                    </span>
                  </div>
                  
                  <div className="action-buttons">
                    <Link
                      to={`/subtask/${subtask.subtaskId || subtask.id}`}
                      className="action-btn primary"
                    >
                      详细
                    </Link>
                    {isProjectOwner && (
                      <>
                        {subtask.status === "completed" && (
                          <button
                            className="action-btn secondary"
                            onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "in_progress")}
                          >
                            重新打开
                          </button>
                        )}
                      </>
                    )}
                   
                    {isProjectOwner && (
                      <div className="subtask-edit-actions">
                        <button 
                          className="action-btn secondary"
                          onClick={() => setEditingSubtask({
                            ...subtask,
                            priority: convertNumberToPriority(subtask.priority),
                            startTime: formatDateForInput(subtask.startTime),
                            endTime: formatDateForInput(subtask.endTime),
                          })}
                        >
                          编辑
                        </button>
                        <button 
                          className="action-btn danger"
                          onClick={() => handleDeleteSubtask(subtask.subtaskId || subtask.id)}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 创建子任务模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建子任务</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubtask} className="modal-body">
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="请输入任务标题"
                  required
                />
              </div>

              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows="3"
                />
              </div>

                             <div className="form-row">
                 <div className="form-group">
                   <label>指派给</label>
                   <select
                     value={newSubtask.assignee}
                     onChange={(e) => setNewSubtask({ ...newSubtask, assignee: e.target.value })}
                     className="form-select"
                   >
                     <option value="">选择负责人</option>
                     {projectMembers.map((member) => (
                       <option key={member.username} value={member.username}>
                         {member.username} ({member.role})
                       </option>
                     ))}
                   </select>
                 </div>

                                 <div className="form-group">
                   <label>优先级</label>
                   <select
                     value={newSubtask.priority}
                     onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                   >
                     <option value="low">低</option>
                     <option value="medium">中</option>
                     <option value="high">高</option>
                   </select>
                 </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={newSubtask.startTime}
                    onChange={(e) => setNewSubtask({ ...newSubtask, startTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>截止时间</label>
                  <input
                    type="date"
                    value={newSubtask.endTime}
                    onChange={(e) => setNewSubtask({ ...newSubtask, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit">创建任务</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑子任务模态框 */}
      {editingSubtask && (
        <div className="modal-overlay" onClick={() => setEditingSubtask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑子任务</h3>
              <button className="close-btn" onClick={() => setEditingSubtask(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateSubtask} className="modal-body">
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={editingSubtask.title}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                  placeholder="请输入任务标题"
                  required
                />
              </div>

              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  value={editingSubtask.description}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows="3"
                />
              </div>

                             <div className="form-row">
                 <div className="form-group">
                   <label>指派给</label>
                   <select
                     value={editingSubtask.assignee}
                     onChange={(e) => setEditingSubtask({ ...editingSubtask, assignee: e.target.value })}
                     className="form-select"
                   >
                     <option value="">选择负责人</option>
                     {projectMembers.map((member) => (
                       <option key={member.username} value={member.username}>
                         {member.username} ({member.role})
                       </option>
                     ))}
                   </select>
                 </div>

                                 <div className="form-group">
                   <label>优先级</label>
                   <select
                     value={editingSubtask.priority}
                     onChange={(e) => setEditingSubtask({ ...editingSubtask, priority: e.target.value })}
                   >
                     <option value="low">低</option>
                     <option value="medium">中</option>
                     <option value="high">高</option>
                   </select>
                 </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={editingSubtask.startTime}
                    onChange={(e) => setEditingSubtask({ ...editingSubtask, startTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>截止时间</label>
                  <input
                    type="date"
                    value={editingSubtask.endTime}
                    onChange={(e) => setEditingSubtask({ ...editingSubtask, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>状态</label>
                <select
                  value={editingSubtask.status}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, status: e.target.value })}
                >
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingSubtask(null)}>
                  取消
                </button>
                <button type="submit">更新任务</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubtaskManagement










