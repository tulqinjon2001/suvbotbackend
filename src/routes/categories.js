import { Router } from 'express';
import * as ctrl from '../controllers/categoriesController.js';

const router = Router();
router.get('/', ctrl.getAllCategories);
router.get('/:id', ctrl.getCategoryById);
router.post('/', ctrl.createCategory);
router.put('/:id', ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);
export default router;
