import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './TransactionList.css';

const TransactionList = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    fileUploads: 0,
    scores: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/transactions/recent?limit=100');
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('加载交易记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/transactions/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载交易统计失败:', error);
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
    return date.toLocaleString('zh-CN');
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return hash.length > 20 ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` : hash;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.transactionHash && transaction.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    loadTransactions();
    loadStats();
  };

  return (
    <div className="transaction-list-page">
      <div className="transaction-header">
        <h1>🔗 交易记录</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            title="刷新列表"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalTransactions}</h3>
            <p>总交易数</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.successfulTransactions}</h3>
            <p>成功交易</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.fileUploads}</h3>
            <p>文件上传</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.scores}</h3>
            <p>评分记录</p>
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="filter-section">
        <div className="filter-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">全部类型</option>
            <option value="file_upload">文件上传</option>
            <option value="score">评分</option>
          </select>
          
          <input
            type="text"
            placeholder="搜索交易描述、用户或哈希..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* 交易列表 */}
      <div className="transactions-container">
        {loading ? (
          <div className="loading">
            <p>⏳ 加载中...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="transactions-list">
            {filteredTransactions.map(transaction => (
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
                    {transaction.gasUsed && (
                      <span className="transaction-gas">
                        Gas: {transaction.gasUsed}
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
            ))}
          </div>
        ) : (
          <div className="no-transactions">
            <h3>暂无交易记录</h3>
            <p>当前筛选条件下没有找到交易记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
