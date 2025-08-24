// routes/accountRoutes.js - 项目的"交通指挥员"
import express from 'express';
import { loginAccount, createAccount, getBalance, updateProfile, logout, getPrivateKey, getGithubBinding, unbindGithub } from '../controllers/accountController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

// 定义具体的路径和对应的处理函数
router.post('/login', loginAccount);    // POST /api/accounts/login
router.post('/createAccount', createAccount);    // POST /api/accounts/createAccount
router.get('/getBalance', verifyToken, getBalance);           // GET /api/accounts/getBalance (需要token)
router.put('/updateProfile', verifyToken, updateProfile);     // PUT /api/accounts/updateProfile (需要token)
router.post('/logout', logout);     // POST /api/accounts/logout (支持带token和不带token两种方式)
router.post('/getPrivateKey', verifyToken, getPrivateKey); // 新增获取私钥接口
router.get('/github/binding', verifyToken, getGithubBinding); // 查询GitHub绑定信息
router.post('/github/unbind', verifyToken, unbindGithub); // 解绑GitHub

export default router;
