import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { githubAPI } from '../../utils/api';
import api from '../../utils/api';
import './GitHubRepos.css';

const GitHubRepos = ({ onRepoSelect }) => {
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadRepos = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await githubAPI.getUserRepos(pageNum, 30);
      
      if (response.status === 200) {
        const newRepos = response.data || [];
        if (pageNum === 1) {
          setRepos(newRepos);
        } else {
          setRepos(prev => [...prev, ...newRepos]);
        }
        
        // 如果返回的仓库数量少于30，说明没有更多了
        setHasMore(newRepos.length === 30);
      } else {
        setError('获取仓库失败');
      }
    } catch (error) {
      console.error('加载GitHub仓库失败:', error);
      
      // 根据不同的错误类型显示不同的错误信息
      if (error.response?.status === 401) {
        if (error.response?.data?.error?.includes('未连接GitHub')) {
          setError('请点击“连接GitHub”');
        } else {
          setError('GitHub连接已过期，请重新连接GitHub账户');
        }
      } else if (error.response?.status === 403) {
        setError('GitHub访问权限不足，请检查账户权限');
      } else if (error.response?.status === 404) {
        setError('GitHub服务暂时不可用');
      } else if (error.response?.status === 503) {
        setError('GitHub网络不可用，请稍后重试');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('请求超时，请检查网络后重试');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('网络连接失败，请检查网络设置');
      } else {
        setError('加载仓库失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRepos(nextPage);
    }
  };

  const handleRepoClick = (repo) => {
    // 跳转到仓库详情页面
    navigate(`/repo/${repo.owner.login}/${repo.name}`);
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await api.get('/api/auth/url');
      if (response.data && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        setError('获取GitHub授权URL失败');
      }
    } catch (error) {
      console.error('GitHub连接错误:', error);
      setError('连接GitHub失败，请重试');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C#': '#178600',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Dart': '#00B4AB',
      'Vue': '#41b883',
      'React': '#61dafb',
      'Angular': '#dd0031',
      'Node.js': '#339933',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'SCSS': '#cf649a',
      'Sass': '#cf649a',
      'Less': '#1d365d',
      'Shell': '#89e051',
      'Dockerfile': '#384d54',
      'Makefile': '#427819',
      'YAML': '#cb171e',
      'JSON': '#292b36',
      'Markdown': '#083fa1',
      'TeX': '#3D6117',
      'Assembly': '#6E4C13',
      'C': '#555555',
      'C#': '#178600',
      'Clojure': '#db5855',
      'CoffeeScript': '#244776',
      'Common Lisp': '#3fb68b',
      'Crystal': '#776791',
      'D': '#ba595e',
      'Elixir': '#6e4a7e',
      'Elm': '#60B5CC',
      'Erlang': '#B83998',
      'F#': '#b845fc',
      'Factor': '#636746',
      'Fortran': '#4d41b1',
      'Haskell': '#5e5086',
      'Idris': '#b30000',
      'Julia': '#a270ba',
      'Lua': '#000080',
      'MATLAB': '#e16737',
      'Nim': '#37775b',
      'OCaml': '#3be133',
      'Perl': '#0298c3',
      'Prolog': '#74283c',
      'PureScript': '#1D222D',
      'R': '#198CE7',
      'Scala': '#c22d40',
      'Solidity': '#AA6746',
      'Tcl': '#e4cc98',
      'Vim script': '#199f4b',
      'Visual Basic': '#945db7',
      'WebAssembly': '#04133b',
      'Zig': '#ec915c'
    };
    return colors[language] || '#586069';
  };

  if (error) {
    return (
      <div className="github-repos-error">
        <div className="error-message">
          <div className="error-content">
            <h3><span>⚠️</span> GitHub 未连接</h3>
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button onClick={handleConnectGitHub} className="retry-btn">
              连接 GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="github-repos">
      <div className="repos-header">
        <h2>📚 GitHub 仓库</h2>
      </div>

      <div className="repos-grid">
        {repos.map((repo) => (
          <div 
            key={repo.id} 
            className="repo-card"
            onClick={() => handleRepoClick(repo)}
          >
            <div className="repo-header">
              <h3 className="repo-name">
                <span className="repo-icon">📁</span>
                {repo.name}
              </h3>
              <span className={`repo-visibility ${repo.private ? 'private' : 'public'}`}>
                {repo.private ? '🔒 私有' : '🌐 公开'}
              </span>
            </div>
            
            {repo.description && (
              <p className="repo-description">{repo.description}</p>
            )}
            
            <div className="repo-meta">
              {repo.language && (
                <span className="repo-language">
                  <span 
                    className="language-dot" 
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  ></span>
                  {repo.language}
                </span>
              )}
              
              <div className="repo-stats">
                <span className="stat">
                  <span className="stat-icon">⭐</span>
                  {repo.stargazers_count}
                </span>
                <span className="stat">
                  <span className="stat-icon">🍴</span>
                  {repo.forks_count}
                </span>
                <span className="stat">
                  <span className="stat-icon">👀</span>
                  {repo.watchers_count}
                </span>
              </div>
            </div>
            
            <div className="repo-footer">
              <span className="repo-updated">
                更新于 {formatDate(repo.updated_at)}
              </span>
              {repo.license && (
                <span className="repo-license">
                  📄 {repo.license.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button 
            onClick={handleLoadMore}
            className="load-more-btn"
            disabled={loading}
          >
            {loading ? '加载中...' : '加载更多仓库'}
          </button>
        </div>
      )}

      {!loading && repos.length === 0 && (
        <div className="no-repos">
          <p>暂无GitHub仓库</p>
          <p>请确保您已连接GitHub账户</p>
        </div>
      )}
    </div>
  );
};

export default GitHubRepos;
