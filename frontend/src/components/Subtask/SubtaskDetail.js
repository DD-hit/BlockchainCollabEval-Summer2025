"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import api, { fileAPI } from "../../utils/api"
import ScoreModal from "../Score/ScoreModal"
import { calculateSubtaskStatus, getStatusColor, getStatusText } from "../../utils/overdueUtils"
import "./SubtaskDetail.css"

const SubtaskDetail = () => {
  const { subtaskId } = useParams()
  const [subtask, setSubtask] = useState(null)
  const [files, setFiles] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileDescription, setFileDescription] = useState("")
  const [currentUser, setCurrentUser] = useState("")
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedFileForScore, setSelectedFileForScore] = useState(null)

  // 添加密码输入模态框状态
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [pendingUpload, setPendingUpload] = useState(null)

  useEffect(() => {
    const username = sessionStorage.getItem('username')
    setCurrentUser(username)
    loadSubtask()
    loadFiles()
    loadComments()
  }, [subtaskId])

  const loadSubtask = async () => {
    try {
      const response = await api.get(`/api/subtasks/getSubtaskDetail/${subtaskId}`)
      if (response.data.success) {
        setSubtask(response.data.data)
      }
    } catch (error) {
      console.error("加载子任务失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const response = await api.get(`/api/files/subtask/${subtaskId}`)
      
      if (response.data.success) {
        const filesData = response.data.data || [];
        
        setFiles(filesData)
      }
    } catch (error) {
      console.error("加载文件失败:", error)
    }
  }

  const loadComments = async () => {
    try {
      const response = await api.get(`/api/comments/subtask/${subtaskId}`)
      if (response.data.success) {
        setComments(response.data.data || [])
      }
    } catch (error) {
      console.error("加载评论失败:", error)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert("请选择文件")
      return
    }

    if (!fileDescription.trim()) {
      alert("请填写文件描述")
      return
    }

    // 显示密码输入模态框
    setPendingUpload({ file: selectedFile, description: fileDescription })
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      alert('请输入密码')
      return
    }

    if (!pendingUpload) return

    setUploadingFile(true)
    setShowPasswordModal(false)
    
    try {
      const result = await fileAPI.uploadToSubtask(subtaskId, pendingUpload.file, password.trim())
      
      if (result.ok) {
        alert("文件上传成功！\n系统已自动创建评分合约，其他成员将收到评分通知。\n请提醒成员及时评分，否则将扣除贡献点。")
        setSelectedFile(null)
        setFileDescription("")
        setShowFileUpload(false)
        setPassword("")
        setPendingUpload(null)
        loadFiles()
        // 上传成功后刷新评论
        setTimeout(() => {
          loadComments()
        }, 1000)
      } else {
        alert(`上传失败: ${result.error?.message || '未知错误'}`)
      }
    } catch (error) {
      console.error("文件上传失败:", error)
      alert("文件上传失败")
    } finally {
      setUploadingFile(false)
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPassword("")
    setPendingUpload(null)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) {
      alert("请输入评论内容")
      return
    }

    setSubmittingComment(true)
    try {
      const response = await api.post('/api/comments/create', {
        subtaskId: subtaskId,
        content: newComment.trim()
      })
      
      if (response.data.success) {
        setNewComment("")
        loadComments()
      }
    } catch (error) {
      console.error("提交评论失败:", error)
      alert("提交评论失败")
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleScoreClick = (file) => {
    setSelectedFileForScore(file)
    setShowScoreModal(true)
  }

  const handleDetailsClick = (file) => {
    setSelectedFileForScore({ ...file, isDetailsView: true })
    setShowScoreModal(true)
  }

  const handleScoreSubmitted = () => {
    loadFiles()
    // 触发贡献排行榜刷新
    const event = new CustomEvent('contributionUpdated', {
      detail: { timestamp: Date.now() }
    })
    window.dispatchEvent(event)
  }

  const handleCloseSubtask = async () => {
    if (!window.confirm("确定要关闭这个子任务吗？关闭后任务状态将变为已完成。")) {
      return
    }

    try {
      const subtaskData = {
        title: subtask.title,
        status: "completed",
        description: subtask.description || null,
        assignedTo: subtask.assignedTo || null,
        startTime: subtask.startTime ? new Date(subtask.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        endTime: subtask.endTime ? new Date(subtask.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        priority: subtask.priority || 2,
      }

      const response = await api.put(`/api/subtasks/updateSubtask/${subtaskId}`, subtaskData)
      if (response.data.success) {
        setSubtask({ ...subtask, status: "completed" })
        alert("子任务已成功关闭！")
        
        // 触发全局事件，通知其他组件刷新进度
        window.dispatchEvent(new CustomEvent('subtaskStatusChanged', {
          detail: { 
            action: 'close', 
            subtaskId, 
            newStatus: 'completed',
            milestoneId: subtask.milestoneId 
          }
        }));
      }
    } catch (error) {
      console.error("关闭子任务失败:", error)
      alert("关闭子任务失败")
    }
  }

  // 获取实际状态（考虑逾期情况）
  const getActualStatus = (subtask) => {
    return calculateSubtaskStatus(subtask)
  }

  const getPriorityText = (priority) => {
    const priorityMap = {
      'low': '低',
      'medium': '中',
      'high': '高'
    }
    return priorityMap[priority] || priority
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "未设置"
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="subtask-detail-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!subtask) {
    return (
      <div className="subtask-detail-error">
        <div className="error-icon">⚠️</div>
        <h2>子任务不存在</h2>
        <p>请检查任务ID是否正确</p>
        <button className="btn-primary" onClick={() => window.history.back()}>
          返回上一页
        </button>
      </div>
    )
  }

  const isAssignee = subtask.assignedTo === currentUser
  const actualStatus = getActualStatus(subtask)
  const canUpload = isAssignee && (actualStatus === 'in_progress' || actualStatus === 'overdue')

  return (
    <div className="subtask-detail-container">
      <div className="subtask-content">
        {/* 集成卡片：任务标题 + 信息 + 描述 + 文件上传 */}
        <div className="content-card integrated-card">
          <div className="card-header main-task-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => window.history.back()}>
                <span className="back-icon">←</span>
                返回
              </button>
              <div className="task-info">
                <h1 className="task-title">{subtask.title}</h1>
                <div className="task-meta">
                  <span 
                    className="status-badge" 
                    style={{ background: getStatusColor(getActualStatus(subtask)) }}
                  >
                    {getStatusText(getActualStatus(subtask))}
                  </span>
                  <span className="priority-badge">
                    {getPriorityText(subtask.priority)}优先级
                  </span>
                  {subtask.assignedTo && (
                    <span className="assignee-badge">
                      👤 {subtask.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {/* 任务详情标题 */}
            <div className="section-content">
              <h4 className="section-title">📋 任务详情</h4>
              {/* 任务信息网格 */}
              <div className="task-info-grid">
                <div className="info-item">
                  <div className="info-icon">👤</div>
                  <div className="info-content">
                    <span className="info-label">负责人</span>
                    <span className="info-value">{subtask.assignedTo || "未分配"}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <span className="info-label">开始时间</span>
                    <span className="info-value">{formatDate(subtask.startTime)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">⏰</div>
                  <div className="info-content">
                    <span className="info-label">截止时间</span>
                    <span className="info-value">{formatDate(subtask.endTime)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">🎯</div>
                  <div className="info-content">
                    <span className="info-label">优先级</span>
                    <span className="info-value">{getPriorityText(subtask.priority)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">📊</div>
                  <div className="info-content">
                    <span className="info-label">状态</span>
                    <span className="info-value">{getStatusText(getActualStatus(subtask))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="section-divider"></div>

            {/* 任务描述 */}
            <div className="section-content">
              <h4 className="section-title">📝 任务描述</h4>
              <div className="description-content">
                {subtask.description || "暂无描述"}
              </div>
            </div>

            {/* 文件上传区域 */}
            {canUpload && (
              <>
                <div className="section-divider"></div>
                <div className="section-content">
                  <h4 className="section-title">📁 上传贡献文件</h4>
                  {!showFileUpload ? (
                    <div className="upload-simple">
                      <p className="upload-hint">上传文件后将自动创建评分合约，通知其他成员进行评分</p>
                      <button 
                        className="btn-primary"
                        onClick={() => setShowFileUpload(true)}
                      >
                        上传文件
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFileUpload} className="upload-form">
                      <div className="form-group">
                        <label>选择文件 *</label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="file-input"
                          accept="image/*,.pdf,.txt,application/zip,application/x-zip-compressed,.zip,application/x-rar-compressed,.rar"
                          required
                        />
                        <small className="file-hint">支持图片、PDF、文本、压缩包等格式，最大5MB</small>
                      </div>
                      <div className="form-group">
                        <label>文件描述 *</label>
                        <textarea
                          value={fileDescription}
                          onChange={(e) => setFileDescription(e.target.value)}
                          placeholder="详细描述这个文件的用途、贡献内容..."
                          rows="4"
                          className="description-input"
                          required
                        />
                      </div>
                      <div className="upload-actions">
                        <button 
                          type="button" 
                          className="btn-secondary"
                          onClick={() => setShowFileUpload(false)}
                          disabled={uploadingFile}
                        >
                          取消
                        </button>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? "上传中..." : "上传并创建评分合约"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 已上传的文件列表 */}
        {files.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <h3>📎 已上传文件</h3>
              <span className="file-count">{files.length} 个文件</span>
            </div>
            <div className="card-body">
              <div className="files-grid">
                {files.map((file) => (
                  <div key={file.id} className="file-card">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{file.originalName}</div>
                      <div className="file-meta">
                        <span className="file-uploader">上传者: {file.username}</span>
                        <span className="file-time">{formatDate(file.uploadTime)}</span>
                      </div>
                      {file.description && (
                        <div className="file-description">{file.description}</div>
                      )}
                      {file.address && file.address !== 'undefined' && (
                        <div className="contract-info">
                          <span className="contract-badge">📋 评分合约已创建</span>
                          <span className="contract-address">{file.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="file-actions">
                      {file.address && file.address !== 'undefined' && file.username !== currentUser && (
                        <button 
                          className="score-btn"
                          onClick={() => handleScoreClick(file)}
                        >
                          📊 评分
                        </button>
                      )}
                      {file.address && file.address !== 'undefined' && (
                        <button 
                          className="details-btn"
                          onClick={() => handleDetailsClick(file)}
                        >
                          📋 详情
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 评论区 */}
        <div className="content-card">
          <div className="card-header">
            <h3>💬 讨论区</h3>
            <span className="comment-count">{comments.length} 条评论</span>
          </div>
          <div className="card-body">
            {/* 发表评论 */}
            <div className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="发表你的评论..."
                rows="3"
                className="comment-input"
              />
              <div className="comment-actions">
                <button 
                  className="btn-primary"
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? "发送中..." : "发送评论"}
                </button>
              </div>
            </div>

            {/* 评论列表 */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">
                  <div className="no-comments-icon">💬</div>
                  <p>还没有评论，来发表第一条评论吧！</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      <span className="avatar-text">{comment.username?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.username}</span>
                        <span className="comment-time">{formatDate(comment.time)}</span>
                      </div>
                      <div className="comment-text">{comment.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 关闭子任务按钮 */}
        {subtask && subtask.status !== "completed" && (
          <div className="close-subtask-section">
            <button 
              className="close-subtask-btn"
              onClick={handleCloseSubtask}
            >
              🔒 关闭子任务
            </button>
          </div>
        )}
      </div>

      {/* 密码输入模态框 */}
      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <div className="password-modal-header">
              <h3>身份验证</h3>
            </div>
            <div className="password-modal-body">
              <p>请输入您的密码以验证身份:</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
            </div>
            <div className="password-modal-actions">
              <button onClick={handlePasswordCancel} className="btn-secondary">
                取消
              </button>
              <button onClick={handlePasswordSubmit} className="btn-primary">
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评分模态框 */}
      {showScoreModal && selectedFileForScore && (
        <ScoreModal
          file={selectedFileForScore}
          user={{ 
            username: currentUser, 
            address: sessionStorage.getItem('address') || sessionStorage.getItem('userAddress')
          }}
          onClose={() => {
            setShowScoreModal(false)
            setSelectedFileForScore(null)
          }}
          onScoreSubmitted={handleScoreSubmitted}
        />
      )}
    </div>
  )
}

export default SubtaskDetail
