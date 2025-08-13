"use client"

import { useState, useRef, useEffect } from "react"
import { useNotifications } from "../../context/notifications"
import { Link } from 'react-router-dom';
import "./TopBar.css"

const TopBar = ({ user, onLogout }) => {
  // const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  const { items, unreadCount, markAllRead, clear } = useNotifications()

  const projects = []

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {/* 搜索框已隐藏 */}
        {/* <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索项目、任务、成员..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div> */}
      </div>

      <div className="top-bar-right">
        <div className="notification-wrapper" ref={notificationRef}>
          <button className="notification-btn" onClick={() => setShowNotifications((s) => !s)} aria-label="通知">
            <span>🔔</span>
            {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span>通知</span>
                <div className="notifications-actions">
                  <button onClick={markAllRead}>全部已读</button>
                  <button onClick={clear}>清空</button>
                </div>
              </div>
              <div className="notifications-list">
                {items.length === 0 ? (
                  <div className="notifications-empty">暂无通知</div>
                ) : (
                  items.map((n) => (
                    <div key={n.id} className={`notification-item ${n.read ? "read" : ""}`}>
                      <div className="notification-title">
                        {n.type === "file" ? "📄" : n.type === "comment" ? "💬" : "🔔"} {n.title}
                      </div>
                      {n.message && <div className="notification-message">{n.message}</div>}
                      <div className="notification-meta">
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      {/* 为文件上传通知添加"去评分"按钮 */}
                      {n.meta?.subtaskId && n.type === "file_upload" && (
                        <div className="notification-actions">
                          <button 
                            className="notification-action-btn"
                            onClick={() => {
                              // 跳转到子任务页面
                              window.location.href = n.link || `/subtask/${n.meta.subtaskId}`;
                            }}
                          >
                            去评分
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu" ref={userMenuRef}>
          <div className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="avatar-circle">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <h4>{user.username}</h4>
              <p>
                {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
              </p>
            </div>
            <span>▼</span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <Link to="/profile" className="dropdown-item">
                <span>👤</span>
                个人资料
              </Link>
              <div className="dropdown-item">
                <span>⚙️</span>
                设置
              </div>
              <div className="dropdown-item">
                <span>💰</span>
                钱包
              </div>
              <div className="dropdown-item logout" onClick={onLogout}>
                <span>🚪</span>
                退出登录
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopBar

