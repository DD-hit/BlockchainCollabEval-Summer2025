import axios from 'axios'

// API基础URL - 开发环境用本地后端，生产环境用当前域名
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000')



// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

// 请求拦截器 - 自动添加token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('username')
      sessionStorage.removeItem('address')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 统一的API响应处理
const handleApi = async (apiCall) => {
  try {
    const response = await apiCall
    return {
      ok: response.data.success,
      data: response.data.data,
      error: response.data.success ? null : { message: response.data.message }
    }
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: { message: error.response?.data?.message || error.message }
    }
  }
}

// 账户管理API
export const accountAPI = {
  login: (payload) => api.post("/api/accounts/login", payload, { timeout: 60000 }),
  register: (payload) => api.post("/api/accounts/createAccount", payload),
  getBalance: () => handleApi(api.get("/api/accounts/getBalance")),
  updateProfile: (payload) => handleApi(api.put("/api/accounts/updateProfile", payload)),
  logout: () => handleApi(api.post("/api/accounts/logout")),
}

// 项目管理API
export const projectAPI = {
  list: (params = {}) => handleApi(api.get("/api/projectManager/getProjectList", { params })),
  create: (payload) => handleApi(api.post("/api/projectManager/createProject", payload)),
  detail: (projectId) => handleApi(api.get(`/api/projectManager/getProjectDetail/${projectId}`)), 
  update: (projectId, payload) => handleApi(api.put(`/api/projectManager/updateProject/${projectId}`, payload)),
  delete: (projectId) => handleApi(api.delete(`/api/projectManager/deleteProject/${projectId}`)),
  myProjects: () => handleApi(api.get("/api/projectManager/getMyProjects"))
}

// 里程碑管理API
export const milestoneAPI = {
  create: (payload) => handleApi(api.post("/api/milestones/createMilestone", payload)),
  list: (projectId) => handleApi(api.get(`/api/milestones/getMilestoneList/${projectId}`)),
  listByProject: (projectId) => handleApi(api.get(`/api/milestones/getMilestoneList/${projectId}`)),
  detail: (milestoneId) => handleApi(api.get(`/api/milestones/getMilestoneDetail/${milestoneId}`)), // 确保路径正确
  update: (milestoneId, payload) => handleApi(api.put(`/api/milestones/updateMilestone/${milestoneId}`, payload)),
  updateStatus: (milestoneId, status) => handleApi(api.put(`/api/milestones/updateMilestoneStatus/${milestoneId}`, { status })),
  delete: (milestoneId) => handleApi(api.delete(`/api/milestones/deleteMilestone/${milestoneId}`)),
}

// 子任务管理API
export const subtaskAPI = {
  create: (payload) => handleApi(api.post("/api/subtasks/createSubtask", payload)), // 修正路径
  list: (milestoneId) => handleApi(api.get(`/api/subtasks/getSubtaskList/${milestoneId}`)), // 修正路径
  detail: (subtaskId) => handleApi(api.get(`/api/subtasks/getSubtaskDetail/${subtaskId}`)), // 修正路径
  update: (subtaskId, payload) => handleApi(api.put(`/api/subtasks/updateSubtask/${subtaskId}`, payload)), // 修正路径
  delete: (subtaskId) => handleApi(api.delete(`/api/subtasks/deleteSubtask/${subtaskId}`)), // 修正路径
  myTasks: () => handleApi(api.get("/api/subtasks/myTasks"))
}

// 项目成员管理API
export const projectMemberAPI = {
  members: (projectId) => handleApi(api.get(`/api/projectMembers/getProjectMemberList/${projectId}`)),
  list: (projectId) => handleApi(api.get(`/api/projectMembers/getProjectMemberList/${projectId}`)),
  add: (payload) => handleApi(api.post("/api/projectMembers/addProjectMember", payload)),
  update: (projectId, payload) => handleApi(api.put(`/api/projectMembers/updateProjectMember/${projectId}`, payload)),
  delete: (projectId, payload) => handleApi(api.delete(`/api/projectMembers/deleteProjectMember/${projectId}`, { data: payload }))
}



// 文件管理API
export const fileAPI = {
  uploadToSubtask: (subtaskId, file, password) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subtaskId', subtaskId)
    formData.append('description', file.name)
    formData.append('password', password)
    return handleApi(api.post("/api/files/upload", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }))
  },
  listBySubtask: (subtaskId) => handleApi(api.get(`/api/files/subtask/${subtaskId}`)),
  download: async (fileId) => {
    try {
      const response = await api.get(`/api/files/download/${fileId}`, {
        responseType: 'blob'
      })
      return {
        ok: true,
        data: response.data,
        error: null
      }
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: { message: error.response?.data?.message || error.message }
      }
    }
  },
  delete: (fileId) => handleApi(api.delete(`/api/files/${fileId}`)),
}

// 通知管理API
export const notificationAPI = {
  list: (username) => handleApi(api.get(`/api/notifications/getNotificationList/${username}`)),
  markAsRead: (notificationId) => handleApi(api.put(`/api/notifications/markAsRead/${notificationId}`)),
  markAsReadByFileId: (fileId) => handleApi(api.put("/api/notifications/markAsReadByFileId", { fileId })),
  markAllAsRead: () => handleApi(api.put("/api/notifications/markAllAsRead")),
  getUnreadCount: () => handleApi(api.get("/api/notifications/unreadCount")),
  getAllNotifications: () => handleApi(api.get("/api/notifications/getAllNotifications")),
}

// 评分管理API
export const scoreAPI = {
  submit: (payload) => handleApi(api.post("/api/score/submit", payload)),
  getContract: (contractAddress) => handleApi(api.get(`/api/score/contract/${contractAddress}`)),
  getAverage: (contractAddress) => handleApi(api.get(`/api/score/average/${contractAddress}`)),
  getScorersCount: (contractAddress) => handleApi(api.get(`/api/score/count/${contractAddress}`)),
  getContributionPoints: (contractAddress) => handleApi(api.get(`/api/score/points/${contractAddress}`)),
  getUserScore: (contractAddress, userAddress) => handleApi(api.get(`/api/score/user-score/${contractAddress}?userAddress=${userAddress}`)),
  getTimeFactor: (contractAddress) => handleApi(api.get(`/api/score/time-factor/${contractAddress}`)),
  getMemberContributions: (projectId) => handleApi(api.get(`/api/score/getMemberContributions/${projectId}`)),
  getProjectContributions: (projectId) => handleApi(api.get(`/api/score/getProjectContributions/${projectId}`)),
  manualUpdate: (contractAddress) => handleApi(api.post(`/api/score/manual-update/${contractAddress}`)),
  checkStatus: (contractAddress) => handleApi(api.get(`/api/score/status/${contractAddress}`)),
}

// 评论管理API
export const commentAPI = {
  create: (payload) => handleApi(api.post("/api/comments/create", payload)),
  listBySubtask: (subtaskId) => handleApi(api.get(`/api/comments/subtask/${subtaskId}`)),
  delete: (commentId) => handleApi(api.delete(`/api/comments/${commentId}`)),
}

export default api












