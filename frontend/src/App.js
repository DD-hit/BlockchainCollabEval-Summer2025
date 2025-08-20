import { useState, useEffect, useRef } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
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
import TransactionList from "./components/Transaction/TransactionList"
import { useNotifications } from "./context/notifications"
import { accountAPI } from "./utils/api"

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
    }, 30000) // 30秒发送一次心跳
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
      
      return
    }

    
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}` 
      : "ws://localhost:5000";
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      
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
      // addNotification({ type: "system", title: "连接成功", message: "实时通知已连接" }, false)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === "pong") return
        if (message.type === "connection_ack") return

        // 处理通知消息
        if (message.type === "notification") {
          
          addNotification({
            type: message.meta?.type || "info",
            title: message.title || "新消息",
            message: message.message || "",
            link: message.link,
            meta: message.meta || {},
            timestamp: message.timestamp || Date.now(),
          })
        } else {
          // 推送普通业务通知
          
          addNotification({
            type: message.type || "info",
            title: message.title || "新消息",
            message: message.message || "",
            meta: message.meta || {},
            timestamp: message.timestamp || Date.now(),
          })
        }
      } catch (error) {
        console.error("❌ WebSocket消息解析错误:", error)
      }
    }

    ws.onclose = async (event) => {
      // 连接关闭时，不立即更新状态，让心跳机制来处理
      wsRef.current = null
      stopHeartbeat()
      // addNotification({ type: "system", title: "连接断开", message: "实时通知已断开" }, false)
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

  const handleLogout = async () => {
    try {
      // 调用后端API更新用户状态为离线
      if (user?.username) {
        await accountAPI.logout(user.username);
      }
    } catch (error) {
      console.error('登出API调用失败:', error);
    }

    stopHeartbeat()
    if (wsRef.current) {
      
      wsRef.current.close()
      wsRef.current = null
    }
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("address")
    setUser(null)
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

        {/* 独立子任务详情页 - 用于从子任务管理直接跳转 */}
        <Route
          path="/subtask/:subtaskId"
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

        {/* 交易记录 */}
        <Route
          path="/transactions"
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout}>
                <TransactionList user={user} />
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




