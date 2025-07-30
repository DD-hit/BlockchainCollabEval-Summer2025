// API 工具类
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  // 获取认证头
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // GET 请求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST 请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT 请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE 请求
  async delete(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...(data && { body: JSON.stringify(data) })
    });
  }
}

export const api = new ApiClient();

// 账户相关API
export const accountAPI = {
  login: (username, password) => 
    api.post('/api/accounts/login', { username, password }),
  
  register: (username, password) => 
    api.post('/api/accounts/createAccount', { username, password }),
  
  getBalance: (address) => 
    api.get(`/api/accounts/getBalance/${address}`)
};

// 项目管理API
export const projectAPI = {
  createProject: (projectData) => 
    api.post('/api/projectManager/createProject', projectData),
  
  getProjectList: () => 
    api.get('/api/projectManager/getProjectList'),
  
  getProjectDetail: (projectId) => 
    api.get(`/api/projectManager/getProjectDetail/${projectId}`)
};

// 项目成员API
export const memberAPI = {
  addMember: (projectId, username) => 
    api.post('/api/projectMembers/addProjectMember', { projectId, username }),
  
  getMemberList: (projectId) => 
    api.get(`/api/projectMembers/getProjectMemberList/${projectId}`),
  
  deleteMember: (projectId, username) => 
    api.delete(`/api/projectMembers/deleteProjectMember/${projectId}`, { username }),
  
  updateMember: (projectId, memberData) => 
    api.put(`/api/projectMembers/updateProjectMember/${projectId}`, memberData)
};

// 里程碑API
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

// 子任务API
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