import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';
import { seedDefaultAdmin } from './controllers/authController.js';
import { seedDefaultPlans } from './controllers/seedBillingData.js';
import { seedSuperAdmin } from './controllers/billingAuthController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { startBots } from './bots/index.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import billingRouter from './routes/billing.js';
import * as ordersController from './controllers/ordersController.js';
import * as productsController from './controllers/productsController.js';
import * as categoriesController from './controllers/categoriesController.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Web App uchun ochiq endpointlar
app.get('/api/webapp/products', productsController.getAllProducts);
app.get('/api/webapp/categories', categoriesController.getAllCategories);
app.get('/api/webapp/user/:telegramId', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const user = await User.findOne({ 
      where: { telegram_id: BigInt(req.params.telegramId) },
      attributes: ['id', 'full_name', 'phone']
    });
    if (!user) return res.status(404).json({ error: 'Mijoz topilmadi' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/webapp/user/phone/:phone', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const user = await User.findOne({ 
      where: { phone: req.params.phone, role: 'customer' },
      attributes: ['id', 'full_name', 'phone', 'telegram_id']
    });
    if (!user) return res.status(404).json({ error: 'Mijoz topilmadi' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/webapp/user/:id', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Mijoz topilmadi' });
    const { full_name, phone } = req.body;
    await user.update({ full_name, phone });
    res.json({ id: user.id, full_name: user.full_name, phone: user.phone });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Bu telefon raqam allaqachon mavjud' });
    }
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/webapp/orders', ordersController.createOrder);
app.get('/api/webapp/orders/:id', async (req, res) => {
  try {
    const { Order, OrderItem, Product } = await import('./models/index.js');
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }]
        }
      ]
    });
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/webapp/customer/:customerId/orders', async (req, res) => {
  try {
    const { Order, OrderItem, Product } = await import('./models/index.js');
    const orders = await Order.findAll({
      where: { customer_id: req.params.customerId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/orders', authMiddleware, ordersRouter);

// Database initialization
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database authentication muvaffaqiyatli.');
    
    // Sync database - alter: false production uchun xavfsizroq
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false }  // Production-da alter: false ishlatish tavsiya etiladi
      : { alter: true };
    
    await sequelize.sync(syncOptions);
    console.log('Database sync muvaffaqiyatli.');
    
    await seedSuperAdmin();
    await seedDefaultAdmin();
    await seedDefaultPlans();
    console.log('PostgreSQL ulandi, jadvallar yangilandi.');
  } catch (e) {
    console.error('DB xatosi:', e.message);
    console.error('DB xatosi details:', e);
    throw e;
  }
}

// Start server function
async function start() {
  try {
    await initializeDatabase();
    
    // Start bots only in non-serverless environment
    if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      startBots();
    }
    
    // Render va boshqa platformalar uchun PORT environment variable-ni ishlatish
    const serverPort = process.env.PORT || PORT;
    app.listen(serverPort, '0.0.0.0', () => {
      console.log(`API http://0.0.0.0:${serverPort}`);
      console.log(`Server ishga tushdi. Port: ${serverPort}`);
    });
  } catch (e) {
    console.error('Server xatosi:', e.message);
    console.error('Server xatosi details:', e);
    process.exit(1);
  }
}

// Start server only if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  start();
}

// Export app for Vercel serverless
export default app;
