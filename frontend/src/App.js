"use client"

import { useState, useEffect, useRef } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import "./App.css"

// 布局组件
import MainLayout from "./components/Layout/MainLayout"

// 页面组件
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import Dashboard from "./components/Dashboard/Dashboard"
import ProjectList from "./components/Project/ProjectList"
import ProjectDetail from "./components/Project/ProjectDetail"
import ProjectCreate from "./components/Project/ProjectCreate"
import MilestoneDetail from "./components/Milestone/MilestoneDetail"
import SubtaskDetail from "./components/Subtask/SubtaskDetail"
import Profile from "./components/Profile/Profile"
import { useNotifications } from "./context/notifications"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null) // 全局WebSocket引用
  const { addNotification } = useNotifications()

  // 心跳包定时器引用
  const heartbeatRef = useRef(null)

  // 开始发送心跳包
  const startHeartbeat = (ws) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }))
      }
    }, 3000)
  }

  // 停止心跳包
  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

  // 建立WebSocket连接
  const connectWebSocket = () => {
    if (wsRef.current) {
      console.log("🔌 WebSocket连接已存在，跳过建立")
      return
    }

    console.log("🔌 开始建立WebSocket连接...")
    const ws = new WebSocket("ws://localhost:5000")
    wsRef.current = ws

    ws.onopen = () => {
      console.log("🔌 WebSocket连接已建立")
      const username = sessionStorage.getItem("username")
      ws.send(
        JSON.stringify({
          type: "connection",
          message: "WebSocket连接已建立",
          username,
          timestamp: Date.now(),
        }),
      )
      startHeartbeat(ws)
      addNotification({ type: "system", title: "连接成功", message: "实时通知已连接" })
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log("📨 收到WebSocket消息:", message)

        if (message.type === "pong") return
        if (message.type === "connection_ack") return

        // 推送普通业务通知
        addNotification({
          type: message.type || "info",
          title: message.title || "新消息",
          message: message.message || "",
          meta: message.meta || {},
          timestamp: message.timestamp || Date.now(),
        })
      } catch (error) {
        console.error("❌ WebSocket消息解析错误:", error)
      }
    }

    ws.onclose = (event) => {
      console.log("🔌 WebSocket连接已关闭", event.code, event.reason)
      wsRef.current = null
      stopHeartbeat()
      addNotification({ type: "system", title: "连接断开", message: "实时通知已断开" })
    }

    ws.onerror = (error) => {
      console.error("❌ WebSocket连接错误:", error)
    }
  }

  useEffect(() => {
    // 页面刷新后检查本地存储中的用户信息
    const token = sessionStorage.getItem("token")
    const username = sessionStorage.getItem("username")
    const address = sessionStorage.getItem("address")

    if (token && username && address) {
      setUser({ token, username, address })
      connectWebSocket()
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    connectWebSocket()
  }

  const handleLogout = () => {
    console.log("🚪 开始登出")
    stopHeartbeat()
    if (wsRef.current) {
      console.log("🔌 登出时关闭WebSocket连接")
      wsRef.current.close()
      wsRef.current = null
    }
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("address")
    setUser(null)
    console.log("🧹 前端会话已清除")
  }

  if (loading) {
    return <div className="loading">⏳ 加载中...</div>
  }

  return (
    <div className="App">
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {/* 首页 - 待办事项 */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 项目管理 */}
        <Route
          path="/projects"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <ProjectList user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 创建项目页面 */}
        <Route
          path="/project/create"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <ProjectCreate user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 项目详情页 - 概览/成员管理/里程碑管理 */}
        <Route
          path="/project/:projectId"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <ProjectDetail user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 里程碑详情页 - 子任务增删改 */}
        <Route
          path="/project/:projectId/milestone/:milestoneId"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <MilestoneDetail user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 子任务详情页 - 评论/文件/评分/关闭任务 */}
        <Route
          path="/project/:projectId/milestone/:milestoneId/subtask/:subtaskId"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <SubtaskDetail user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 个人中心 */}
        <Route
          path="/profile"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <Profile user={user} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App




