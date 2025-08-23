import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { githubAPI } from '../../utils/api';
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
  const [currentPath, setCurrentPath] = useState('');
  const [filesLoading, setFilesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const REFRESH_INTERVAL_MS = 60000;

  useEffect(() => {
    loadRepoInfo();
  }, [owner, repo]);

  useEffect(() => {
    if (repoInfo) {
      if (activeTab === 'code') {
        loadFiles();
      } else {
        loadTabData();
      }
    }
  }, [activeTab, repoInfo]);

  useEffect(() => {
    if (repoInfo && activeTab === 'code') {
      console.log('路径变化，重新加载文件:', currentPath);
      loadFiles();
    }
  }, [currentPath]);

  // 自动刷新：当位于“贡献者”标签页时，每60秒刷新一次数据
  useEffect(() => {
    if (activeTab !== 'contributors' || !repoInfo) return;
    const intervalId = setInterval(() => {
      Promise.all([loadContributors(), loadCommits()]).catch(() => {});
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
        console.error('Contributors API错误状态:', response.status);
        setContributors([]);
      }
    } catch (error) {
      console.error('加载贡献者失败:', error);
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
      await Promise.all([loadContributors(), loadCommits()]);
    } finally {
      setRefreshing(false);
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
            </div>
            <ContributorsDashboard 
              contributors={contributors}
              commits={commits}
            />
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
    </div>
  );
};

export default RepoDetail;
