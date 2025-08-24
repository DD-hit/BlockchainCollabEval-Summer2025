import axios from 'axios'

// API基础URL - 开发环境用本地后端，生产环境用当前域名
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000')



// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true, // 允许发送cookies
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
    // 只在特定情况下自动跳转到登录页面
    // 排除GitHub相关的API调用，让具体的组件来处理这些错误
    const url = error && error.config && error.config.url ? error.config.url : ''
    if (error && error.response && error.response.status === 401 &&
        !url.includes('/api/auth/url') &&
        !url.includes('/api/auth/status') &&
        !url.includes('/api/github/') &&
        !url.includes('/github/')) {
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
  logout: (username) => handleApi(api.post("/api/accounts/logout", { username })),
  getGithubBinding: () => handleApi(api.get("/api/accounts/github/binding")),
  unbindGithub: () => handleApi(api.post("/api/accounts/github/unbind")),
}

// 项目管理API
export const projectAPI = {
  list: (params = {}) => handleApi(api.get("/api/projectManager/getProjectList", { params })),
  create: (payload) => handleApi(api.post("/api/projectManager/createProject", payload)),
  detail: (projectId) => handleApi(api.get(`/api/projectManager/getProjectDetail/${projectId}`)), 
  update: (projectId, payload) => handleApi(api.put(`/api/projectManager/updateProject/${projectId}`, payload)),
  updateStatus: (projectId, status) => handleApi(api.put(`/api/projectManager/updateProjectStatus/${projectId}`, { status })),
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
  deleteAllNotifications: () => handleApi(api.delete("/api/notifications/deleteAllNotifications")),
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

// GitHub API - 使用专门的错误处理，避免触发自动登出
const githubApiCall = async (apiCall) => {
  try {
    const response = await apiCall
    return response
  } catch (error) {
    // GitHub API错误不触发自动登出，直接抛出错误让组件处理
    throw error
  }
}

export const githubAPI = {
  getAuthUrl: () => api.get("/api/auth/url"),
  getUserInfo: () => githubApiCall(api.get("/api/github/user")),
  getUserRepos: (page = 1, per_page = 30) =>
    githubApiCall(api.get(`/api/github/repos?page=${page}&per_page=${per_page}`)),
  getRepoInfo: (owner, repo) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}`)),
  getRepoStats: (owner, repo) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/stats`)),
  getRepoMilestones: (owner, repo, state = 'all') =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/milestones?state=${state}`)),
  getRepoIssues: (owner, repo, state = 'all', page = 1) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/issues?state=${state}&page=${page}`)),
  getRepoContributors: (owner, repo) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/contributors`)),
  getRepoCommits: (owner, repo, page = 1) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/commits?page=${page}`)),
  getRepoPullRequests: (owner, repo, state = 'all', page = 1) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/pulls?state=${state}&page=${page}`)),
  getContributionScore: (owner, repo, username) =>
    githubApiCall(api.get(`/api/github/repos/${owner}/${repo}/contribution/${username}`)),
}

// GitHub 贡献度（新合约）API
export const githubContribAPI = {
  start: (payload) => handleApi(api.post('/api/github-contrib/start', payload)),
  // vote 时仅传 password，后端解密当前用户私钥；可选 address 覆盖
  vote: (contractAddress, payload) => handleApi(api.post(`/api/github-contrib/${contractAddress}/vote`, payload)),
  finalize: (contractAddress, payload) => handleApi(api.post(`/api/github-contrib/${contractAddress}/finalize`, payload)),
  progress: (contractAddress) => handleApi(api.get(`/api/github-contrib/${contractAddress}/progress`)),
  leaderboardByRepo: (repoId) => handleApi(api.get(`/api/github-contrib/leaderboard/by-repo`, { params: { repoId } })),
  userRounds: (repoId, username, address) => handleApi(api.get(`/api/github-contrib/user-rounds`, { params: { repoId, username, address } })),
}

export default api












