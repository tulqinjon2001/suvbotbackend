// Vercel-da dotenv/config ishlamaydi, environment variable-lar to'g'ridan-to'g'ri beriladi
// Top-level await ishlatmaymiz, chunki bu muammo qilishi mumkin
if (process.env.VERCEL !== '1') {
  import('dotenv/config');
}

import express from 'express';
import cors from 'cors';
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

// Health check endpoint - database-ga ulanmaydi, shuning uchun birinchi bo'lib qo'yamiz
app.get('/api/health', (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Route-lar - ular database-ga ulanadi, shuning uchun keyinroq qo'yamiz
app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);

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
// Web App buyurtma yaratish - telefon raqam orqali mijozni topadi yoki yaratadi
app.post('/api/webapp/orders', async (req, res) => {
  try {
    const { phone, full_name, items, address, location_lat, location_long, payment_type, telegram_id } = req.body;
    
    // Telefon raqam talab qilinadi
    if (!phone) {
      return res.status(400).json({ error: 'Telefon raqam talab qilinadi' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Mahsulotlar (items) talab qilinadi' });
    }

    // Telefon raqam orqali mijozni topish yoki yaratish
    const { User } = await import('./models/index.js');
    const phoneNumber = String(phone).trim();
    let customer = await User.findOne({ 
      where: { phone: phoneNumber },
      attributes: ['id', 'full_name', 'phone', 'telegram_id']
    });

    // Agar mijoz topilmasa, yangi mijoz yaratish
    if (!customer) {
      // Agar telegram_id bo'lsa, uni ishlatamiz
      if (telegram_id) {
        try {
          // Telegram ID orqali ham tekshiramiz
          customer = await User.findOne({ 
            where: { telegram_id: BigInt(telegram_id) },
            attributes: ['id', 'full_name', 'phone', 'telegram_id']
          });
          
          if (customer) {
            // Telefon raqamni yangilash (agar boshqa mijozga tegishli bo'lmasa)
            const existingPhoneUser = await User.findOne({ 
              where: { phone: phoneNumber },
              attributes: ['id']
            });
            
            if (!existingPhoneUser || existingPhoneUser.id === customer.id) {
              customer.phone = phoneNumber;
              if (full_name) customer.full_name = full_name;
              await customer.save();
            } else {
              // Telefon raqam boshqa mijozga tegishli, faqat ismni yangilaymiz
              if (full_name) customer.full_name = full_name;
              await customer.save();
            }
          }
        } catch (err) {
          console.error('Telegram ID orqali mijoz topishda xatolik:', err);
        }
      }
      
      // Hali ham topilmasa, yangi mijoz yaratish
      if (!customer) {
        try {
          customer = await User.create({
            full_name: full_name || 'Mijoz',
            phone: phoneNumber,
            role: 'customer',
            telegram_id: telegram_id ? BigInt(telegram_id) : null
          });
        } catch (err) {
          // Unique constraint xatosi - telefon raqam allaqachon mavjud
          if (err.name === 'SequelizeUniqueConstraintError') {
            // Qayta urinib ko'ramiz - telefon raqam orqali topish
            customer = await User.findOne({ 
              where: { phone: phoneNumber },
              attributes: ['id', 'full_name', 'phone', 'telegram_id']
            });
            
            if (!customer) {
              return res.status(400).json({ 
                error: 'Telefon raqam bilan muammo yuz berdi. Iltimos, qayta urinib ko\'ring.' 
              });
            }
          } else {
            throw err;
          }
        }
      }
    } else {
      // Mijoz topildi, ma'lumotlarni yangilash (agar kerak bo'lsa)
      let updated = false;
      if (full_name && full_name !== customer.full_name) {
        customer.full_name = full_name;
        updated = true;
      }
      if (telegram_id && !customer.telegram_id) {
        customer.telegram_id = BigInt(telegram_id);
        updated = true;
      }
      if (updated) {
        await customer.save();
      }
    }

    // Endi buyurtma yaratish
    const { Product } = await import('./models/index.js');
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Mahsulot ${item.product_id} topilmadi` });
      }
      const price = Number(item.price_at_purchase || product.price);
      const quantity = Number(item.quantity) || 1;
      const subtotal = price * quantity;
      totalAmount += subtotal;
      orderItems.push({
        product_id: product.id,
        quantity,
        price_at_purchase: price,
      });
    }

    // To'lov turini asosida paid_amount ni belgilash
    const paidAmount = payment_type === 'rahmat' ? totalAmount : 0;

    const { Order, OrderItem } = await import('./models/index.js');
    const order = await Order.create({
      customer_id: customer.id,
      status: 'new',
      total_amount: totalAmount,
      paid_amount: paidAmount,
      address: address || null,
      location_lat: location_lat || null,
      location_long: location_long || null,
      payment_type: payment_type || 'cash',
    });

    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        ...item,
      });
    }

    const orderWithDetails = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'customer' },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }],
        },
      ],
    });

    // Bot notification
    try {
      const { notifyOperatorsNewOrder } = await import('./bots/index.js');
      await notifyOperatorsNewOrder(orderWithDetails);
    } catch (botError) {
      console.error('Bot notification xatosi:', botError.message);
    }

    res.status(201).json(orderWithDetails);
  } catch (err) {
    console.error('Webapp createOrder xatosi:', err);
    console.error('Webapp createOrder xatosi stack:', err.stack);
    
    // Unique constraint xatosi (telefon raqam allaqachon mavjud)
    if (err.name === 'SequelizeUniqueConstraintError') {
      // Qayta urinib ko'ramiz - telefon raqam orqali topish
      try {
        const { User } = await import('./models/index.js');
        const customer = await User.findOne({ 
          where: { phone: String(req.body.phone).trim() }
        });
        
        if (customer) {
          // Mijoz topildi, buyurtmani qayta yaratishga urinamiz
          // Lekin bu recursive bo'lishi mumkin, shuning uchun faqat xatolik qaytaramiz
          return res.status(400).json({ 
            error: 'Bu telefon raqam allaqachon boshqa mijozga tegishli. Iltimos, boshqa telefon raqam ishlating yoki mijoz ID-ni ko\'rsating.' 
          });
        }
      } catch (retryErr) {
        // Ignore
      }
    }
    
    res.status(500).json({ 
      error: err.message || 'Buyurtma yaratishda xatolik yuz berdi',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
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
    // Lazy import - Vercel-da faqat kerak bo'lganda import qilamiz
    const { sequelize } = await import('./models/index.js');
    const { seedDefaultAdmin } = await import('./controllers/authController.js');
    const { seedDefaultPlans } = await import('./controllers/seedBillingData.js');
    const { seedSuperAdmin } = await import('./controllers/billingAuthController.js');
    
    await sequelize.authenticate();
    console.log('Database authentication muvaffaqiyatli.');
    
    // Vercel-da sync qilmaymiz (serverless muhitda)
    if (process.env.VERCEL !== '1') {
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
    } else {
      console.log('Vercel serverless muhitida - database sync o\'tkazilmaydi.');
    }
  } catch (e) {
    console.error('DB xatosi:', e.message);
    console.error('DB xatosi details:', e);
    // Vercel-da throw qilmaymiz, chunki bu function crash qiladi
    if (process.env.VERCEL !== '1') {
      throw e;
    }
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
// Vercel-da serverless function sifatida ishlaydi, shuning uchun app.listen() chaqirilmaydi
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  start();
}
// Vercel-da database initialization lazy bo'ladi - faqat request kelganda ishlaydi

// Export app for Vercel serverless
export default app;
