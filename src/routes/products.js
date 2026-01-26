import { Router } from 'express';
import * as ctrl from '../controllers/productsController.js';

const router = Router();
router.get('/', ctrl.getAllProducts);
router.get('/:id', ctrl.getProductById);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);
export default router;
