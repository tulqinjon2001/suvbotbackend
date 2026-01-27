import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'neondb',
  process.env.DB_USER || 'neondb_owner',
  String(process.env.DB_PASSWORD || ''),
  {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
  }
);

async function fixSequences() {
  try {
    console.log('🔌 Database-ga ulanyapman...');
    await sequelize.authenticate();
    console.log('✅ Database-ga ulandi');

    console.log('\n🔧 Sequence-larni to\'g\'rilayapman...');

    // Barcha jadvallar uchun sequence-larni to'g'rilash
    const tables = [
      'users',
      'categories',
      'products',
      'orders',
      'order_items',
      'admins',
      'accounts',
      'plans',
      'subscriptions',
      'invoices',
      'usage_tracking',
      'super_admins'
    ];

    for (const table of tables) {
      try {
        // Jadvadagi eng katta ID ni topish
        const [result] = await sequelize.query(
          `SELECT COALESCE(MAX(id), 0) as max_id FROM ${table}`
        );
        const maxId = result[0]?.max_id || 0;
        
        // Sequence-ni yangilash
        const sequenceName = `${table}_id_seq`;
        await sequelize.query(
          `SELECT setval('${sequenceName}', ${maxId}, true)`
        );
        
        console.log(`   ✅ ${table}: sequence ${sequenceName} -> ${maxId + 1}`);
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n🎉 Barcha sequence-lar to\'g\'rilandi!');
    
  } catch (err) {
    console.error('❌ Xatolik:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixSequences();
