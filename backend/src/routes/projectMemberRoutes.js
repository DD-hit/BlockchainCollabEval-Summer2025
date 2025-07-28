import express from 'express';
import { addProjectMember, getProjectMemberList,deleteProjectMember,updateProjectMember } from '../controllers/projectMemberController.js';
const router = express.Router();

router.post('/addProjectMember', addProjectMember);
router.get('/getProjectMemberList/:projectId', getProjectMemberList);
router.delete('/deleteProjectMember/:projectId', deleteProjectMember);
router.put('/updateProjectMember/:projectId', updateProjectMember);

export default router;