import React, { useState } from 'react';
import api from '../../utils/api';
import './ScoreModal.css';

const ScoreModal = ({ file, onClose, user }) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score === 0) return;

    try {
      setSubmitting(true);
      const response = await api.post('/api/score/create', {
        fileId: file.id,
        score,
        comment,
        projectId: file.projectId
      });

      if (response.data.success) {
        onClose();
      }
    } catch (error) {
      console.error('评分失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="score-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>文件评分</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div>
              <h4>{file.fileName}</h4>
              <p>上传者: {file.uploader}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="score-section">
              <label>评分 (1-10分)</label>
              <div className="score-buttons">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`score-btn ${score === num ? 'active' : ''}`}
                    onClick={() => setScore(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="comment-section">
              <label>评价说明 (可选)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入评价说明..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose}>取消</button>
              <button type="submit" disabled={score === 0 || submitting}>
                {submitting ? '提交中...' : '提交评分'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;
