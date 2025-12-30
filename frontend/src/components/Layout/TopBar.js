"use client"

import { useState, useRef, useEffect } from "react"
import { useNotifications } from "../../context/notifications"
import { Link } from 'react-router-dom';
import { githubAPI, githubContribAPI, notificationAPI } from "../../utils/api"
import "./TopBar.css"

const TopBar = ({ user, onLogout }) => {
  // const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [peerOpen, setPeerOpen] = useState(false)
  const [peerRepo, setPeerRepo] = useState({ owner: "", repo: "" })
  const [peerContract, setPeerContract] = useState("")
  const [peerContributors, setPeerContributors] = useState([])
  const [peerScores, setPeerScores] = useState({})
  const [peerSubmitting, setPeerSubmitting] = useState(false)
  const [peerStatus, setPeerStatus] = useState({ voted: false, total: 0, current: 0 })
  const [githubLogin, setGithubLogin] = useState("")
  const [peerPassword, setPeerPassword] = useState("")
  const [activeNotificationId, setActiveNotificationId] = useState(null)

  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  const { items, unreadCount, markAllRead, clear, loadNotifications } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const openPeerFromNotification = async (n) => {
    try {
      setActiveNotificationId(n?.meta?.notificationId || n?.id || null)
      // 解析 repo 信息
      let owner = ""; let repo = "";
      if (n.meta?.repoId) {
        const parts = String(n.meta.repoId).split('/')
        owner = parts[0] || ""; repo = parts[1] || "";
      } else if (n.link && /^\/repo\//.test(n.link)) {
        const seg = n.link.split('/')
        owner = seg[2] || ""; repo = seg[3] || "";
      }

      setPeerRepo({ owner, repo })

      // 准备合约地址：通知附带的优先；否则向排行榜接口查询
      let contract = n.meta?.contractAddress || "";
      if (!contract && owner && repo) {
        const repoId = `${owner}/${repo}`
        const res = await githubContribAPI.leaderboardByRepo(repoId)
        if (res.ok) contract = res.data?.contractAddress || ""
      }
      setPeerContract(contract)

      // 拉取贡献者列表与当前GitHub登录
      if (owner && repo) {
        try {
          const resp = await githubAPI.getRepoContributors(owner, repo)
          if (resp?.status === 200 && Array.isArray(resp.data)) {
            setPeerContributors(resp.data)
          } else {
            setPeerContributors([])
          }
        } catch { setPeerContributors([]) }
      }
      try {
        const me = await githubAPI.getUserInfo()
        const login = me?.data?.login || me?.data?.github_login || ""
        setGithubLogin(String(login || '').toLowerCase())
      } catch { setGithubLogin("") }

      setPeerScores({})

      // 检查资格与进度，若不在名单/已完成则提示
      if (contract) {
        try {
          const ck = await githubContribAPI.check(contract)
          if (ck.ok) {
            console.log('Check result:', ck.data) // 调试信息
            if (!ck.data?.inRaters) {
              alert(`你不在本轮评分名单中。\n你的地址: ${ck.data?.address}\n名单地址: ${JSON.stringify(ck.data?.debug?.raters)}`)
              return
            } else if (ck.data?.progress?.finalized) {
              alert('本轮已完成评分并结算，无法再提交。')
              return
            } else if (ck.data?.progress) {
              const { total, voted } = ck.data.progress
              if (voted >= total) {
                alert(`所有人已完成投票 (${voted}/${total})，可以进行最终评分了！`)
              } else {
                // 显示当前进度
                console.log(`投票进度: ${voted}/${total}`)
              }
            }
            // 在弹窗中显示“我是否已投票”
            setPeerStatus({
              voted: !!ck.data?.hasVoted,
              total: ck.data?.progress?.total || 0,
              current: ck.data?.progress?.voted || 0,
            })
          }
        } catch (_) {}
      }
      setPeerOpen(true)
    } catch (_) {
      // 回退：若失败仍跳转
      if (n.link) window.location.href = n.link
    }
  }

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="blockchain-title">跨区块链协同开发</span>
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
                        {n.type === "file_upload" ? "📄" : n.type === "subtask_status" ? "🔄" : n.type === "comment" ? "💬" : "🔔"} {n.title}
                      </div>
                      {n.message && <div className="notification-message">{n.message}</div>}
                      <div className="notification-meta">
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      {/* 文件上传通知：去评分 */}
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
                      {/* GitHub贡献互评通知：参与互评（通过路由参数携带合约地址）*/}
                      {n.type === "github_contrib_round" && (
                        <div className="notification-actions">
                          <button
                            className="notification-action-btn"
                            onClick={() => openPeerFromNotification(n)}
                          >
                            参与互评
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
              <div className="dropdown-item logout" onClick={onLogout}>
                <span>🚪</span>
                退出登录
              </div>
            </div>
          )}
        </div>
      </div>

      {peerOpen && (
        <div
          onClick={() => setPeerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '92%', maxWidth: 720, maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>GitHub互评 {peerRepo.owner && peerRepo.repo ? `（${peerRepo.owner}/${peerRepo.repo}）` : ''}</h2>
              <button className="refresh-btn" onClick={() => setPeerOpen(false)}>关闭</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: '#555' }}>
              <div>投票进度：{peerStatus.current}/{peerStatus.total} {peerStatus.voted ? '（你已提交）' : '（你未提交）'}</div>
            </div>
            {!peerContract && (
              <div style={{ color: '#c00', marginTop: 8 }}>未找到合约地址，无法提交互评。请稍后重试或联系管理员。</div>
            )}
            <div style={{ marginTop: 8 }}>
              {peerContributors
                .filter((c) => {
                  const login = String(c.login || '').toLowerCase()
                  const selfCandidates = [
                    githubLogin,
                    (typeof window !== 'undefined' && window.sessionStorage ? (window.sessionStorage.getItem('github_login') || '') : ''),
                    (typeof window !== 'undefined' && window.sessionStorage ? (window.sessionStorage.getItem('username') || '') : ''),
                  ].filter(Boolean).map((s) => String(s).toLowerCase())
                  return !selfCandidates.includes(login)
                })
                .map((c) => {
                const login = c.login;
                const disabled = false;
                return (
                  <div key={login} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <img src={c.avatar_url} alt={login} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      {login}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={disabled}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={(typeof peerScores[login]?.base === 'number' && isFinite(peerScores[login]?.base)) ? String(peerScores[login]?.base) : ''}
                      onChange={(e) => {
                        const raw = e.target.value || ''
                        const digits = raw.replace(/[^0-9]/g, '')
                        if (digits === '') {
                          setPeerScores((prev) => {
                            const next = { ...prev }
                            if (next[login]) delete next[login]
                            return next
                          })
                          return
                        }
                        const n = Math.max(0, Math.min(100, parseInt(digits, 10)))
                        setPeerScores((prev) => ({ ...prev, [login]: { base: n } }))
                      }}
                      placeholder="0-100"
                      style={{ width: 90, padding: 6 }}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <label style={{ color: '#555' }}>密码：</label>
              <input
                type="password"
                value={peerPassword}
                onChange={(e) => setPeerPassword(e.target.value)}
                placeholder="用于解密私钥"
                style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              {(() => {
                const totalScore = Object.values(peerScores).reduce((sum, s) => sum + (s?.base || 0), 0)
                const remaining = 100 - totalScore
                return (
                  <div style={{ color: remaining === 0 ? '#22c55e' : '#ef4444', fontSize: 14, marginBottom: 8 }}>
                    预算使用: {totalScore}/100 {remaining !== 0 && `(还需分配 ${remaining} 分)`}
                  </div>
                )
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 8 }}>
              <button className="refresh-btn" onClick={() => setPeerScores({})}>清空</button>
              <button
                className="refresh-btn"
                disabled={!peerContract || peerSubmitting || (() => {
                  const totalScore = Object.values(peerScores).reduce((sum, s) => sum + (s?.base || 0), 0)
                  return totalScore !== 100
                })()}
                onClick={async () => {
                  try {
                    if (!peerContract) return;
                    if (!peerPassword) { alert('请输入密码'); return; }
                    
                    const totalScore = Object.values(peerScores).reduce((sum, s) => sum + (s?.base || 0), 0)
                    if (totalScore !== 100) {
                      alert(`必须将 100 分预算全部分配完！当前已分配 ${totalScore} 分。`)
                      return
                    }
                    
                    setPeerSubmitting(true)
                    const res = await githubContribAPI.vote(peerContract, { scores: peerScores, password: peerPassword })
                    if (res.ok) {
                      try {
                        if (activeNotificationId) {
                          await notificationAPI.markAsRead(activeNotificationId)
                          loadNotifications()
                        }
                      } catch (_) {}
                      alert('提交成功');
                      setPeerOpen(false)
                    } else {
                      const errorMsg = res.error?.message || '提交失败'
                      if (errorMsg.includes('already voted')) {
                        alert('你已经在本轮投过票了，不能重复投票。')
                      } else {
                        alert(errorMsg)
                      }
                    }
                  } catch (e) {
                    alert(e?.message || '提交失败')
                  } finally {
                    setPeerSubmitting(false)
                  }
                }}
              >提交互评</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopBar

