// routes/accountRoutes.js - 项目的"交通指挥员"
import express from 'express';
import { createAccount, getBalance } from '../controllers/accountController.js';

const router = express.Router();

// 定义具体的路径和对应的处理函数
router.post('/createAccount', createAccount);    // POST /api/accounts/create
router.get('/getBalance/:address', getBalance);           // GET /api/accounts/123
export default router;
