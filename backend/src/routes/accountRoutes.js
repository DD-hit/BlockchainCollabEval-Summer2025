// routes/accountRoutes.js - 项目的"交通指挥员"
import express from 'express';
import { loginAccount, createAccount, getBalance } from '../controllers/accountController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

// 定义具体的路径和对应的处理函数
router.post('/login', loginAccount);    // POST /api/accounts/login
router.post('/createAccount', createAccount);    // POST /api/accounts/createAccount
router.get('/getBalance', verifyToken, getBalance);           // GET /api/accounts/getBalance (需要token)

export default router;
