import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './TodoList.css';

const TodoList = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      // 获取用户相关的待办任务
      const response = await api.get('/api/subtasks/my-tasks');
      if (response.data.success) {
        const pendingTasks = response.data.data.filter(task => 
          task.status !== 'completed' && task.assignee === user.username
        );
        setTodos(pendingTasks);
      }
    } catch (error) {
      console.error('加载待办事项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="todo-loading">加载待办事项...</div>;
  }

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h3>📋 我的待办</h3>
        <span className="todo-count">{todos.length}</span>
      </div>
      
      <div className="todo-items">
        {todos.length > 0 ? (
          todos.map(todo => (
            <div key={todo.id} className="todo-item">
              <div className="todo-priority">
                <span className={`priority-dot priority-${todo.priority}`}></span>
              </div>
              <div className="todo-content">
                <h4>{todo.title}</h4>
                <p>{todo.description}</p>
                <div className="todo-meta">
                  <span className="todo-project">{todo.projectName}</span>
                  <span className="todo-deadline">
                    截止: {new Date(todo.endTime * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-todos">
            <span>🎉</span>
            <p>暂无待办事项</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
