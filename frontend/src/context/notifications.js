"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import "./notifications.css"

const NotificationsContext = createContext(null)

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider")
  return ctx
}

let nextId = 1

function buildWsUrl(base) {
  try {
    const u = new URL(base)
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
    // a common default path; adjust to your backend route if different
    u.pathname = (u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname) + "/ws/notifications"
    u.search = ""
    return u.toString()
  } catch {
    return ""
  }
}

export function NotificationsProvider({ children, connectSocket = true }) {
  const [items, setItems] = useState([])
  const [toasts, setToasts] = useState([])
  const socketRef = useRef(null)

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])

  const addNotification = (notification, showToast = false) => {

    const n = {
      id: notification.id || `n_${nextId++}`,
      title: notification.title || "通知",
      message: notification.message || "",
      type: notification.type || "info",
      timestamp: notification.timestamp || Date.now(),
      read: !!notification.read,
      link: notification.link || null,
      meta: notification.meta || {},
    }

    setItems((prev) => [n, ...prev])
    
    // 触发新通知事件，通知其他组件（如待办事项）刷新
    window.dispatchEvent(new CustomEvent('newNotification', {
      detail: { notification: n }
    }));
    
    // 禁用toast弹出，只在通知面板中显示
    if (showToast) {
      setToasts((prev) => [...prev, { id: `t_${nextId++}`, ...n }])
      // auto dismiss after 4s
      setTimeout(() => {
        setToasts((prev) => prev.slice(1))
      }, 4000)
    }
  }

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })))
  const clear = () => setItems([])

  // Optional WebSocket
  useEffect(() => {
    if (!connectSocket) return
    const base = (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) || ""
    const wsUrl = buildWsUrl(base)
    if (!wsUrl) return

    try {
      socketRef.current = new WebSocket(wsUrl)
      socketRef.current.onopen = () => {
        // console.log('Notifications WS connected')
      }
      socketRef.current.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          // data: { type, title, message, link, meta }
          if (data.type === "notification") {
            addNotification({
              type: data.meta?.type || "info",
              title: data.title || "新消息",
              message: data.message,
              link: data.link,
              meta: data.meta,
            })
          } else {
            addNotification({
              type: data.type || "info",
              title: data.title || "新消息",
              message: data.message,
              link: data.link,
              meta: data.meta,
            })
          }
        } catch {
          // ignore malformed
        }
      }
      socketRef.current.onerror = () => {
        // console.warn('Notifications WS error')
      }
      socketRef.current.onclose = () => {
        // console.log('Notifications WS closed')
      }
    } catch {
      // no-op
    }

    return () => {
      try {
        socketRef.current?.close()
      } catch {
        // no-op
      }
    }
  }, [connectSocket])

  const value = {
    items,
    unreadCount,
    addNotification,
    markAllRead,
    clear,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="notifications-toaster" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div>
              <div className="toast-title">{t.title}</div>
              {t.message ? <div>{t.message}</div> : null}
              <div className="toast-meta">{new Date(t.timestamp).toLocaleTimeString()}</div>
              {t.meta?.subtaskId && t.type === "file_upload" && (
                <button 
                  className="toast-action-btn"
                  onClick={() => {
                    // 跳转到子任务页面
                    window.location.href = t.link || `/subtask/${t.meta.subtaskId}`;
                  }}
                >
                  去评分
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}
