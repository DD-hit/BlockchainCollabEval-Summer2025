import express from 'express';
import { 
    createProject, 
    getProjectList, 
    getProjectDetail, 
    updateProject, 
    deleteProject,
    getMyProjectList 
} from '../controllers/projectManagerController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// 添加RESTful风格的路由
router.post('/', verifyToken, createProject);  // POST /api/projects
router.get('/', verifyToken, getProjectList);  // GET /api/projects
router.get('/my-projects', verifyToken, getMyProjectList);  // GET /api/projects/my-projects
router.get('/:projectId', verifyToken, getProjectDetail);  // GET /api/projects/:projectId
router.put('/:projectId', verifyToken, updateProject);  // PUT /api/projects/:projectId
router.delete('/:projectId', verifyToken, deleteProject);  // DELETE /api/projects/:projectId

// 保持原有路由兼容性
router.post('/createProject', verifyToken, createProject);
router.get('/getProjectList', verifyToken, getProjectList);
router.get('/getMyProjects', verifyToken, getMyProjectList);
router.get('/getProjectDetail/:projectId', verifyToken, getProjectDetail);
router.put('/updateProject/:projectId', verifyToken, updateProject);
router.delete('/deleteProject/:projectId', verifyToken, deleteProject);

// 添加获取我的项目列表路由
router.get('/my-projects', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;
        const [projects] = await pool.execute(
            `SELECT p.*, pm.role 
             FROM projects p 
             LEFT JOIN project_members pm ON p.projectId = pm.projectId 
             WHERE p.projectOwner = ? OR pm.username = ?
             ORDER BY p.createTime DESC`,
            [username, username]
        );
        
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('获取我的项目列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取项目列表失败'
        });
    }
});

export default router;
