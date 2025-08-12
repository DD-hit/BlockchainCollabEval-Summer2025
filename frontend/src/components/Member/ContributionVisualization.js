import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ContributionVisualization.css';

const ContributionVisualization = ({ projectId }) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributions();
  }, [projectId]);

  const loadContributions = async () => {
    try {
      const response = await api.get(`/api/score/project/${projectId}/contributions`);
      if (response.data.success) {
        setContributions(response.data.data);
      }
    } catch (error) {
      console.error('加载贡献数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载贡献数据...</div>;

  return (
    <div className="contribution-visualization">
      <div className="contribution-chart">
        {contributions.map((member, index) => (
          <div key={member.username} className="contribution-bar">
            <div className="member-info">
              <span className="member-name">{member.username}</span>
              <span className="contribution-score">{member.score}分</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(member.score / Math.max(...contributions.map(c => c.score))) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionVisualization;
