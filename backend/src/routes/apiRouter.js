import express from 'express';
import accountRoutes from './accountRoutes.js';
import projectManagerRoutes from './projectManagerRoutes.js';
import projectMemberRoutes from './projectMemberRoutes.js';
import milestoneRoutes from './milestoneRoutes.js';
import subtaskRoutes from './subtaskRoutes.js';
import filesRoutes from './filesRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import scoreRoutes from './scoreRoutes.js';
import commentRoutes from './commentRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import githubRoutes from './githubRoutes.js';
import githubContribRoutes from './githubContribRoutes.js';
import contribRoutes from './contribRoutes.js';

const router = express.Router();

router.use('/accounts', accountRoutes); 
router.use('/projects', projectManagerRoutes);
router.use('/projectManager', projectManagerRoutes);
router.use('/projectMembers', projectMemberRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/subtasks', subtaskRoutes);
router.use('/files', filesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/score', scoreRoutes);
router.use('/comments', commentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/github', githubRoutes);
router.use('/contrib', contribRoutes);
router.use('/github-contrib', githubContribRoutes);

export default router;
