import React, { useState, useEffect } from 'react';
import './ContributorsDashboard.css';

const ContributorsDashboard = ({ contributors = [], commits = [], contribScores = [], onShowUserRounds }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('commits');
  const [weeklyData, setWeeklyData] = useState([]);
  const [contributorStats, setContributorStats] = useState({});

  useEffect(() => {
    if (contributors.length > 0) {
      processWeeklyData();
      processContributorStats();
    }
  }, [contributors, commits, selectedMetric, selectedPeriod]);

  // 获取根据期间选择的数据点数量
  const getDataPointCount = () => {
    switch (selectedPeriod) {
      case 'week':
        return 7; // 本周显示7天（周一到周日）
      case 'all':
      default:
        return 12; // 全部显示12个月
    }
  };

  // 根据选择的期间过滤提交数据
  const getFilteredCommits = () => {
    if (commits.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        // 本周：从周一开始到周日
        const dayOfWeek = now.getDay(); // 0是周日，1是周一
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(now.getDate() - daysFromMonday);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        // 全部：从最早的提交开始
        if (commits.length > 0) {
          const earliestCommit = commits.reduce((earliest, commit) => {
            const commitDate = new Date(commit.commit.author.date);
            return commitDate < earliest ? commitDate : earliest;
          }, new Date(commits[0].commit.author.date));
          startDate = earliestCommit;
        } else {
          startDate = new Date(0); // 从1970年开始
        }
        break;
    }
    
    const filtered = commits.filter(commit => {
      const commitDate = new Date(commit.commit.author.date);
      return commitDate >= startDate && commitDate <= now;
    });
    
    return filtered;
  };

  const processWeeklyData = () => {
    const now = new Date();
    const dataPointCount = getDataPointCount();
    let dataPoints = [];
    
    if (selectedPeriod === 'week') {
      // 本周：显示周一到周日
      const monday = new Date(now);
      const dayOfWeek = now.getDay(); // 0是周日，1是周一
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(now.getDate() - daysFromMonday);
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        dataPoints.push(day);
      }
    } else {
      // 全部：显示每月
      if (commits.length > 0) {
        const earliestCommit = commits.reduce((earliest, commit) => {
          const commitDate = new Date(commit.commit.author.date);
          return commitDate < earliest ? commitDate : earliest;
        }, new Date(commits[0].commit.author.date));
        
        const months = [];
        const current = new Date(earliestCommit.getFullYear(), earliestCommit.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 1);
        
        while (current <= end) {
          months.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
        
        dataPoints = months.slice(-12); // 只显示最近12个月
      }
    }

    const filteredCommits = getFilteredCommits();
    
    const stats = dataPoints.map(datePoint => {
      let metricValue = 0;
      
      if (selectedPeriod === 'week') {
        // 本周：按天统计
        const dayStart = new Date(datePoint);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(datePoint);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayCommits = filteredCommits.filter(commit => {
          const commitDate = new Date(commit.commit.author.date);
          return commitDate >= dayStart && commitDate <= dayEnd;
        });
        
        if (selectedMetric === 'commits') {
          metricValue = dayCommits.length;
        } else if (selectedMetric === 'additions') {
          metricValue = dayCommits.reduce((sum, commit) => 
            sum + (commit.stats?.additions || 0), 0
          );
        } else if (selectedMetric === 'deletions') {
          metricValue = dayCommits.reduce((sum, commit) => 
            sum + (commit.stats?.deletions || 0), 0
          );
        }
        
        return {
          week: datePoint,
          value: metricValue,
          label: getDayName(datePoint.getDay())
        };
      } else {
        // 全部：按月统计
        const monthStart = new Date(datePoint);
        const monthEnd = new Date(datePoint.getFullYear(), datePoint.getMonth() + 1, 0);

        const monthCommits = filteredCommits.filter(commit => {
          const commitDate = new Date(commit.commit.author.date);
          return commitDate >= monthStart && commitDate <= monthEnd;
        });
        
        if (selectedMetric === 'commits') {
          metricValue = monthCommits.length;
        } else if (selectedMetric === 'additions') {
          metricValue = monthCommits.reduce((sum, commit) => 
            sum + (commit.stats?.additions || 0), 0
          );
        } else if (selectedMetric === 'deletions') {
          metricValue = monthCommits.reduce((sum, commit) => 
            sum + (commit.stats?.deletions || 0), 0
          );
        }

        return {
          week: monthStart,
          value: metricValue,
          label: `${monthStart.getMonth() + 1}月`
        };
      }
    });

    setWeeklyData(stats);
  };

  const processContributorStats = () => {
    const stats = {};
    const filteredCommits = getFilteredCommits();
    
    contributors.forEach(contributor => {
      // 匹配贡献者的提交记录
      const contributorCommits = filteredCommits.filter(commit => {
        const authorLogin = commit.author?.login;
        const commitAuthorName = commit.commit?.author?.name;
        const contributorLogin = contributor.login;
        
        return authorLogin === contributorLogin || 
               commitAuthorName === contributorLogin ||
               authorLogin === contributorLogin.toLowerCase() ||
               commitAuthorName === contributorLogin.toLowerCase();
      });

      let commitsCount = contributorCommits.length;
      // 使用真实的stats数据，如果没有则使用模拟数据
      let additionsCount = contributorCommits.reduce((sum, commit) => 
        sum + (commit.stats?.additions || 0), 0
      );
      let deletionsCount = contributorCommits.reduce((sum, commit) => 
        sum + (commit.stats?.deletions || 0), 0
      );
      
      // 如果没有stats数据，使用模拟数据
      if (additionsCount === 0 && deletionsCount === 0) {
        additionsCount = contributor.contributions * 10;
        deletionsCount = contributor.contributions * 3;
      }
      
      // 如果没有提交数据，使用贡献者数据作为基础
      if (commitsCount === 0) {
        commitsCount = contributor.contributions || 0;
      }

      const weeks = [];
      const now = new Date();
      
      if (selectedPeriod === 'week') {
        // 本周：按天统计
        const monday = new Date(now);
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        monday.setDate(now.getDate() - daysFromMonday);
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayCommits = contributorCommits.filter(commit => {
            const commitDate = new Date(commit.commit.author.date);
            return commitDate >= dayStart && commitDate <= dayEnd;
          });

          let dayValue = 0;
          if (selectedMetric === 'commits') {
            dayValue = dayCommits.length;
          } else if (selectedMetric === 'additions') {
            dayValue = dayCommits.reduce((sum, commit) => 
              sum + (commit.stats?.additions || 0), 0
            );
          } else if (selectedMetric === 'deletions') {
            dayValue = dayCommits.reduce((sum, commit) => 
              sum + (commit.stats?.deletions || 0), 0
            );
          }
          
          weeks.push(dayValue);
        }
      } else {
        // 全部：按月统计
        if (commits.length > 0) {
          const earliestCommit = commits.reduce((earliest, commit) => {
            const commitDate = new Date(commit.commit.author.date);
            return commitDate < earliest ? commitDate : earliest;
          }, new Date(commits[0].commit.author.date));
          
          const months = [];
          const current = new Date(earliestCommit.getFullYear(), earliestCommit.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 1);
          
          while (current <= end) {
            months.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
          }
          
          const recentMonths = months.slice(-12); // 只显示最近12个月
          
          recentMonths.forEach(monthStart => {
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            const monthCommits = contributorCommits.filter(commit => {
              const commitDate = new Date(commit.commit.author.date);
              return commitDate >= monthStart && commitDate <= monthEnd;
            });

            let monthValue = 0;
            if (selectedMetric === 'commits') {
              monthValue = monthCommits.length;
            } else if (selectedMetric === 'additions') {
              monthValue = monthCommits.reduce((sum, commit) => 
                sum + (commit.stats?.additions || 0), 0
              );
            } else if (selectedMetric === 'deletions') {
              monthValue = monthCommits.reduce((sum, commit) => 
                sum + (commit.stats?.deletions || 0), 0
              );
            }

            weeks.push(monthValue);
          });
        }
      }

      stats[contributor.login] = {
        commits: commitsCount,
        additions: additionsCount,
        deletions: deletionsCount,
        weeklyData: weeks,
        avatar: contributor.avatar_url,
        contributions: contributor.contributions
      };
    });

    setContributorStats(stats);
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };

  const getDayName = (day) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[day];
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'commits': return '提交';
      case 'additions': return '新增内容';
      case 'deletions': return '删除';
      default: return '提交';
    }
  };

  const getMetricUnit = () => {
    switch (selectedMetric) {
      case 'commits': return '次';
      case 'additions': return '行';
      case 'deletions': return '行';
      default: return '次';
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getMaxValue = () => {
    if (weeklyData.length === 0) return 1;
    const allValues = weeklyData.map(item => item.value);
    const maxValue = Math.max(...allValues);
    // 确保最大值至少为1，避免除以0的情况
    return maxValue > 0 ? maxValue : 1;
  };

  const getContributorMaxValue = () => {
    if (Object.keys(contributorStats).length === 0) return 1;
    const allValues = Object.values(contributorStats).map(stats => 
      stats[selectedMetric] || 0
    );
    const maxValue = Math.max(...allValues);
    // 确保最大值至少为1，避免除以0的情况
    return maxValue > 0 ? maxValue : 1;
  };

  // 获取小图表的最大值（基于周数据）
  const getMiniChartMaxValue = () => {
    if (Object.keys(contributorStats).length === 0) return 1;
    
    // 收集所有贡献者的周数据
    const allWeeklyValues = Object.values(contributorStats)
      .filter(stats => stats.weeklyData && stats.weeklyData.length > 0)
      .flatMap(stats => stats.weeklyData);
    
    if (allWeeklyValues.length === 0) return 1;
    
    const maxValue = Math.max(...allWeeklyValues);
    return maxValue > 0 ? maxValue : 1;
  };

  // 即使 contributors 为空，也要让排行榜渲染（常驻）。

  if (error) {
    return <div className="contributors-error">{error}</div>;
  }

  return (
    <div className="contributors-dashboard">
      <div className="contributors-header">
        <h1>贡献者</h1>
        <div className="contributors-controls">
          <div className="control-group">
            <label>期间:</label>
                         <select 
               value={selectedPeriod} 
               onChange={(e) => setSelectedPeriod(e.target.value)}
               className="period-select"
             >
               <option value="all">全部</option>
               <option value="week">本周</option>
             </select>
          </div>
          <div className="control-group">
            <label>贡献:</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="metric-select"
            >
              <option value="commits">提交</option>
              <option value="additions">新增内容</option>
              <option value="deletions">删除</option>
            </select>
          </div>
        </div>
      </div>

      {/* 贡献度排行榜（0-100） */}
      {contribScores && contribScores.length > 0 && (
        <div className="contrib-leaderboard" style={{ marginTop: 16 }}>
          <h2>贡献度排行榜</h2>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>用户</th>
                <th>地址</th>
                <th>贡献点</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {contribScores
                .slice()
                .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
                .map((s, idx) => (
                  <tr key={s.address || idx}>
                    <td>{idx + 1}</td>
                    <td>{s.github_login || s.username || '-'}</td>
                    <td title={s.address}>
                      {s.address ? `${s.address.slice(0, 6)}...${s.address.slice(-4)}` : (s.username || '-')}
                    </td>
                    <td>{Number.isFinite(s.finalScore) ? Math.round(s.finalScore) : '-'}</td>
                    <td>
                      {(s.username || s.address) && (
                        <button
                          className="refresh-btn"
                          onClick={() => onShowUserRounds && onShowUserRounds(s.username || null, s.address || null)}
                        >贡献详情</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overall-chart-section">
        {/* 标题移除按需显示：可在此处加面包屑或留白 */}
        <div className="chart-info">
          {weeklyData.length > 0 && (
            <span>
              {selectedPeriod === 'week' ? (
                `${weeklyData[0].week.toLocaleDateString('zh-CN')} 至 ${weeklyData[weeklyData.length - 1].week.toLocaleDateString('zh-CN')} 每日`
              ) : (
                `${weeklyData[0].week.toLocaleDateString('zh-CN')} 至 ${weeklyData[weeklyData.length - 1].week.toLocaleDateString('zh-CN')} 每周`
              )}
            </span>
          )}
        </div>
        
        <div className="chart-wrapper">
          <div className="main-chart">
            {/* Y轴标签 */}
            <div className="y-axis">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div key={percent} className="y-axis-label">
                  {Math.round((percent / 100) * getMaxValue())}
                </div>
              ))}
            </div>
            
            {/* 图表网格和柱状图 */}
            <div className="chart-container">
              {/* 网格线 */}
              <div className="chart-grid">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div 
                    key={percent} 
                    className="grid-line"
                    style={{ bottom: `${percent}%` }}
                  />
                ))}
              </div>
              
              {/* 柱状图 */}
              <div className="chart-bars">
                {weeklyData.map((week, index) => (
                  <div key={index} className="chart-bar-container">
                    <div 
                      className="chart-bar"
                      style={{ 
                        height: `${(week.value / getMaxValue()) * 100}%`,
                        backgroundColor: '#0366d6'
                      }}
                      title={`${getMetricLabel()} ${week.value}`}
                    />
                    <div className="bar-label">{week.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 横纵轴标题已移除 */}
        </div>
      </div>

      <div className="contributors-leaderboard">
        <h2>成员贡献</h2>
        <div className="contributors-grid">
          {contributors
            .sort((a, b) => {
              const statsA = contributorStats[a.login] || {};
              const statsB = contributorStats[b.login] || {};
              return (statsB[selectedMetric] || 0) - (statsA[selectedMetric] || 0);
            })
            .map((contributor, index) => {
              const stats = contributorStats[contributor.login] || {};
              const rank = index + 1;
              
              return (
                <div key={contributor.id} className="contributor-card">
                  <div className="contributor-header">
                    <div className="contributor-rank">#{rank}</div>
                    <img 
                      src={contributor.avatar_url} 
                      alt={contributor.login}
                      className="contributor-avatar"
                    />
                    <div className="contributor-info">
                      <h3 className="contributor-name">{contributor.login}</h3>
                      <div className="contributor-stats">
                        <span className="stat-main">{stats[selectedMetric] || 0} {getMetricUnit()}{getMetricLabel()}</span>
                        {selectedMetric === 'additions' && (
                          <span className="additions">+{formatNumber(stats.additions || 0)}</span>
                        )}
                        {selectedMetric === 'deletions' && (
                          <span className="deletions">-{formatNumber(stats.deletions || 0)}</span>
                        )}
                        {selectedMetric === 'commits' && (
                          <>
                            <span className="additions">+{formatNumber(stats.additions || 0)}</span>
                            <span className="deletions">-{formatNumber(stats.deletions || 0)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* 操作按钮已移除，避免布局受影响 */}
                  </div>
                  
                  <div className="contributor-chart">
                    <div className="mini-chart-wrapper">
                      {/* 迷你图表的Y轴标签 */}
                      <div className="mini-y-axis">
                        {[0, 50, 100].map((percent) => (
                          <div key={percent} className="mini-y-label">
                            {Math.round((percent / 100) * getMiniChartMaxValue())}
                          </div>
                        ))}
                      </div>
                      
                      {/* 迷你图表容器 */}
                      <div className="mini-chart-container">
                        {/* 迷你图表网格线 */}
                        <div className="mini-chart-grid">
                          {[0, 50, 100].map((percent) => (
                            <div 
                              key={percent} 
                              className="mini-grid-line"
                              style={{ bottom: `${percent}%` }}
                            />
                          ))}
                        </div>
                        
                                                 {/* 迷你柱状图 */}
                         <div className="mini-chart">
                           {stats.weeklyData?.map((value, weekIndex) => (
                             <div key={weekIndex} className="mini-bar-container">
                               <div 
                                 className="mini-bar"
                                 style={{ 
                                   height: `${(value / getMiniChartMaxValue()) * 100}%`,
                                   backgroundColor: '#0366d6'
                                 }}
                                 title={`${getMetricLabel()}: ${value}`}
                               />
                               <div className="mini-bar-label">
                                 {weeklyData[weekIndex]?.label || `${weekIndex + 1}`}
                               </div>
                             </div>
                           )) || Array.from({ length: getDataPointCount() }, (_, i) => (
                             <div key={i} className="mini-bar-container">
                               <div 
                                 className="mini-bar"
                                 style={{ 
                                   height: '20%',
                                   backgroundColor: '#0366d6'
                                 }}
                               />
                               <div className="mini-bar-label">
                                 {weeklyData[i]?.label || `${i + 1}`}
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ContributorsDashboard;
