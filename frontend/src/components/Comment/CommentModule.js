"use client"

import { useEffect, useState } from "react"
import { commentAPI } from "../../utils/api"
import { useNotifications } from "../../context/notifications"
import "./CommentModule.css"

export default function CommentModule({ projectId, subtaskId, user }) {
  const [list, setList] = useState([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const { addNotification } = useNotifications()

  const load = async () => {
    setLoading(true)
    const res = await commentAPI.listBySubtask(subtaskId)
    if (res.ok) {
      const items = Array.isArray(res.data) ? res.data : res.data?.list || []
      setList(items)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [subtaskId])

  const post = async () => {
    if (!content.trim()) return
    setPosting(true)
    const res = await commentAPI.create({ subtaskId, content: content.trim(), mentions: [] })
    setPosting(false)
    if (res.ok) {
      setContent("")
      load()
      addNotification({
        type: "comment",
        title: "新评论",
        message: content.slice(0, 80),
        meta: { projectId, subtaskId },
      })
    } else {
      alert(res.error?.message || "发布失败")
    }
  }

  return (
    <div className="comment-module">
      <div className="comment-input">
        <textarea
          rows={3}
          placeholder="输入评论，支持 @成员 提醒"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="actions">
          <button onClick={post} disabled={posting}>
            {posting ? "发送中..." : "发送"}
          </button>
        </div>
      </div>

      <div className="comment-list">
        {loading ? (
          <div>加载中...</div>
        ) : list.length === 0 ? (
          <div>暂无评论</div>
        ) : (
          list.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="author">{c.authorName || c.authorUsername || "匿名"}</div>
              <div className="content">{c.content}</div>
              <div className="meta">{new Date(c.createdAt || Date.now()).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
