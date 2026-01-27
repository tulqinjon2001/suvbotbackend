// Vercel serverless function uchun
// Express app-ni lazy import qilamiz - faqat kerak bo'lganda
let appInstance = null;

async function getApp() {
  if (!appInstance) {
    try {
      const appModule = await import('../src/server.js');
      appInstance = appModule.default;
    } catch (error) {
      console.error('App import xatosi:', error);
      throw error;
    }
  }
  return appInstance;
}

// Database connection-ni lazy initialize qilish
let dbInitialized = false;

async function ensureDatabaseConnection() {
  if (dbInitialized) return true;
  
  try {
    const { sequelize } = await import('../src/models/index.js');
    await sequelize.authenticate();
    console.log('Vercel: Database connection muvaffaqiyatli.');
    dbInitialized = true;
    return true;
  } catch (error) {
    console.error('Vercel: Database connection xatosi:', error.message);
    console.error('Vercel: Database connection stack:', error.stack);
    // Connection muammosi bo'lsa ham app ishlaydi (lazy retry)
    return false;
  }
}

// Vercel serverless function handler
export default async (req, res) => {
  try {
    // Environment variable-larni tekshirish (debug uchun)
    if (req.url === '/api/health' && req.query.debug === 'env') {
      return res.json({
        ok: true,
        env: {
          VERCEL: process.env.VERCEL,
          DB_HOST: process.env.DB_HOST ? '***' : 'undefined',
          DB_NAME: process.env.DB_NAME,
          DB_USER: process.env.DB_USER,
          DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'undefined',
          DB_SSL: process.env.DB_SSL,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }
    
    // Express app-ni olish (bu top-level import-larni ishga tushiradi)
    const app = await getApp();
    
    // Database connection-ni tekshirish (lazy, non-blocking)
    // Health check uchun database kerak emas
    if (req.url !== '/api/health') {
      ensureDatabaseConnection().catch(err => {
        console.error('Background DB connection xatosi:', err.message);
      });
    }
    
    // Express app-ni ishga tushirish
    return app(req, res);
  } catch (error) {
    console.error('Vercel function xatosi:', error);
    console.error('Vercel function xatosi message:', error.message);
    console.error('Vercel function stack:', error.stack);
    console.error('Vercel function name:', error.name);
    console.error('Environment check:', {
      VERCEL: process.env.VERCEL,
      DB_PASSWORD: process.env.DB_PASSWORD ? 'exists' : 'missing',
      DB_HOST: process.env.DB_HOST ? 'exists' : 'missing'
    });
    
    if (!res.headersSent) {
      // Vercel-da har doim batafsil xatolik ko'rsatamiz (debug uchun)
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'Server xatosi',
        name: error.name,
        stack: error.stack,
        url: req.url,
        method: req.method,
        envCheck: {
          VERCEL: process.env.VERCEL,
          DB_PASSWORD: process.env.DB_PASSWORD ? 'exists' : 'missing',
          DB_HOST: process.env.DB_HOST ? 'exists' : 'missing'
        }
      });
    }
  }
};
