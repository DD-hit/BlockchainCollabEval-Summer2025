"use client"

import { useState, useEffect } from "react"
import api from "../../utils/api"
import MemberSelector from "../Common/MemberSelector"
import "./SubtaskManagement.css"

const SubtaskManagement = ({ projectId, milestoneId, isProjectOwner }) => {
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [viewingSubtask, setViewingSubtask] = useState(null)
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    status: "todo",
    startTime: "",
    endTime: "",
  })

  // 添加优先级转换辅助函数
  const convertPriorityToNumber = (priority) => {
    const priorityMap = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4
    };
    return priorityMap[priority] || 2; // 默认中等优先级
  }

  useEffect(() => {
    loadSubtasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneId])

  const loadSubtasks = async () => {
    try {
      const response = await api.get(`/api/subtasks/getSubtaskList/${milestoneId}`) // 修正路径
      if (response.data.success) {
        setSubtasks(response.data.data || [])
      }
    } catch (error) {
      console.error("加载子任务列表失败:", error)
    } finally {
      setLoading(false)
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
        status: newSubtask.status || "todo",
        description: newSubtask.description.trim() || null,
        assignedTo: newSubtask.assignee || null,
        // 转换为MySQL DATETIME格式 (YYYY-MM-DD HH:mm:ss)
        startTime: newSubtask.startTime ? new Date(newSubtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: newSubtask.endTime ? new Date(newSubtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: convertPriorityToNumber(newSubtask.priority), // 转换为数字
      }

      console.log('发送的子任务数据:', subtaskData) // 调试日志

      const response = await api.post("/api/subtasks/createSubtask", subtaskData)
      if (response.data.success) {
        setSubtasks([...subtasks, response.data.data])
        setNewSubtask({
          title: "",
          description: "",
          assignee: "",
          priority: "medium",
          status: "todo",
          startTime: "",
          endTime: "",
        })
        setShowCreateModal(false)
        alert("子任务创建成功")
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
        status: editingSubtask.status || "todo",
        description: editingSubtask.description?.trim() || null,
        assignedTo: editingSubtask.assignee || null,
        // 转换为MySQL DATETIME格式
        startTime: editingSubtask.startTime ? new Date(editingSubtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: editingSubtask.endTime ? new Date(editingSubtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: convertPriorityToNumber(editingSubtask.priority), // 转换为数字
      }

      console.log('更新的子任务数据:', subtaskData) // 调试日志

      const response = await api.put(`/api/subtasks/updateSubtask/${editingSubtask.subtaskId || editingSubtask.id}`, subtaskData)
      if (response.data.success) {
        setSubtasks(subtasks.map((s) => (s.subtaskId === editingSubtask.subtaskId ? response.data.data : s)))
        setEditingSubtask(null)
        alert("子任务更新成功")
      }
    } catch (error) {
      console.error("更新子任务失败:", error)
      alert("更新子任务失败")
    }
  }

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("确定要删除这个子任务吗？")) return

    try {
      const response = await api.delete(`/api/subtasks/deleteSubtask/${subtaskId}`) // 修正路径
      if (response.data.success) {
        setSubtasks(subtasks.filter((s) => s.id !== subtaskId))
        alert("子任务删除成功")
      }
    } catch (error) {
      console.error("删除子任务失败:", error)
      alert("删除子任务失败")
    }
  }

  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      // 找到要更新的子任务
      const subtask = subtasks.find(s => s.subtaskId === subtaskId || s.id === subtaskId);
      if (!subtask) {
        alert("找不到要更新的子任务");
        return;
      }

      // 使用现有的更新接口，只更新状态
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
        setSubtasks(subtasks.map((s) => 
          (s.subtaskId === subtaskId || s.id === subtaskId) 
            ? { ...s, status: newStatus } 
            : s
        ))
      }
    } catch (error) {
      console.error("更新任务状态失败:", error)
      alert("更新任务状态失败")
    }
  }

  const getPriorityColor = (priority) => {
    const colors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444", urgent: "#dc2626" }
    return colors[priority] || colors.medium
  }
  const getPriorityText = (priority) => {
    const texts = { low: "低", medium: "中", high: "高", urgent: "紧急" }
    return texts[priority] || "中"
  }
  const getStatusColor = (status) => {
    const colors = { todo: "#64748b", in_progress: "#00d4ff", review: "#f59e0b", done: "#10b981" }
    return colors[status] || colors.todo
  }
  const getStatusText = (status) => {
    const texts = { todo: "待开始", in_progress: "进行中", review: "待审核", done: "已完成" }
    return texts[status] || "待开始"
  }
  const formatDate = (datetimeStr) => (datetimeStr ? new Date(datetimeStr).toLocaleDateString() : "未设置")
  const formatDateForInput = (datetimeStr) => (datetimeStr ? new Date(datetimeStr).toISOString().split("T")[0] : "")

  const stats = {
    total: subtasks.length,
    todo: subtasks.filter((s) => s.status === "todo").length,
    inProgress: subtasks.filter((s) => s.status === "in_progress").length,
    review: subtasks.filter((s) => s.status === "review").length,
    done: subtasks.filter((s) => s.status === "done").length,
  }

  if (loading) return <div className="loading">加载子任务列表...</div>

  return (
    <div className="subtask-management">
      <div className="subtask-header">
        <h3>📋 子任务管理</h3>
        {isProjectOwner && (
          <button className="create-subtask-btn" onClick={() => setShowCreateModal(true)}>
            + 创建子任务
          </button>
        )}
      </div>

      <div className="subtask-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总任务</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.todo}</div>
          <div className="stat-label">待开始</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.review}</div>
          <div className="stat-label">待审核</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.done}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>

      <div className="task-board">
        {["todo", "in_progress", "review", "done"].map((status) => (
          <div key={status} className="task-column">
            <div className="column-header">
              <h4>{getStatusText(status)}</h4>
              <span className="task-count">{subtasks.filter((s) => s.status === status).length}</span>
            </div>

            <div className="task-list">
              {subtasks
                .filter((s) => s.status === status)
                .map((subtask) => (
                  <div key={subtask.subtaskId || subtask.id} className="task-card">
                    <div className="task-header">
                      <h5 className="task-title" onClick={() => setViewingSubtask(subtask)}>
                        {subtask.title}
                      </h5>
                      <div className="task-actions">
                        <span className="priority-badge" style={{ background: getPriorityColor(subtask.priority) }}>
                          {getPriorityText(subtask.priority)}
                        </span>
                        {isProjectOwner && (
                          <div className="action-dropdown">
                            <button className="action-btn">⋯</button>
                            <div className="dropdown-menu">
                              <button
                                onClick={() =>
                                  setEditingSubtask({
                                    ...subtask,
                                    startTime: formatDateForInput(subtask.startTime),
                                    endTime: formatDateForInput(subtask.endTime),
                                  })
                                }
                              >
                                编辑
                              </button>
                              <button onClick={() => handleDeleteSubtask(subtask.subtaskId || subtask.id)}>删除</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {subtask.description && <p className="task-description">{subtask.description}</p>}

                    <div className="task-meta">
                      {subtask.assignee && (
                        <div className="assignee">
                          <span className="assignee-avatar">👤</span>
                          <span className="assignee-name">{subtask.assignee}</span>
                        </div>
                      )}

                      <div className="task-dates">
                        {subtask.endTime && <span className="due-date">📅 {formatDate(subtask.endTime)}</span>}
                      </div>
                    </div>

                    <div className="status-actions">
                      {status === "todo" && (
                        <button
                          className="status-btn start-btn"
                          onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "in_progress")}
                        >
                          开始任务
                        </button>
                      )}
                      {status === "in_progress" && (
                        <>
                          <button
                            className="status-btn review-btn"
                            onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "review")}
                          >
                            提交审核
                          </button>
                          <button
                            className="status-btn pause-btn"
                            onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "todo")}
                          >
                            暂停
                          </button>
                        </>
                      )}
                      {status === "review" && isProjectOwner && (
                        <>
                          <button
                            className="status-btn approve-btn"
                            onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "done")}
                          >
                            通过
                          </button>
                          <button
                            className="status-btn reject-btn"
                            onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "in_progress")}
                          >
                            退回
                          </button>
                        </>
                      )}
                      {status === "done" && isProjectOwner && (
                        <button
                          className="status-btn reopen-btn"
                          onClick={() => handleStatusChange(subtask.subtaskId || subtask.id, "in_progress")}
                        >
                          重新打开
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {subtasks.length === 0 && (
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
      )}

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
                  <MemberSelector
                    projectId={projectId}
                    selectedMember={newSubtask.assignee}
                    onMemberSelect={(member) => setNewSubtask({ ...newSubtask, assignee: member.username })}
                    placeholder="选择负责人"
                  />
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
                    <option value="urgent">紧急</option>
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
                  <MemberSelector
                    projectId={projectId}
                    selectedMember={editingSubtask.assignee}
                    onMemberSelect={(member) => setEditingSubtask({ ...editingSubtask, assignee: member.username })}
                    placeholder="选择负责人"
                  />
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
                    <option value="urgent">紧急</option>
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
                  <option value="todo">待开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="review">待审核</option>
                  <option value="done">已完成</option>
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

      {viewingSubtask && (
        <div className="modal-overlay" onClick={() => setViewingSubtask(null)}>
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>任务详情</h3>
              <button className="close-btn" onClick={() => setViewingSubtask(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>{viewingSubtask.title}</h4>
                <div className="detail-badges">
                  <span className="status-badge" style={{ background: getStatusColor(viewingSubtask.status) }}>
                    {getStatusText(viewingSubtask.status)}
                  </span>
                  <span className="priority-badge" style={{ background: getPriorityColor(viewingSubtask.priority) }}>
                    {getPriorityText(viewingSubtask.priority)}优先级
                  </span>
                </div>
              </div>

              {viewingSubtask.description && (
                <div className="detail-section">
                  <h5>任务描述</h5>
                  <p>{viewingSubtask.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h5>任务信息</h5>
                <div className="detail-info">
                  <div className="info-item">
                    <span className="info-label">指派给:</span>
                    <span className="info-value">{viewingSubtask.assignee || "未指派"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">开始时间:</span>
                    <span className="info-value">{formatDate(viewingSubtask.startTime)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">截止时间:</span>
                    <span className="info-value">{formatDate(viewingSubtask.endTime)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">创建时间:</span>
                    <span className="info-value">{formatDate(viewingSubtask.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubtaskManagement










