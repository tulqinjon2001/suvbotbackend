import express from 'express';
import * as billingAuthController from '../controllers/billingAuthController.js';
import * as plansController from '../controllers/plansController.js';
import * as accountsController from '../controllers/accountsController.js';
import * as subscriptionsController from '../controllers/subscriptionsController.js';
import * as invoicesController from '../controllers/invoicesController.js';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware.js';

const router = express.Router();

// Auth (ochiq)
router.post('/auth/login', billingAuthController.login);

// Protected routes (faqat super admin)
router.use(superAdminMiddleware);

router.get('/stats', billingAuthController.getStats);
router.post('/accounts', billingAuthController.createAccount);
router.get('/accounts', accountsController.getAllAccounts);
router.get('/accounts/:id', accountsController.getAccountById);
router.put('/accounts/:id', accountsController.updateAccount);

router.get('/plans', plansController.getAllPlans);
router.post('/plans', plansController.createPlan);
router.put('/plans/:id', plansController.updatePlan);
router.delete('/plans/:id', plansController.deletePlan);

router.get('/subscriptions', subscriptionsController.getAllSubscriptions);
router.post('/subscriptions', subscriptionsController.createSubscription);
router.put('/subscriptions/:id/cancel', subscriptionsController.cancelSubscription);

router.get('/invoices', invoicesController.getAllInvoices);
router.get('/invoices/:id', invoicesController.getInvoiceById);
router.put('/invoices/:id/pay', invoicesController.markInvoiceAsPaid);

export default router;
