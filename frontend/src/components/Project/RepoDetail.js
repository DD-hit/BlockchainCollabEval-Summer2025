import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { githubAPI, githubContribAPI } from '../../utils/api';
import ContributorsDashboard from '../Dashboard/ContributorsDashboard';
import './RepoDetail.css';

const RepoDetail = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('code');
  const [repoInfo, setRepoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [issues, setIssues] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [commits, setCommits] = useState([]);
  const [contractAddress, setContractAddress] = useState('');
  const [roundUsers, setRoundUsers] = useState([]);
  const [progressInfo, setProgressInfo] = useState(null);
  const [scores, setScores] = useState([]); // 最终贡献度排行榜
  const [userRounds, setUserRounds] = useState([]);
  const [roundsOpen, setRoundsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [filesLoading, setFilesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 凭证输入模态框（地址 + 密码，密码为密文）
  const [credOpen, setCredOpen] = useState(false);
  const [credMode, setCredMode] = useState('start'); // 'start' | 'finalize'
  const [credAddress, setCredAddress] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credSubmitting, setCredSubmitting] = useState(false);
  // GitHub互评评分面板
  const [peerOpen, setPeerOpen] = useState(false);
  const [peerScores, setPeerScores] = useState({}); // {login: {base: number}}

  const REFRESH_INTERVAL_MS = 60000;
  
  useEffect(() => {
    loadRepoInfo();
  }, [owner, repo]);

  // 常驻排行榜：页面加载时即尝试拉取汇总排行榜（不依赖 repoInfo）
  useEffect(() => {
    const repoId = `${owner}/${repo}`;
    githubContribAPI.leaderboardByRepo(repoId)
      .then((res) => {
        if (res.ok) {
          setScores(res.data?.scores || []);
          setContractAddress(res.data?.contractAddress || '');
        }
      })
      .catch(() => {});
  }, [owner, repo]);

  useEffect(() => {
    if (repoInfo) {
      if (activeTab === 'code') {
        loadFiles();
      } else {
        loadTabData();
        if (activeTab === 'contributors') {
          // 常驻排行榜：进入“贡献者”标签时自动拉取最新一轮排行榜
          const repoId = `${owner}/${repo}`;
          githubContribAPI.leaderboardByRepo(repoId).then((res) => {
            if (res.ok) {
              setScores(res.data?.scores || []);
              setContractAddress(res.data?.contractAddress || '');
            }
          }).catch(() => {});

          // 如果通过通知进入并携带 peer=1，则自动打开互评面板
          try {
            const sp = new URLSearchParams(window.location.search);
            if (sp.get('peer') === '1') {
              const c = sp.get('contract');
              if (c) setContractAddress(c);
              setPeerOpen(true);
            }
          } catch (_) {}
        }
      }
    }
  }, [activeTab, repoInfo]);

  useEffect(() => {
    if (repoInfo && activeTab === 'code') {
      console.log('路径变化，重新加载文件:', currentPath);
      loadFiles();
    }
  }, [currentPath]);

  // 自动刷新：当位于“贡献者”标签页时，每60秒刷新一次数据（含排行榜）
  useEffect(() => {
    if (activeTab !== 'contributors' || !repoInfo) return;
    const intervalId = setInterval(() => {
      const repoId = `${owner}/${repo}`;
      Promise.all([
        loadContributors(),
        loadCommits(),
        (async () => {
          try {
            const res = await githubContribAPI.leaderboardByRepo(repoId);
            if (res.ok) {
              setScores(res.data?.scores || []);
              setContractAddress(res.data?.contractAddress || '');
            }
          } catch (_) {}
        })()
      ]).catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [activeTab, repoInfo, owner, repo]);

  const loadRepoInfo = async () => {
    try {
      setLoading(true);
      const response = await githubAPI.getRepoInfo(owner, repo);
      
      if (response.status === 200) {
        setRepoInfo(response.data);
      } else {
        setError('获取仓库信息失败');
      }
    } catch (error) {
      console.error('加载仓库信息失败:', error);
      setError('加载仓库信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!repoInfo) return;

    try {
      switch (activeTab) {
        case 'code':
          await loadFiles();
          break;
        case 'issues':
          await loadIssues();
          break;
        case 'milestones':
          await loadMilestones();
          break;
        case 'contributors':
          // 贡献者页面需要同时加载贡献者和提交数据
          await Promise.all([loadContributors(), loadCommits()]);
          break;
        case 'commits':
          await loadCommits();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`加载${activeTab}数据失败:`, error);
    }
  };

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      // 使用GitHub API获取仓库内容
      const url = currentPath 
        ? `https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`
        : `https://api.github.com/repos/${owner}/${repo}/contents`;
      
      console.log('加载文件URL:', url);
        
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('文件数据:', data);
        setFiles(Array.isArray(data) ? data : []);
      } else {
        console.error('GitHub API错误:', response.status, response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const loadIssues = async () => {
    try {
      console.log('开始加载Issues...');
      const response = await githubAPI.getRepoIssues(owner, repo);
      console.log('Issues API响应:', response);
      if (response.status === 200) {
        console.log('Issues数据:', response.data);
        setIssues(response.data || []);
      } else {
        console.error('Issues API错误状态:', response.status);
        setIssues([]);
      }
    } catch (error) {
      console.error('加载Issues失败:', error);
      setIssues([]);
    }
  };

  const loadMilestones = async () => {
    try {
      console.log('开始加载Milestones...');
      const response = await githubAPI.getRepoMilestones(owner, repo);
      console.log('Milestones API响应:', response);
      if (response.status === 200) {
        console.log('Milestones数据:', response.data);
        setMilestones(response.data || []);
      } else {
        console.error('Milestones API错误状态:', response.status);
        setMilestones([]);
      }
    } catch (error) {
      console.error('加载Milestones失败:', error);
      setMilestones([]);
    }
  };

  const loadContributors = async () => {
    try {
      console.log('开始加载Contributors...');
      const response = await githubAPI.getRepoContributors(owner, repo);
      console.log('Contributors API响应:', response);
      if (response.status === 200) {
        console.log('Contributors数据:', response.data);
        setContributors(response.data || []);
      } else {
        setContributors([]);
      }
    } catch (error) {
      console.error('加载Contributors失败:', error);
      setContributors([]);
    }
  };

  const loadCommits = async () => {
    try {
      console.log('开始加载Commits...');
      const response = await githubAPI.getRepoCommits(owner, repo);
      console.log('Commits API响应:', response);
      if (response.status === 200) {
        console.log('Commits数据:', response.data);
        setCommits(response.data || []);
      } else {
        console.error('Commits API错误状态:', response.status);
        setCommits([]);
      }
    } catch (error) {
      console.error('加载提交记录失败:', error);
      setCommits([]);
    }
  };

  const refreshContribAndCommits = async () => {
    try {
      setRefreshing(true);
      const repoId = `${owner}/${repo}`;
      await Promise.all([
        loadContributors(),
        loadCommits(),
        (async () => {
          try {
            const res = await githubContribAPI.leaderboardByRepo(repoId);
            if (res.ok) {
              setScores(res.data?.scores || []);
              setContractAddress(res.data?.contractAddress || '');
            }
          } catch (e) {
            // 静默失败，避免打断用户刷新
          }
        })()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // —— 贡献度：仓库主人触发计算 ——
  const isRepoAdmin = !!repoInfo?.permissions?.admin;

  const handleStartContrib = async (adminAddress, adminPassword) => {
    try {
      if (!isRepoAdmin) return;
      const repoId = `${owner}/${repo}`;
      if (!adminAddress || !adminPassword) return;
      const res = await githubContribAPI.start({ repoId, adminAddress, adminPassword });
      if (!res.ok) {
        alert(res.error?.message || '启动失败');
        return;
      }
      setContractAddress(res.data.contractAddress || '');
      setRoundUsers(res.data.users || []);
      if (Array.isArray(res.data.scores) && res.data.scores.length > 0) {
        setScores(res.data.scores);
        setProgressInfo({ total: res.data.users?.length || 1, voted: res.data.users?.length || 1, finalized: true });
        alert('成员不足2人，已直接按基础分计算并显示排行榜');
      } else {
        alert('已部署合约并通知成员评分');
      }
    } catch (e) {
      alert(e?.message || '启动失败');
    }
  };

  const handleCheckProgress = async () => {
    if (!contractAddress) return;
    const res = await githubContribAPI.progress(contractAddress);
    if (res.ok) setProgressInfo(res.data);
    else alert(res.error?.message || '查询失败');
  };

  const handleFinalize = async (adminAddress, adminPassword) => {
    try {
      if (!contractAddress) return;
      if (!adminAddress || !adminPassword) return;
      const res = await githubContribAPI.finalize(contractAddress, { adminAddress, adminPassword, users: roundUsers });
      if (!res.ok) {
        alert(res.error?.message || '尚未全部评分或失败');
        return;
      }
      setProgressInfo(res.data.progress);
      setScores(res.data.scores || []);
    } catch (e) {
      alert(e?.message || '获取结果失败');
    }
  };

  const openCredModal = (mode) => {
    setCredMode(mode);
    setCredAddress(sessionStorage.getItem('address') || '');
    setCredPassword('');
    setCredOpen(true);
  };

  const submitCred = async () => {
    if (!credAddress || !credPassword) {
      alert('请输入地址与密码');
      return;
    }
    try {
      setCredSubmitting(true);
      if (credMode === 'start') {
        await handleStartContrib(credAddress, credPassword);
      } else {
        await handleFinalize(credAddress, credPassword);
      }
      setCredOpen(false);
    } finally {
      setCredSubmitting(false);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path);
    } else {
      // 可以在这里添加文件预览功能
      window.open(file.html_url, '_blank');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatFileSize = (size) => {
    if (!size || size === 0) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const icons = {
      'js': '📜',
      'ts': '📜',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'sass': '🎨',
      'less': '🎨',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'swift': '🍎',
      'kt': '☕',
      'dart': '🎯',
      'vue': '💚',
      'sql': '🗄️',
      'xml': '📄',
      'yml': '⚙️',
      'yaml': '⚙️',
      'toml': '⚙️',
      'ini': '⚙️',
      'conf': '⚙️',
      'sh': '🐚',
      'bat': '🪟',
      'ps1': '🪟',
      'dockerfile': '🐳',
      'gitignore': '🚫',
      'readme': '📖',
      'license': '📜',
      'package': '📦',
      'lock': '🔒'
    };
    
    // 检查完整文件名
    if (icons[fileName.toLowerCase()]) {
      return icons[fileName.toLowerCase()];
    }
    
    // 检查扩展名
    if (icons[extension]) {
      return icons[extension];
    }
    
    // 默认图标
    return '📄';
  };

  if (loading) {
    return <div className="repo-detail-loading">加载仓库信息...</div>;
  }

  if (error) {
    return (
      <div className="repo-detail-error">
        <h3>⚠️ 加载失败</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/projects')}>返回项目列表</button>
      </div>
    );
  }

  if (!repoInfo) {
    return <div className="repo-detail-error">仓库不存在</div>;
  }

  return (
    <div className="repo-detail">
      {/* 仓库头部信息 */}
      <div className="repo-header">
        <div className="repo-header-content">
          <div className="repo-breadcrumb">
            <button onClick={() => navigate('/projects')} className="back-btn">
              ← 返回项目
            </button>
            <span className="separator">/</span>
            <span className="owner">{owner}</span>
            <span className="separator">/</span>
            <span className="repo-name">{repo}</span>
          </div>
          
          
        </div>

        {repoInfo.description && (
          <p className="repo-description">{repoInfo.description}</p>
        )}
      </div>

      {/* 标签页导航 */}
      <div className="repo-tabs">
        <button 
          className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          📁 代码
        </button>
        <button 
          className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          🐛 Issues
        </button>
        <button 
          className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          🎯 里程碑
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contributors' ? 'active' : ''}`}
          onClick={() => setActiveTab('contributors')}
        >
          👥 贡献者
        </button>
        <button 
          className={`tab-btn ${activeTab === 'commits' ? 'active' : ''}`}
          onClick={() => setActiveTab('commits')}
        >
          📝 提交记录
        </button>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'code' && (
          <div className="code-tab">
            <div className="file-browser">
              <div className="file-path">
                                 <span 
                   className="path-segment" 
                   onClick={() => setCurrentPath('')}
                 >
                   {repo}
                 </span>
                 {currentPath && currentPath.split('/').map((segment, index) => (
                   <React.Fragment key={index}>
                     <span className="path-separator">/</span>
                     <span 
                       className="path-segment"
                       onClick={() => {
                         const newPath = currentPath.split('/').slice(0, index + 1).join('/');
                         setCurrentPath(newPath);
                       }}
                     >
                       {segment}
                     </span>
                   </React.Fragment>
                 ))}
              </div>
              
                             <div className="file-list">
                 {filesLoading ? (
                   <div className="file-loading">加载文件列表中...</div>
                 ) : files.length > 0 ? (
                   files.map((file) => (
                     <div 
                       key={file.name} 
                       className="file-item"
                       onClick={() => handleFileClick(file)}
                     >
                       <span className="file-icon">
                         {file.type === 'dir' ? '📁' : getFileIcon(file.name)}
                       </span>
                       <span className="file-name">{file.name}</span>
                       {file.type === 'file' && (
                         <span className="file-size">{formatFileSize(file.size)}</span>
                       )}
                     </div>
                   ))
                 ) : (
                   <div className="file-empty">
                     {filesLoading ? '加载中...' : '此目录为空'}
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="issues-tab">
            <div className="issues-header">
              <h3>Issues</h3>
            </div>
            <div className="issues-list">
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <div key={issue.id} className="issue-item" onClick={() => window.open(issue.html_url, '_blank')}>
                    <div className="issue-icon">
                      {issue.state === 'open' ? '🟢' : '🔴'}
                    </div>
                    <div className="issue-content">
                      <h4 className="issue-title">{issue.title}</h4>
                      <div className="issue-meta">
                        <span className="issue-number">#{issue.number}</span>
                        <span className="issue-author">by {issue.user.login}</span>
                        <span className="issue-date">{formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="issues-empty">
                  <p>暂无 Issues</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-tab">
            <div className="milestones-header">
              <h3>里程碑</h3>
            </div>
            <div className="milestones-list">
              {milestones.length > 0 ? (
                milestones.map((milestone) => (
                  <div key={milestone.id} className="milestone-item" onClick={() => window.open(milestone.html_url, '_blank')}>
                    <div className="milestone-icon">🎯</div>
                    <div className="milestone-content">
                      <h4 className="milestone-title">{milestone.title}</h4>
                      <p className="milestone-description">{milestone.description}</p>
                      <div className="milestone-meta">
                        <span className="milestone-state">
                          {milestone.state === 'open' ? '🟢 进行中' : '🔴 已完成'}
                        </span>
                        <span className="milestone-date">
                          截止: {milestone.due_on ? formatDate(milestone.due_on) : '无截止日期'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="milestones-empty">
                  <p>暂无里程碑</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contributors' && (
          <div className="contributors-tab">
            <div className="contributors-toolbar">
              <button 
                className={`refresh-btn ${refreshing ? 'is-loading' : ''}`}
                onClick={refreshContribAndCommits} 
                disabled={refreshing}
              >
                {refreshing ? '刷新中…' : '刷新'}
              </button>
              {isRepoAdmin && (
                <button className="refresh-btn" onClick={() => openCredModal('start')}>计算贡献度（部署合约）</button>
              )}
            </div>
            <ContributorsDashboard 
              contributors={contributors}
              commits={commits}
              contribScores={scores}
              onShowUserRounds={async (username, address) => {
                try {
                  const repoId = `${owner}/${repo}`;
                  const paramsUsername = username || undefined;
                  const res = await githubContribAPI.userRounds(repoId, paramsUsername, address);
                  if (res.ok) {
                    setUserRounds(res.data || []);
                    setSelectedUser(paramsUsername || address || '');
                    setRoundsOpen(true);
                  } else {
                    alert(res.error?.message || '获取分数详情失败');
                  }
                } catch (e) {
                  alert(e?.message || '请求失败');
                }
              }}
              onDetailsClick={() => {
                if (!userRounds || userRounds.length === 0) {
                  alert('请先在排行榜中点击一个地址以加载详情');
                  return;
                }
                setRoundsOpen(true);
              }}
            />

            {roundsOpen && (
              <div
                onClick={() => setRoundsOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.35)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '18vh'
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '90%',
                    maxWidth: 900,
                    background: '#fff',
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    maxHeight: '80vh',
                    overflow: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>分数详情 {selectedUser ? `（${selectedUser}）` : ''}</h2>
                    <button className="refresh-btn" onClick={() => setRoundsOpen(false)}>关闭</button>
                  </div>
                  <div className="contrib-leaderboard" style={{ marginTop: 12 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>轮次</th>
                          <th>开始</th>
                          <th>结束</th>
                          <th>基础分</th>
                          <th>互评分</th>
                          <th>最终分</th>
                          <th>Code</th>
                          <th>PR</th>
                          <th>Review</th>
                          <th>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userRounds.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.roundId}</td>
                            <td>{r.start_at ? new Date(r.start_at).toLocaleString() : '-'}</td>
                            <td>{r.end_at ? new Date(r.end_at).toLocaleString() : '-'}</td>
                            <td>{Number(r.base_score) || 0}</td>
                            <td>{Number(r.peer_score) || 0}</td>
                            <td>{Number(r.final_score) || 0}</td>
                            <td>{Number(r.code_score) || 0}</td>
                            <td>{Number(r.pr_score) || 0}</td>
                            <td>{Number(r.review_score) || 0}</td>
                            <td>{Number(r.issue_score) || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 排行榜移入 ContributorsDashboard 内部渲染 */}
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="commits-tab">
            <h3>提交记录</h3>
            <div className="commits-list">
              {commits.length > 0 ? (
                commits.map((commit) => (
                  <div key={commit.sha} className="commit-item" onClick={() => window.open(commit.html_url, '_blank')}>
                    <div className="commit-icon">📝</div>
                    <div className="commit-content">
                      <h4 className="commit-message">{commit.commit.message}</h4>
                      <div className="commit-meta">
                        <span className="commit-author">{commit.commit.author.name}</span>
                        <span className="commit-date">{formatDate(commit.commit.author.date)}</span>
                        <span className="commit-sha">{commit.sha.substring(0, 7)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="commits-empty">
                  <p>暂无提交记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 凭证输入模态框 */}
      {credOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setCredOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: 400,
              background: '#fff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <h2>{credMode === 'start' ? '部署合约' : '最终评分'}</h2>
            <div style={{ marginBottom: 15 }}>
              <label>管理员地址:</label>
              <input
                type="text"
                value={credAddress}
                onChange={(e) => setCredAddress(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: 5 }}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label>管理员密码 (密文):</label>
              <input
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: 5 }}
              />
            </div>
            <button
              onClick={submitCred}
              disabled={credSubmitting}
              style={{
                background: credSubmitting ? 'gray' : '#007bff',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 5,
                border: 'none',
                cursor: credSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {credSubmitting ? '提交中...' : credMode === 'start' ? '部署合约' : '最终评分'}
            </button>
          </div>
        </div>
      )}

      {/* GitHub 互评评分面板（独立于文件评分） */}
      {peerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setPeerOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '92%', maxWidth: 720, maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>GitHub互评</h2>
              <button className="refresh-btn" onClick={() => setPeerOpen(false)}>关闭</button>
            </div>
            <p style={{ color: '#666', marginTop: 8 }}>本面板用于“GitHub贡献互评”，与文件评分独立。请为每位成员给出本轮的互评分（0-100）。</p>
            <div>
              {contributors.map((c) => (
                <div key={c.login} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <img src={c.avatar_url} alt={c.login} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>{c.login}</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={peerScores[c.login]?.base ?? ''}
                    onChange={(e) => setPeerScores((prev) => ({ ...prev, [c.login]: { base: Number(e.target.value) } }))}
                    placeholder="0-100"
                    style={{ width: 90, padding: 6 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              <button className="refresh-btn" onClick={() => setPeerScores({})}>清空</button>
              <button
                className="refresh-btn"
                onClick={async () => {
                  try {
                    if (!contractAddress) {
                      alert('尚未部署合约，无法提交互评');
                      return;
                    }
                    // 互评评分结构简单上报，后端将按需要校验与合并
                    const payload = { scores: peerScores };
                    const res = await githubContribAPI.vote(contractAddress, payload);
                    if (res.ok) {
                      alert('提交成功');
                      setPeerOpen(false);
                    } else {
                      alert(res.error?.message || '提交失败');
                    }
                  } catch (e) {
                    alert(e?.message || '提交失败');
                  }
                }}
              >提交互评</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoDetail;
