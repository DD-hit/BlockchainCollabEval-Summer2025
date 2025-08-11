"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import MemberSelector from "../Common/MemberSelector"
import { milestoneAPI } from "../../utils/api"
import "./MilestoneManagement.css"

function toDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  return `${dateStr} ${timeStr}:00` // 格式: YYYY-MM-DD HH:mm:ss
}

export default function MilestoneManagement({ projectId }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    ownerId: null,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  })

  const load = async () => {
    setLoading(true)
    const res = await milestoneAPI.listByProject(projectId)
    if (res.ok) {
      setList(Array.isArray(res.data) ? res.data : res.data?.list || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [projectId])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      alert("请输入里程碑名称")
      return
    }
    const payload = {
      projectId,
      title: form.name.trim(), // 改为title
      description: form.description.trim(),
      ownerId: form.ownerId,
      startDate: toDateTime(form.startDate, form.startTime), // 改为startDate
      endDate: toDateTime(form.endDate, form.endTime), // 改为endDate
    }
    setCreating(true)
    const res = await milestoneAPI.create(payload)
    setCreating(false)
    if (res.ok) {
      setForm({ name: "", description: "", ownerId: null, startDate: "", startTime: "", endDate: "", endTime: "" })
      load()
    } else {
      alert(res.error?.message || "创建失败")
    }
  }

  return (
    <div className="milestone-management">
      <h3>里程碑管理</h3>

      <form className="milestone-form" onSubmit={submit}>
        <div className="form-row">
          <label>名称</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="里程碑名称"
          />
        </div>
        <div className="form-row">
          <label>描述</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述"
          />
        </div>
        <div className="form-row">
          <label>负责人</label>
          <MemberSelector
            projectId={projectId}
            value={form.ownerId}
            onChange={(val) => setForm({ ...form, ownerId: val })}
          />
        </div>
        <div className="form-row">
          <label>时间范围</label>
          <div className="row">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <span style={{ padding: "0 8px" }}>至</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={creating}>
            {creating ? "创建中..." : "新增里程碑"}
          </button>
        </div>
      </form>

      <div className="list">
        {loading ? (
          <div>加载中...</div>
        ) : list.length === 0 ? (
          <div>暂无里程碑</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>负责人</th>
                <th>开始</th>
                <th>结束</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.milestoneId || m.id}>
                  <td>{m.title || m.name}</td>
                  <td>{m.ownerName || m.ownerUsername || m.ownerId || "-"}</td>
                  <td>{m.startTime ? new Date(m.startTime * 1000).toLocaleString() : "-"}</td>
                  <td>{m.endTime ? new Date(m.endTime * 1000).toLocaleString() : "-"}</td>
                  <td>
                    <Link to={`/project/${projectId}/milestone/${m.milestoneId || m.id}`}>详情</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



