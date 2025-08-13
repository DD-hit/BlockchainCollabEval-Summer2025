import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { projectAPI, subtaskAPI } from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      <div className="dashboard-header">
        <h1>欢迎回来，{user.username}！</h1>
        <p>这里是您的工作概览</p>
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
