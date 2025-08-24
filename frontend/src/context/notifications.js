"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { notificationAPI } from "../utils/api"
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
  const [loading, setLoading] = useState(false)

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])

  // 从后端加载通知
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const username = sessionStorage.getItem('username');
      const token = sessionStorage.getItem('token');
      
      if (!username) {
        return;
      }
      
      if (!token) {
        return;
      }

      const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/getNotificationList/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // 转换后端数据格式为前端格式
          const notifications = result.data.map(notification => {
            let title, message, type, link;
            
            if (notification.type === 'file') {
              title = '文件上传通知';
              message = `您有来自 ${notification.sender} 的文件上传通知`;
              type = 'file_upload';
              link = `/subtask/${notification.subtaskId}`;
            } else if (notification.type === 'subtask_status') {
              try {
                const content = JSON.parse(notification.content || '{}');
                title = '子任务状态更新';
                message = `您的子任务"${content.title || '未知任务'}"状态已更新为${content.status === 'completed' ? '已完成' : '进行中'}`;
                type = 'subtask_status';
                link = `/subtask/${notification.subtaskId}`;
              } catch (error) {
                title = '子任务状态更新';
                message = `您有来自 ${notification.sender} 的子任务状态更新通知`;
                type = 'subtask_status';
                link = `/subtask/${notification.subtaskId}`;
              }
            } else if (notification.type === 'contrib_round') {
              // 旧评分合约的评分通知
              try {
                const content = JSON.parse(notification.content || '{}')
                title = '评分邀请（旧）'
                message = content.message || '请前往旧评分页面打分'
                type = 'score_legacy'
                link = '/dashboard' // 旧评分入口
              } catch {
                title = '评分邀请（旧）'
                message = '请前往旧评分页面打分'
                type = 'score_legacy'
                link = '/dashboard'
              }
            } else if (notification.type === 'github_contrib_round') {
              // 新 GitHub 贡献互评通知
              try {
                const content = JSON.parse(notification.content || '{}')
                title = 'GitHub 贡献互评邀请'
                message = content.message || '请在仓库“贡献者”页进行互评打分'
                type = 'github_contrib_round'
                // 定位到对应仓库的贡献者页
                if (content.repoId) {
                  const [owner, repo] = String(content.repoId).split('/')
                  link = `/repo/${owner}/${repo}`
                } else {
                  link = '/projects'
                }
              } catch {
                title = 'GitHub 贡献互评邀请'
                message = '请在仓库“贡献者”页进行互评打分'
                type = 'github_contrib_round'
                link = '/projects'
              }
            } else {
              title = '通知';
              message = `您有来自 ${notification.sender} 的通知`;
              type = 'info';
              link = `/subtask/${notification.subtaskId}`;
            }
            
            return {
              id: notification.id,
              title,
              message,
              type,
              timestamp: new Date(notification.createdTime).getTime(),
              read: notification.isRead === 1,
              link,
              meta: {
                type,
                subtaskId: notification.subtaskId,
                fileId: notification.fileId,
                notificationId: notification.id
              }
            };
          });
          
          setItems(notifications);
        }
      } else {
        const errorData = await response.json();
        console.error('Load notifications failed');
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载通知
  useEffect(() => {
    loadNotifications();
  }, []);

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

    // 检查是否已经存在相同的通知，避免重复添加
    setItems((prev) => {
      const exists = prev.some(item => item.id === n.id);
      if (exists) {
        return prev; // 如果已存在，不添加
      }
      return [n, ...prev];
    });
    
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

  const markAllRead = async () => {
    try {
      // 调用后端API标记所有通知为已读
      const response = await notificationAPI.markAllAsRead();
      
      if (response.ok) {
        // 标记成功后，更新前端状态，将所有通知标记为已读
        setItems(prev => prev.map(item => ({ ...item, read: true })));
      } else {
        console.error('标记全部已读失败:', response.error);
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  }

  const clear = async () => {
    try {
      // 检查是否有未读通知
      const hasUnread = items.some(item => !item.read);
      
      if (hasUnread) {
        // 如果有未读通知，提示用户确认
        const confirmed = window.confirm('您有未读通知，确定要清空所有通知吗？');
        if (!confirmed) {
          return;
        }
      }
      
      // 调用标记所有通知为已读的API
      const response = await notificationAPI.markAllAsRead();
      
      if (response.ok) {
        // 标记成功后，前端直接清空显示（因为只显示未读通知）
        setItems([]);
      } else {
        console.error('清空通知失败:', response.error);
      }
    } catch (error) {
      console.error('清空通知失败:', error);
    }
  }

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
              id: data.meta?.notificationId || `ws_${Date.now()}`,
              type: data.meta?.type || "info",
              title: data.title || "新消息",
              message: data.message,
              link: data.link,
              meta: data.meta,
            })
          } else {
            addNotification({
              id: data.meta?.notificationId || `ws_${Date.now()}`,
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
    loading,
    addNotification,
    markAllRead,
    clear,
    loadNotifications,
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
