import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vercel-da .env fayl yo'q, environment variable-lar to'g'ridan-to'g'ri beriladi
// Faqat local development uchun .env fayl o'qiladi
if (process.env.VERCEL !== '1') {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const password = process.env.DB_PASSWORD;
if (!password || password === 'undefined') {
  const errorMsg = 'DB_PASSWORD environment variable ko\'rsatilmagan yoki noto\'g\'ri.';
  console.error(errorMsg);
  console.error('DB_PASSWORD mavjud:', !!process.env.DB_PASSWORD);
  console.error('DB_PASSWORD qiymati:', process.env.DB_PASSWORD ? '***' : 'undefined');
  
  // Vercel-da process.exit() ishlamaydi, shuning uchun faqat error log qilamiz
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
  // Vercel-da throw qilmaymiz, chunki bu crash qiladi
  // Faqat error log qilamiz va connection-ni yaratmaymiz
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'suv_bot',
  process.env.DB_USER || 'postgres',
  password ? String(password) : '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    // Vercel serverless uchun pool sozlamalari
    pool: process.env.VERCEL === '1' ? {
      max: 1,
      min: 0,
      idle: 0,
      acquire: 3000,
      evict: 1000
    } : {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Vercel-da connection retry
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    }
  }
);

export default sequelize;
