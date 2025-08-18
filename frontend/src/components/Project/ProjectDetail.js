"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import MemberManagement from "../Member/MemberManagement"
import MilestoneManagement from "../Milestone/MilestoneManagement"
import { projectAPI, milestoneAPI, subtaskAPI, projectMemberAPI } from "../../utils/api"
import "./ProjectDetail.css"

export default function ProjectDetail() {
  const { projectId } = useParams() // 修改参数名匹配路由
  const projectIdNum = Number(projectId)
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [edit, setEdit] = useState({ 
    name: "", 
    description: "", 
    startTime: "", 
    endTime: "", 
    ownerId: null 
  })
  const [projectStats, setProjectStats] = useState({
    completedMilestones: 0,
    inProgressMilestones: 0,
    totalMembers: 0,
    projectProgress: 0
  })

  // 添加编辑功能
  const onOpenEdit = () => {
    if (data) {
      setEdit({
        name: data.projectName || data.name,
        description: data.description || "",
        startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "",
        endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "",
        ownerId: data.projectOwner
      })
      setEditOpen(true)
    }
  }

  // 添加保存编辑功能
  const onSaveEdit = async () => {
    try {
      const res = await projectAPI.update(projectIdNum, {
        projectName: edit.name,
        description: edit.description,
        startTime: edit.startTime || null,
        endTime: edit.endTime || null
      })
      if (res.ok) {
        setData({ 
          ...data, 
          projectName: edit.name, 
          description: edit.description,
          startTime: edit.startTime,
          endTime: edit.endTime
        })
        setEditOpen(false)
        alert('项目更新成功')
      } else {
        alert('更新失败: ' + res.error.message)
      }
    } catch (error) {
      console.error('更新项目失败:', error)
      alert('更新失败')
    }
  }

  // 添加关闭编辑功能
  const onCloseEdit = () => {
    setEditOpen(false)
  }

  // 计算项目统计数据
  const calculateProjectStats = async () => {
    try {
      // 获取项目成员数量
      const membersResponse = await projectMemberAPI.list(projectIdNum)
      const totalMembers = membersResponse.ok && membersResponse.data ? membersResponse.data.length : 0

      // 获取所有里程碑
      const milestonesResponse = await milestoneAPI.listByProject(projectIdNum)
      let completedMilestones = 0
      let inProgressMilestones = 0
      let totalSubtasks = 0
      let completedSubtasks = 0

      if (milestonesResponse.ok && milestonesResponse.data) {
        const milestones = Array.isArray(milestonesResponse.data) ? milestonesResponse.data : []
        
        // 遍历每个里程碑，统计里程碑状态和子任务信息
        for (const milestone of milestones) {
          // 统计里程碑状态
          if (milestone.status === 'completed') {
            completedMilestones++
          } else if (milestone.status === 'in_progress') {
            inProgressMilestones++
          }
          
          // 获取子任务信息用于计算总体进度
          try {
            const subtasksResponse = await subtaskAPI.list(milestone.milestoneId)
            if (subtasksResponse.ok && subtasksResponse.data) {
              const subtasks = Array.isArray(subtasksResponse.data) ? subtasksResponse.data : []
              totalSubtasks += subtasks.length
              
              subtasks.forEach(subtask => {
                if (subtask.status === 'completed') {
                  completedSubtasks++
                }
              })
            }
          } catch (error) {
            console.error(`获取里程碑 ${milestone.milestoneId} 的子任务失败:`, error)
          }
        }
      }

      // 计算项目进度百分比（基于子任务完成情况）
      const projectProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

      setProjectStats({
        completedMilestones,
        inProgressMilestones,
        totalMembers,
        projectProgress
      })
    } catch (error) {
      console.error('计算项目统计数据失败:', error)
    }
  }

  useEffect(() => {
    let canceled = false
    ;(async () => {
      setLoading(true)
  
      const res = await projectAPI.detail(projectIdNum)
      if (canceled) return
      if (res.ok) {
        setData(res.data)
        // 计算项目统计数据
        await calculateProjectStats()
      } else {
        console.error('获取项目详情失败:', res.error);
      }
      setLoading(false)
    })()
    return () => {
      canceled = true
    }
  }, [projectIdNum])

  // 监听任务状态变化，实时更新统计数据
  useEffect(() => {
    const handleTaskStatusChange = () => {
      calculateProjectStats()
    }

    // 监听子任务状态变化事件
    window.addEventListener('subtaskStatusChanged', handleTaskStatusChange)
    
    return () => {
      window.removeEventListener('subtaskStatusChanged', handleTaskStatusChange)
    }
  }, [projectIdNum])

  if (loading) return <div className="project-detail container">加载中...</div>
  if (!data) return <div className="project-detail container">未找到项目</div>

  return (
    <div className="project-detail">
      <div className="project-header">
        {/* Back button positioned at top-left */}
        <div className="back-button-container">
          <Link className="back-button" to="/projects">
            ← 返回列表
          </Link>
        </div>
        
        <div className="header-content">
          <div className="project-title-section">
            <div className="project-icon">
              🚀
            </div>
            <div className="project-info">
              <h1 className="project-title">{data.projectName || data.name}</h1>
              <div className="project-badges">
                <span className="owner-badge">👤 负责人：{data.projectOwner || "未设置"}</span>
              </div>
            </div>
          </div>
          <div className="project-actions">
            <button className="btn-primary" onClick={onOpenEdit}>
              ✏️ 编辑项目
            </button>
          </div>
        </div>
        
        {/* Project details section */}
        <div className="project-details-section">
          <div className="project-description">
            <h3>📋 项目描述</h3>
            <p>{data.description || "暂无项目描述"}</p>
          </div>
          <div className="project-timeline">
            <div className="timeline-item">
              <div className="timeline-icon">🕒</div>
              <div className="timeline-content">
                <span className="timeline-label">开始时间</span>
                <span className="timeline-value">{data.startTime ? new Date(data.startTime).toLocaleString() : "未设置"}</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">🎯</div>
              <div className="timeline-content">
                <span className="timeline-label">结束时间</span>
                <span className="timeline-value">{data.endTime ? new Date(data.endTime).toLocaleString() : "未设置"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button className={`tab-btn ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
          📊 项目概览
        </button>
        <button className={`tab-btn ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
          👥 成员管理
        </button>
        <button className={`tab-btn ${tab === "milestones" ? "active" : ""}`} onClick={() => setTab("milestones")}>
          🎯 里程碑管理
        </button>
      </div>

      {tab === "overview" && (
        <div className="tab-content">
          <div className="overview-section">
            <h3>📊 项目统计</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{projectStats.completedMilestones}</div>
                <div className="stat-label">已完成里程碑</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{projectStats.inProgressMilestones}</div>
                <div className="stat-label">进行中里程碑</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{projectStats.totalMembers}</div>
                <div className="stat-label">总成员数</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{projectStats.completedMilestones + projectStats.inProgressMilestones}</div>
                <div className="stat-label">总里程碑数</div>
              </div>
            </div>
            
            {/* 项目进度条 */}
            <div className="project-progress-section">
              <h4>🎯 项目进度</h4>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${projectStats.projectProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {projectStats.projectProgress}% 完成
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="tab-content">
          <MemberManagement 
            projectId={projectIdNum} 
            user={{ username: sessionStorage.getItem('username') }}
            isProjectOwner={data.projectOwner === sessionStorage.getItem('username')}
          />
        </div>
      )}

      {tab === "milestones" && (
        <div className="tab-content">
          <MilestoneManagement 
            projectId={projectIdNum} 
            user={{ username: sessionStorage.getItem('username') }}
            isProjectOwner={data.projectOwner === sessionStorage.getItem('username')}
          />
        </div>
      )}

      {/* 编辑项目模态框 */}
      {editOpen && (
        <div className="modal-overlay" onClick={onCloseEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑项目</h3>
              <button className="close-btn" onClick={onCloseEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目名称</label>
                <input
                  type="text"
                  value={edit.name}
                  onChange={(e) => setEdit({...edit, name: e.target.value})}
                  placeholder="请输入项目名称"
                  required
                />
              </div>
              <div className="form-group">
                <label>项目描述</label>
                <textarea
                  value={edit.description}
                  onChange={(e) => setEdit({...edit, description: e.target.value})}
                  placeholder="请输入项目描述"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>开始时间</label>
                <input
                  type="datetime-local"
                  value={edit.startTime}
                  onChange={(e) => setEdit({...edit, startTime: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input
                  type="datetime-local"
                  value={edit.endTime}
                  onChange={(e) => setEdit({...edit, endTime: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={onCloseEdit}>取消</button>
                <button type="button" onClick={onSaveEdit}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



