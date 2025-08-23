import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { projectAPI, subtaskAPI } from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [githubMessage, setGithubMessage] = useState(null);
  const [githubStatus, setGithubStatus] = useState({ connected: false, message: '检查中...' });

  useEffect(() => {
    loadDashboardData();
    checkGitHubStatus();
    checkGitHubConnectionStatus();
  }, []);

  const checkGitHubStatus = () => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success');
    const message = params.get('message');
    const error = params.get('error');
    
    if (success === 'true' && message) {
      setGithubMessage({ type: 'success', message });
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
      // 刷新GitHub连接状态
      checkGitHubConnectionStatus();
    } else if (error) {
      setGithubMessage({ type: 'error', message: error });
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkGitHubConnectionStatus = async () => {
    try {
      const response = await api.get('/api/auth/status');
      setGithubStatus(response.data);
    } catch (error) {
      setGithubStatus({ connected: false, message: '检查连接状态失败' });
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await api.get('/api/auth/url');
      if (response.data && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        setGithubMessage({ type: 'error', message: '获取GitHub授权URL失败' });
      }
    } catch (error) {
      console.error('GitHub连接错误:', error);
      
      // GitHub连接失败时只显示错误信息，不跳转到登录页面
      if (error.response?.status === 401) {
        setGithubMessage({ type: 'error', message: '登录已过期，请重新登录' });
      } else if (error.response?.status === 500) {
        setGithubMessage({ type: 'error', message: '服务器错误，请稍后重试' });
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setGithubMessage({ type: 'error', message: '网络连接失败，请检查网络设置' });
      } else {
        setGithubMessage({ type: 'error', message: '连接GitHub失败，请重试' });
      }
    }
  };

  const loadDashboardData = async () => {
    try {

      
      // 加载项目统计和交易记录
      const [projectsRes, tasksRes, transactionsRes] = await Promise.all([
        projectAPI.myProjects(),
        subtaskAPI.myTasks(),
        api.get('/api/transactions/recent')
      ]);



      // 处理项目数据
      if (projectsRes && projectsRes.ok) {
        const projects = projectsRes.data || [];

        setStats(prev => ({ ...prev, totalProjects: projects.length }));
      } else {

      }

      // 处理任务数据
      if (tasksRes && tasksRes.ok) {
        const tasks = tasksRes.data || [];

        
        // 总任务数：所有分配给当前用户的任务
        const totalTasks = tasks.length;
        
        // 已完成：状态为completed的任务
        const completed = tasks.filter(t => t.status === 'completed').length;
        
        // 待处理：状态为in_progress的任务
        const pending = tasks.filter(t => t.status === 'in_progress').length;
        

        
        setStats(prev => ({
          ...prev,
          totalTasks: totalTasks,
          completedTasks: completed,
          pendingTasks: pending
        }));
              }

      // 处理交易数据
      if (transactionsRes && transactionsRes.data && transactionsRes.data.success) {
        const transactions = transactionsRes.data.data || [];

        setTransactions(transactions);
              }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'file_upload': return '📁';
      case 'score': return '⭐';
      default: return '🔗';
    }
  };

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'file_upload': return '文件上传';
      case 'score': return '评分';
      default: return '其他操作';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString();
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return hash.length > 20 ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` : hash;
  };

  return (
    <div className="dashboard">
      {/* GitHub认证消息 */}
      {githubMessage && (
        <div className={`github-message ${githubMessage.type}`}>
          <div className="github-message-content">
            <span className="github-icon">
              {githubMessage.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="github-text">{githubMessage.message}</span>
            <button 
              className="github-close-btn"
              onClick={() => setGithubMessage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>欢迎回来，{user.username}！</h1>
            <p>这里是您的工作概览</p>
          </div>
                     <div className="github-connection-section">
             <div className={`github-status ${githubStatus.connected ? 'connected' : 'disconnected'}`}>
               <span className="status-icon">
                 {githubStatus.connected ? '✓' : '✕'}
               </span>
               <span className="status-text">
                 {githubStatus.connected ? 'GitHub 已连接' : 'GitHub 未连接'}
               </span>
             </div>
             <button 
               className={`connect-github-btn ${githubStatus.connected ? 'connected' : ''}`}
               onClick={handleConnectGitHub}
             >
               {githubStatus.connected ? '🔄 重新连接' : '🔗 连接GitHub'}
             </button>
           </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalProjects}</h3>
              <p>参与项目</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.totalTasks}</h3>
              <p>总任务数</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completedTasks}</h3>
              <p>已完成</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats.pendingTasks}</h3>
              <p>待处理</p>
            </div>
          </div>
        </div>



               {/* 交易记录 */}
       <div className="dashboard-section">
         <div className="section-header">
           <h3>🔗 交易记录</h3>
         </div>
          
          <div className="transactions-list">
            {transactions.length > 0 ? (
              transactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="transaction-content">
                    <div className="transaction-header">
                      <span className="transaction-type">{getTransactionTypeText(transaction.type)}</span>
                      <span className="transaction-time">{formatTime(transaction.createdAt)}</span>
                    </div>
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-meta">
                      <span className="transaction-user">@{transaction.username}</span>
                      {transaction.transactionHash && (
                        <span className="transaction-hash">
                          哈希: {truncateHash(transaction.transactionHash)}
                        </span>
                      )}
                      {transaction.blockNumber && (
                        <span className="transaction-block">
                          区块: {transaction.blockNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="transaction-status">
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status === 'success' ? '成功' : 
                       transaction.status === 'failed' ? '失败' : '处理中'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-transactions">
                <p>暂无交易记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
