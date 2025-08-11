"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { subtaskAPI } from "../../utils/api"
import CommentModule from "../Comment/CommentModule"
import FileModule from "../File/FileModule"
import "./SubtaskDetail.css"

export default function SubtaskDetail() {
  const { subtaskId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await subtaskAPI.detail(subtaskId)
    if (res.ok) setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [subtaskId])

  const onCloseTask = async () => {
    if (!window.confirm("确认关闭该任务？")) return
    setClosing(true)
    const res = await subtaskAPI.close(subtaskId)
    setClosing(false)
    if (res.ok) {
      await load()
    } else {
      alert(res.error?.message || "关闭失败")
    }
  }

  if (loading) return <div className="subtask-detail container">加载中...</div>
  if (!data) return <div className="subtask-detail container">未找到任务</div>

  return (
    <div className="subtask-detail container">
      <div className="header">
        <div>
          <h2>{data.title}</h2>
          <div className="meta">
            <span>状态：{data.status}</span>
            <span>所属里程碑：{data.milestoneName || data.milestoneId}</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={onCloseTask} disabled={closing || data.status === "completed"}>
            {closing ? "关闭中..." : data.status === "completed" ? "已完成" : "关闭任务"}
          </button>
        </div>
      </div>

      <div className="grid-two">
        <div className="panel">
          <h3>评论</h3>
          <CommentModule projectId={data.projectId} subtaskId={data.id} />
        </div>

        <div className="panel">
          <h3>文件</h3>
          <FileModule projectId={data.projectId} subtaskId={data.id} />
        </div>
      </div>
    </div>
  )
}
