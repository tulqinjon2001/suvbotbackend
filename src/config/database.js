import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const password = process.env.DB_PASSWORD;
if (password === undefined || password === null) {
  console.error('DB_PASSWORD .env da ko‘rsatilmagan. backend/env.example dan nusxa olib .env yarating va parolni kiriting.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'suv_bot',
  process.env.DB_USER || 'postgres',
  String(password),
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
  }
);

export default sequelize;
