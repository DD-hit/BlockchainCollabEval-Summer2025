# GitHub 仓库集成功能

## 功能概述

本项目已成功集成了GitHub仓库加载功能，用户可以在项目管理页面查看自己的所有GitHub仓库。

## 功能特性

### 1. GitHub仓库列表
- 显示用户的所有GitHub仓库
- 支持分页加载（每页30个仓库）
- 显示仓库详细信息：
  - 仓库名称和描述
  - 编程语言（带颜色标识）
  - 公开/私有状态
  - Star、Fork、Watch数量
  - 最后更新时间
  - 许可证信息

### 2. 仓库选择功能
- 点击仓库卡片可以选择仓库
- 选择后可以跳转到项目创建页面
- 支持将GitHub仓库关联到新项目

### 3. 响应式设计
- 支持桌面和移动设备
- 自适应网格布局
- 美观的卡片式设计

## 技术实现

### 后端实现

#### 1. GitHub控制器 (`backend/src/controllers/githubController.js`)
```javascript
// 获取用户仓库列表
async getUserRepos(req, res) {
    try {
        // 从JWT token中获取用户名
        const username = req.user?.username;
        
        // 从数据库获取GitHub token
        const githubToken = await getUserGitHubToken(username);
        
        // 调用GitHub API获取仓库列表
        GitHubService.initialize(githubToken);
        const result = await GitHubService.getUserRepos(page, per_page);
        
        res.json({ success: true, repos: result.repos });
    } catch (error) {
        res.status(500).json({ error: '获取仓库列表失败' });
    }
}
```

#### 2. GitHub服务 (`backend/src/services/githubService.js`)
```javascript
// 获取用户仓库列表
async getUserRepos(page = 1, per_page = 30) {
    try {
        const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
            per_page: parseInt(per_page),
            page: parseInt(page),
            sort: 'updated',
            direction: 'desc'
        });
        return { success: true, repos };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

### 前端实现

#### 1. GitHub仓库组件 (`frontend/src/components/Project/GitHubRepos.js`)
- 使用React Hooks管理状态
- 支持分页加载
- 错误处理和重试机制
- 美观的UI设计

#### 2. 项目管理页面集成 (`frontend/src/components/Project/ProjectList.js`)
- 添加标签页导航
- 集成GitHub仓库组件
- 支持仓库选择功能

#### 3. API调用 (`frontend/src/utils/api.js`)
```javascript
// GitHub API
export const githubAPI = {
    getUserRepos: (page = 1, per_page = 30) =>
        api.get(`/api/github/repos?page=${page}&per_page=${per_page}`),
    // ... 其他GitHub API
}
```

## 使用方法

### 1. 连接GitHub账户
1. 登录系统
2. 在个人中心连接GitHub账户
3. 授权访问GitHub仓库

### 2. 查看GitHub仓库
1. 进入项目管理页面
2. 点击"📚 GitHub 仓库"标签页
3. 系统会自动加载您的所有GitHub仓库

### 3. 选择仓库创建项目
1. 在GitHub仓库列表中点击任意仓库
2. 系统会跳转到项目创建页面
3. 仓库信息会自动填充到项目创建表单中

## 样式设计

### 仓库卡片样式
- 现代化的卡片设计
- 悬停效果和动画
- 编程语言颜色标识
- 响应式布局

### 标签页导航
- 清晰的标签页切换
- 活跃状态指示
- 平滑的过渡动画

## 错误处理

### 常见错误及解决方案

1. **"未连接GitHub，请先连接GitHub账户"**
   - 解决方案：在个人中心连接GitHub账户

2. **"加载仓库失败，请检查GitHub连接"**
   - 解决方案：检查网络连接，重新授权GitHub

3. **"获取仓库列表失败"**
   - 解决方案：刷新页面重试

## 依赖项

### 后端依赖
- `octokit`: GitHub API客户端
- `express`: Web框架
- `jsonwebtoken`: JWT认证

### 前端依赖
- `react`: UI框架
- `axios`: HTTP客户端
- `react-router-dom`: 路由管理

## 配置说明

### GitHub OAuth配置
在 `backend/server.js` 中配置GitHub OAuth应用信息：
```javascript
const clientId = 'your_github_client_id'
const clientSecret = 'your_github_client_secret'
```

### API路由配置
确保在 `backend/server.js` 中注册GitHub路由：
```javascript
app.use('/api/github', githubRoutes);
```

## 扩展功能

### 未来可能的扩展
1. 仓库搜索和筛选功能
2. 仓库统计信息显示
3. 自动同步GitHub Issues
4. 代码贡献分析
5. 仓库分支管理

## 注意事项

1. 确保用户已正确连接GitHub账户
2. GitHub API有速率限制，注意合理使用
3. 私有仓库需要相应的权限
4. 建议在生产环境中使用HTTPS

## 故障排除

### 调试步骤
1. 检查浏览器控制台错误信息
2. 检查后端服务器日志
3. 验证GitHub token是否有效
4. 确认API路由配置正确

### 常见问题
1. **仓库不显示**: 检查GitHub连接状态
2. **加载缓慢**: 可能是网络问题或GitHub API限制
3. **权限错误**: 确认GitHub授权范围包含仓库访问权限
