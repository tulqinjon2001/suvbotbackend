import { Router } from 'express';
import * as ctrl from '../controllers/usersController.js';

const router = Router();
router.get('/', ctrl.getAllUsers);
router.get('/:id', ctrl.getUserById);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);
export default router;
