import { Router } from 'express';
import * as ctrl from '../controllers/ordersController.js';

const router = Router();
router.get('/', ctrl.getAllOrders);
router.get('/:id', ctrl.getOrderById);
router.post('/', ctrl.createOrder);
router.put('/:id/status', ctrl.updateOrderStatus);
export default router;
