import axios from 'axios'

// 前端在3000端口，API请求也发送到3000端口（通过代理转发到后端5000端口）
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

console.log('🔍 API Base URL:', API_BASE_URL); // 调试日志

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
  login: (payload) => api.post("/api/accounts/login", payload),
  register: (payload) => api.post("/api/accounts/createAccount", payload),
  getBalance: () => handleApi(api.get("/api/accounts/getBalance")),
  updateProfile: (payload) => handleApi(api.put("/api/accounts/updateProfile", payload)),
  logout: () => handleApi(api.post("/api/accounts/logout")),
}

// 项目管理API
export const projectAPI = {
  list: (params = {}) => handleApi(api.get("/api/projectManager/getProjectList", { params })),
  create: (payload) => handleApi(api.post("/api/projectManager/createProject", payload)),
  detail: (projectId) => handleApi(api.get(`/api/projectManager/getProjectDetail/${projectId}`)), // 确保路径正确
  update: (projectId, payload) => handleApi(api.put(`/api/projectManager/updateProject/${projectId}`, payload)),
  myProjects: () => handleApi(api.get("/api/projectManager/my-projects")),
  members: (projectId) => handleApi(api.get(`/api/projectMembers/getProjectMemberList/${projectId}`)),
}

// 里程碑管理API
export const milestoneAPI = {
  create: (payload) => handleApi(api.post("/api/milestones/createMilestone", payload)),
  list: (projectId) => handleApi(api.get(`/api/milestones/getMilestoneList/${projectId}`)),
  listByProject: (projectId) => handleApi(api.get(`/api/milestones/getMilestoneList/${projectId}`)),
  detail: (milestoneId) => handleApi(api.get(`/api/milestones/getMilestoneDetail/${milestoneId}`)), // 确保路径正确
  update: (milestoneId, payload) => handleApi(api.put(`/api/milestones/updateMilestone/${milestoneId}`, payload)),
  delete: (milestoneId) => handleApi(api.delete(`/api/milestones/deleteMilestone/${milestoneId}`)),
}

// 子任务管理API
export const subtaskAPI = {
  create: (payload) => handleApi(api.post("/api/subtasks/createSubtask", payload)), // 修正路径
  list: (milestoneId) => handleApi(api.get(`/api/subtasks/getSubtaskList/${milestoneId}`)), // 修正路径
  detail: (subtaskId) => handleApi(api.get(`/api/subtasks/getSubtaskDetail/${subtaskId}`)), // 修正路径
  update: (subtaskId, payload) => handleApi(api.put(`/api/subtasks/updateSubtask/${subtaskId}`, payload)), // 修正路径
  delete: (subtaskId) => handleApi(api.delete(`/api/subtasks/deleteSubtask/${subtaskId}`)), // 修正路径
}

// 评论管理API
export const commentAPI = {
  create: (payload) => handleApi(api.post("/api/comments/create", payload)),
  listBySubtask: (subtaskId) => handleApi(api.get(`/api/comments/subtask/${subtaskId}`)),
  update: (commentId, payload) => handleApi(api.put(`/api/comments/${commentId}`, payload)),
  delete: (commentId) => handleApi(api.delete(`/api/comments/${commentId}`)),
}

// 文件管理API
export const fileAPI = {
  uploadToSubtask: (subtaskId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('subtaskId', subtaskId)
    formData.append('description', file.name)
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
  list: () => handleApi(api.get("/api/notifications")),
  markAsRead: (notificationId) => handleApi(api.put(`/api/notifications/${notificationId}/read`)),
  markAllAsRead: () => handleApi(api.put("/api/notifications/read-all")),
}

// 评分管理API
export const scoreAPI = {
  submit: (payload) => handleApi(api.post("/api/score/submit", payload)),
  getContract: (contractAddress) => handleApi(api.get(`/api/score/contract/${contractAddress}`)),
  getAverage: (contractAddress) => handleApi(api.get(`/api/score/average/${contractAddress}`)),
  getScorersCount: (contractAddress) => handleApi(api.get(`/api/score/scorers/${contractAddress}`)),
  getContributionPoints: (contractAddress) => handleApi(api.get(`/api/score/contribution/${contractAddress}`)),
  getUserScore: (contractAddress, userAddress) => handleApi(api.get(`/api/score/user/${contractAddress}/${userAddress}`)),
}

export default api












