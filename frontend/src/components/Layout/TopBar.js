"use client"

import { useState, useRef, useEffect } from "react"
import { useNotifications } from "../../context/notifications"
import { Link } from 'react-router-dom';
import "./TopBar.css"

const TopBar = ({ user, currentProject, onProjectChange, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const userMenuRef = useRef(null)
  const projectMenuRef = useRef(null)
  const notificationRef = useRef(null)

  const { items, unreadCount, markAllRead, clear } = useNotifications()

  const projects = [{ id: 1, name: "区块链投票系统", status: "active", progress: 75 }]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false)
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) setShowProjectMenu(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="project-selector" ref={projectMenuRef}>
          <div className="current-project" onClick={() => setShowProjectMenu(!showProjectMenu)}>
            <div className="project-info">
              <h4>{currentProject.name}</h4>
              <p>{currentProject.description}</p>
            </div>
            <span>▼</span>
          </div>

          {showProjectMenu && (
            <div className="project-dropdown">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="project-option"
                  onClick={() => {
                    onProjectChange(project)
                    setShowProjectMenu(false)
                  }}
                >
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p>进度: {project.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索项目、任务、成员..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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

