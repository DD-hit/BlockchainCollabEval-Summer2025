import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import SubtaskManagement from '../Subtask/SubtaskManagement';
import './TaskBoard.css';

const TaskBoard = ({ user }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // 监听子任务状态变化，自动刷新项目数据
  useEffect(() => {

    
    const handleSubtaskChange = (event) => {
      
      loadProjectData();
    };

    // 监听自定义事件
    window.addEventListener('subtaskStatusChanged', handleSubtaskChange);
    
    
    return () => {
      window.removeEventListener('subtaskStatusChanged', handleSubtaskChange);
      
    };
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [projectRes, milestonesRes] = await Promise.all([
        api.get(`/api/projectManager/detail/${projectId}`),
        api.get(`/api/milestones/list/${projectId}`)
      ]);

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      if (milestonesRes.data.success) {
        const milestoneList = milestonesRes.data.data;
        setMilestones(milestoneList);
        // 默认选择第一个里程碑
        if (milestoneList.length > 0) {
          setSelectedMilestone(milestoneList[0]);
        }
      }
    } catch (error) {
      console.error('加载项目数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载任务看板...</div>;
  }

  if (!project) {
    return <div className="error">项目不存在</div>;
  }

  const isProjectOwner = project.projectOwner === user.username;

  return (
    <div className="task-board-page">
      <div className="task-board-header">
        <div className="project-info">
          <h1>📋 {project.projectName} - 任务看板</h1>
          <p>{project.description}</p>
        </div>
        
        {milestones.length > 0 && (
          <div className="milestone-selector">
            <label>选择里程碑:</label>
            <select
              value={selectedMilestone?.id || ''}
              onChange={(e) => {
                const milestone = milestones.find(m => m.id === parseInt(e.target.value));
                setSelectedMilestone(milestone);
              }}
            >
              {milestones.map(milestone => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedMilestone ? (
        <div className="selected-milestone-info">
          <h2>🎯 {selectedMilestone.title}</h2>
          {selectedMilestone.description && (
            <p>{selectedMilestone.description}</p>
          )}
        </div>
      ) : (
        <div className="no-milestone">
          <h3>没有里程碑</h3>
          <p>请先创建里程碑才能管理任务</p>
        </div>
      )}

      {selectedMilestone && (
        <SubtaskManagement
          projectId={projectId}
          milestoneId={selectedMilestone.id}
          user={user}
          isProjectOwner={isProjectOwner}
          onSubtaskChange={loadProjectData}
        />
      )}
    </div>
  );
};

export default TaskBoard;
