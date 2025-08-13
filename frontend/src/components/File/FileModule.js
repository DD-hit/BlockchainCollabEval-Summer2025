"use client"

import { useEffect, useState } from "react"
import { fileAPI } from "../../utils/api"
import { useNotifications } from "../../context/notifications"
import { useScore } from "../Score/ScoreProvider"
import "./FileModule.css"

export default function FileModule({ projectId, subtaskId }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { addNotification } = useNotifications()
  const { openScore } = useScore()

  const load = async () => {
    setLoading(true)
    const res = await fileAPI.listBySubtask(subtaskId)
    if (res.ok) {
      setList(Array.isArray(res.data) ? res.data : res.data?.list || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [subtaskId])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 提示用户输入密码
    const password = prompt("请输入您的密码以验证身份：")
    if (!password) return
    
    setUploading(true)
    const res = await fileAPI.uploadToSubtask(subtaskId, file, password)
    setUploading(false)
    if (res.ok) {
      addNotification({
        type: "file",
        title: "文件上传成功",
        message: file.name,
        meta: { projectId, subtaskId, fileId: res.data?.id },
      }, false)
      load()
    } else {
      alert(res.error?.message || "上传失败")
    }
  }

  const onDownload = async (item) => {
    const res = await fileAPI.download(item.id)
    if (res.ok) {
      const blob = res.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = item.name || `file-${item.id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } else {
      alert(res.error?.message || "下载失败")
    }
  }

  const openScoreModal = (item) => {
    openScore({
      file: item,
      projectId,
      subtaskId,
      onScored: () => {
        // refresh file list if score affects file status
        load()
      },
    })
  }

  return (
    <div className="file-module">
      <div className="file-actions">
        <label className="upload-btn">
          {uploading ? "上传中..." : "上传文件"}
          <input type="file" onChange={onUpload} disabled={uploading} style={{ display: "none" }} />
        </label>
      </div>

      <div className="file-list">
        {loading ? (
          <div>加载中...</div>
        ) : list.length === 0 ? (
          <div>暂无文件</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>大小</th>
                <th>状态</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td>{f.name || f.filename}</td>
                  <td>{typeof f.size === "number" ? `${(f.size / 1024).toFixed(1)} KB` : "-"}</td>
                  <td>{f.status || "-"}</td>
                  <td>{f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}</td>
                  <td>
                    <button onClick={() => onDownload(f)}>下载</button>
                    <button onClick={() => openScoreModal(f)} style={{ marginLeft: 8 }}>
                      评分
                    </button>
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
