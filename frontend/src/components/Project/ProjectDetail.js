"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import MemberManagement from "../Member/MemberManagement"
import ContributionVisualization from "../Member/ContributionVisualization"
import MilestoneManagement from "../Milestone/MilestoneManagement"
import MemberSelector from "../Common/MemberSelector"
import { projectAPI } from "../../utils/api"
import "./ProjectDetail.css"

function datetimeToInputs(datetimeStr) {
  if (!datetimeStr) return { date: "", time: "" }
  const d = new Date(datetimeStr)
  const pad = (n) => String(n).padStart(2, "0")
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export default function ProjectDetail() {
  const { projectId } = useParams() // 修改参数名匹配路由
  const projectIdNum = Number(projectId)
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [edit, setEdit] = useState({ name: "", description: "", ownerId: null })

  // 添加编辑功能
  const onOpenEdit = () => {
    if (data) {
      setEdit({
        name: data.projectName || data.name,
        description: data.description || "",
        ownerId: data.projectOwner
      })
      setEditOpen(true)
    }
  }

  useEffect(() => {
    let canceled = false
    ;(async () => {
      setLoading(true)
      console.log('加载项目详情, ID:', projectIdNum); // 调试日志
      const res = await projectAPI.detail(projectIdNum)
      if (canceled) return
      if (res.ok) {
        setData(res.data)
        console.log('项目详情数据:', res.data); // 调试日志
      } else {
        console.error('获取项目详情失败:', res.error);
      }
      setLoading(false)
    })()
    return () => {
      canceled = true
    }
  }, [projectIdNum])

  if (loading) return <div className="project-detail container">加载中...</div>
  if (!data) return <div className="project-detail container">未找到项目</div>

  return (
    <div className="project-detail container">
      <div className="header">
        <div>
          <h2>{data.projectName || data.name}</h2>
          <div className="meta">
            <span>负责人：{data.projectOwner || "未设置"}</span>
            <span>创建时间：{data.createTime ? new Date(data.createTime).toLocaleString() : '未知'}</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={onOpenEdit}>编辑项目</button>
          <Link className="btn" to="/projects">
            返回列表
          </Link>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
          项目概览
        </button>
        <button className={tab === "members" ? "active" : ""} onClick={() => setTab("members")}>
          成员管理
        </button>
        <button className={tab === "milestones" ? "active" : ""} onClick={() => setTab("milestones")}>
          里程碑管理
        </button>
      </div>

      {tab === "overview" && (
        <div className="section">
          <h3>基础信息</h3>
          <p>{data.description || "无描述"}</p>
          <div className="grid">
            <div className="card">
              <div>开始时间</div>
              <div>{data.startTime ? new Date(data.startTime).toLocaleString() : "未设置"}</div>
            </div>
            <div className="card">
              <div>结束时间</div>
              <div>{data.endTime ? new Date(data.endTime).toLocaleString() : "未设置"}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="section">
          <MemberManagement projectId={projectIdNum} />
          <div className="divider" />
          <ContributionVisualization projectId={projectIdNum} />
        </div>
      )}

      {tab === "milestones" && (
        <div className="section">
          <MilestoneManagement projectId={projectIdNum} />
        </div>
      )}
    </div>
  )
}



