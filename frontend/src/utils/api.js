import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 避免在logout API调用时再次触发401处理
      if (!error.config.url.includes('/logout')) {
        // 直接清除本地存储，不调用logout API
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('address');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 账户管理API
export const accountAPI = {
  login: (credentials) => 
    api.post('/api/accounts/login', credentials),
  
  register: (userData) => 
    api.post('/api/accounts/createAccount', userData),
  
  getProfile: () => 
    api.get('/api/accounts/getBalance'),
  
  updateProfile: (profileData) => 
    api.put('/api/accounts/updateProfile', profileData),

  logout: (username) => 
    api.post('/api/accounts/logout', { username })
};

// 项目管理API
export const projectAPI = {
  createProject: (projectData) => 
    api.post('/api/projectManager/createProject', projectData),
  
  getProjectList: () => 
    api.get('/api/projectManager/getProjectList'),
  
  getMyProjects: () => 
    api.get('/api/projectManager/getMyProjects'),
  
  getProjectDetail: (projectId) => 
    api.get(`/api/projectManager/getProjectDetail/${projectId}`),
  
  updateProject: (projectId, projectData) => 
    api.put(`/api/projectManager/updateProject/${projectId}`, projectData),
  
  deleteProject: (projectId) => 
    api.delete(`/api/projectManager/deleteProject/${projectId}`)
};

// 项目成员管理API
export const memberAPI = {
  addMember: (memberData) => 
    api.post('/api/projectMembers/addProjectMember', memberData),
  
  getMemberList: (projectId) => 
    api.get(`/api/projectMembers/getProjectMemberList/${projectId}`),
  
  updateMember: (projectId, memberData) => 
    api.put(`/api/projectMembers/updateProjectMember/${projectId}`, memberData),
  
  deleteMember: (projectId, username) => 
    api.delete(`/api/projectMembers/deleteProjectMember/${projectId}`, {
      data: { username }
    })
};

// 里程碑管理API
export const milestoneAPI = {
  createMilestone: (milestoneData) => 
    api.post('/api/milestones/createMilestone', milestoneData),
  
  getMilestoneList: (projectId) => 
    api.get(`/api/milestones/getMilestoneList/${projectId}`),
  
  getMilestoneDetail: (milestoneId) => 
    api.get(`/api/milestones/getMilestoneDetail/${milestoneId}`),
  
  updateMilestone: (milestoneId, milestoneData) => 
    api.put(`/api/milestones/updateMilestone/${milestoneId}`, milestoneData),
  
  deleteMilestone: (milestoneId) => 
    api.delete(`/api/milestones/deleteMilestone/${milestoneId}`)
};

// 子任务管理API
export const subtaskAPI = {
  createSubtask: (subtaskData) => 
    api.post('/api/subtasks/createSubtask', subtaskData),
  
  getSubtaskList: (milestoneId) => 
    api.get(`/api/subtasks/getSubtaskList/${milestoneId}`),
  
  getSubtaskDetail: (subtaskId) => 
    api.get(`/api/subtasks/getSubtaskDetail/${subtaskId}`),
  
  updateSubtask: (subtaskId, subtaskData) => 
    api.put(`/api/subtasks/updateSubtask/${subtaskId}`, subtaskData),
  
  deleteSubtask: (subtaskId) => 
    api.delete(`/api/subtasks/deleteSubtask/${subtaskId}`)
};

export const notificationAPI = {
  getNotificationList: () => 
    api.get('/api/notifications/getNotificationList')
};

export default api;
