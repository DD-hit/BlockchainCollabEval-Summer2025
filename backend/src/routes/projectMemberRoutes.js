import express from 'express';
import { addProjectMember, getProjectMemberList,deleteProjectMember,updateProjectMember } from '../controllers/projectMemberController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/addProjectMember', verifyToken, addProjectMember);
router.get('/getProjectMemberList/:projectId', verifyToken, getProjectMemberList);
router.delete('/deleteProjectMember/:projectId', verifyToken, deleteProjectMember);
router.put('/updateProjectMember/:projectId', verifyToken, updateProjectMember);

export default router;