import React, { useState, useEffect } from 'react';
import { scoreAPI, notificationAPI } from '../../utils/api';
import './ScoreModal.css';

const ScoreModal = ({ file, onClose, user, onScoreSubmitted }) => {
  const [score, setScore] = useState(5);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [hasScored, setHasScored] = useState(false);

  // 判断是否为详情查看模式
  const isDetailsView = file.isDetailsView || file.username === user.username;

  useEffect(() => {
    if (file.address && file.address !== 'undefined') {
      loadContractInfo();
      // 只有在评分模式且不是详情查看时才加载用户评分
      if (!isDetailsView) {
        loadUserScore();
      }
    } else {
      console.warn('文件没有合约地址:', file.address);
    }
  }, [file.address, isDetailsView]);

  const loadContractInfo = async () => {
    try {


      const result = await scoreAPI.getContract(file.address);


      if (result.ok) {
        setContractInfo(result.data);

      } else {
        console.error('合约信息加载失败:', result.error?.message);
        // 即使API失败，也显示合约地址
        setContractInfo({
          averageScore: 0,
          scoreCount: 0,
          contributionPoints: 0,
          timeFactor: 0,
          subtaskEndtime: 0
        });
      }
    } catch (error) {
      console.error('获取合约信息失败:', error);
      // 即使API失败，也显示合约地址
      setContractInfo({
        averageScore: 0,
        scoreCount: 0,
        contributionPoints: 0,
        timeFactor: 0,
        subtaskEndtime: 0
      });
    }
  };

  const loadUserScore = async () => {
    try {
      // 如果没有用户地址，尝试从sessionStorage获取
      const userAddress = user.address || sessionStorage.getItem('address') || sessionStorage.getItem('userAddress');
      if (!userAddress) {
        console.warn('用户地址未找到，无法获取评分信息');
        return;
      }

      const result = await scoreAPI.getUserScore(file.address, userAddress);
      if (result.ok) {
        setUserScore(result.data.score);
        setHasScored(result.data.hasScored);
      }
    } catch (error) {
      console.error('获取用户评分失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      alert('请输入密码');
      return;
    }

    // 检查是否为文件上传者
    if (file.username === user.username) {
      alert('不能给自己的文件评分');
      return;
    }

    try {
      setSubmitting(true);
      const result = await scoreAPI.submit({
        contractAddress: file.address,
        score: score,
        password: password.trim()
      });

      if (result.ok) {
        alert('评分成功！');
        setHasScored(true);
        setUserScore(score);
        loadContractInfo(); // 刷新合约信息

        // 标记相关通知为已读
        try {
          await notificationAPI.markAsReadByFileId(file.id);

        } catch (error) {
          console.error('标记通知为已读失败:', error);
        }

        if (onScoreSubmitted) {
          onScoreSubmitted();
        }
        onClose();
      } else {
        alert(`评分失败: ${result.error?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('评分失败:', error);
      alert(`评分失败: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/download`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.fileName
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "未设置";

    let date;
    // 检查timestamp是否为数字
    if (typeof timestamp === 'number') {
      // 如果是毫秒时间戳
      if (timestamp > 1000000000000) {
        date = new Date(timestamp);
      } else {
        // 如果是秒时间戳
        date = new Date(timestamp * 1000);
      }
    } else {
      // 如果是字符串，尝试解析
      const time = parseInt(timestamp);
      if (isNaN(time)) {
        // 如果不是数字，尝试直接解析日期字符串
        date = new Date(timestamp);
      } else {
        // 如果是数字字符串
        if (time > 1000000000000) {
          date = new Date(time);
        } else {
          date = new Date(time * 1000);
        }
      }
    }

    if (isNaN(date.getTime())) return "未设置";
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="score-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isDetailsView ? '📋 文件详情' : '📊 文件评分'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 文件信息 */}
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div>
              <h4>{file.originalName}</h4>
              <p>上传者: {file.username}</p>
              <p>上传时间: {formatDate(file.uploadTime)}</p>
              {file.description && (
                <p>描述: {file.description}</p>
              )}
            </div>
          </div>

          {/* 合约信息 - 在详情模式和评分模式中都显示 */}
          {file.address && file.address !== 'undefined' && (
            <div className="contract-info-section">
              <div className="info-grid">
                {contractInfo ? (
                  <>
                    <div className="info-item">
                      <span className="info-label">当前平均分:</span>
                      <span className="info-value">{contractInfo.averageScore || 0}/10</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">评分人数:</span>
                      <span className="info-value">{contractInfo.scoreCount || 0}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">贡献点数:</span>
                      <span className="info-value">{contractInfo.contributionPoints || 0}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">时间因子:</span>
                      <span className="info-value">{contractInfo.timeFactor || 0}/1000</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">截止时间:</span>
                      <span className="info-value">{formatDate(contractInfo.subtaskEndtime)}</span>
                    </div>
                  </>
                ) : (
                  <div className="info-item">
                    <span className="info-label">合约信息:</span>
                    <span className="info-value">加载中...</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">合约地址:</span>
                  <span className="info-value contract-address">{file.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* 详情模式：显示下载按钮和文件详情 */}
          {isDetailsView ? (
            <div className="details-section">
              <div className="download-section">
                <button
                  className="download-btn"
                  onClick={handleDownload}
                >
                  📥 下载文件
                </button>
              </div>

              <div className="scored-section">
                <div className="scored-info">
                  <div className="scored-icon">📋</div>
                  <div className="scored-text">
                    <h4>文件详情</h4>
                    <p>文件大小: {file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : '未知'}</p>
                    <p>文件类型: {file.fileType || '未知'}</p>
                    <p>文件哈希: {file.fileHash || '未知'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={onClose}>关闭</button>
              </div>
            </div>
          ) : (
            /* 评分模式：显示评分表单或已评分状态 */
            <>
              {!hasScored ? (
                <form onSubmit={handleSubmit}>
                  <div className="score-section">
                    <label>评分(1-10分):</label>
                    <div className="score-display">
                      <span className="score-value">{score}</span>
                    </div>
                    <div className="score-slider">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        className="slider"
                      />
                      <div className="slider-labels">
                        <span>1</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>

                  <div className="password-section">
                    <label>密码:</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入您的密码"
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={onClose}>取消</button>
                    <button type="submit" disabled={submitting}>
                      {submitting ? '提交中...' : '提交评分'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="scored-section">
                  <div className="scored-info">
                    <div className="scored-icon">✅</div>
                    <div className="scored-text">
                      <h4>您已评分</h4>
                      <p>您的评分: {userScore}/10</p>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={onClose}>关闭</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;
