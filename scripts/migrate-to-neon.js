import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env faylini Backend papkasidan o'qish
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
console.log(`📁 .env fayl manzili: ${envPath}`);

// Local database connection (eski)
const localSequelize = new Sequelize(
  'suv_bot',
  'postgres',
  'tulqin',
  {
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres',
    logging: false,
  }
);

// Neon database connection (yangi)
const neonPassword = String(process.env.DB_PASSWORD || '');
if (!neonPassword) {
  console.error('❌ DB_PASSWORD .env faylida topilmadi!');
  process.exit(1);
}

const neonSequelize = new Sequelize(
  process.env.DB_NAME || 'neondb',
  process.env.DB_USER || 'neondb_owner',
  neonPassword,
  {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function migrateTable(tableName, model) {
  try {
    console.log(`\n📦 ${tableName} jadvalini ko'chiryapman...`);
    
    // Local dan ma'lumotlarni olish
    const localData = await localSequelize.query(
      `SELECT * FROM ${tableName}`,
      { type: localSequelize.QueryTypes.SELECT }
    );

    if (localData.length === 0) {
      console.log(`   ⚠️  ${tableName} jadvalida ma'lumot yo'q, o'tkazildi.`);
      return;
    }

    console.log(`   📊 ${localData.length} ta yozuv topildi`);

    // Neon ga yozish
    if (localData.length > 0) {
      // Bulk insert qilish
      await model.bulkCreate(localData, {
        ignoreDuplicates: true,
        validate: false,
      });
      console.log(`   ✅ ${tableName} muvaffaqiyatli ko'chirildi!`);
    }
  } catch (err) {
    console.error(`   ❌ ${tableName} ko'chirishda xatolik:`, err.message);
  }
}

async function migrate() {
  try {
    console.log('🔌 Local database-ga ulanyapman...');
    await localSequelize.authenticate();
    console.log('✅ Local database-ga ulandi');

    console.log('🔌 Neon database-ga ulanyapman...');
    await neonSequelize.authenticate();
    console.log('✅ Neon database-ga ulandi');

    // Jadval strukturalarini yaratish
    console.log('\n📋 Jadval strukturalarini yaratyapman...');
    await neonSequelize.sync({ alter: true });
    console.log('✅ Jadval strukturalari yaratildi');

    // Modellarni import qilish
    const { 
      Category, Product, User, Order, OrderItem, Admin, 
      Account, Plan, Subscription, Invoice, UsageTracking, SuperAdmin 
    } = await import('../src/models/index.js');

    // Ma'lumotlarni ko'chirish
    console.log('\n🚀 Ma\'lumotlarni ko\'chiryapman...');

    // Asosiy jadvallar
    await migrateTable('categories', Category);
    await migrateTable('users', User);
    await migrateTable('admins', Admin);
    await migrateTable('products', Product);
    await migrateTable('orders', Order);
    await migrateTable('order_items', OrderItem);

    // Billing jadvallar (agar mavjud bo'lsa)
    await migrateTable('plans', Plan);
    await migrateTable('accounts', Account);
    await migrateTable('subscriptions', Subscription);
    await migrateTable('invoices', Invoice);
    await migrateTable('usage_tracking', UsageTracking);
    await migrateTable('super_admins', SuperAdmin);

    console.log('\n🎉 Barcha ma\'lumotlar muvaffaqiyatli ko\'chirildi!');
    
  } catch (err) {
    console.error('❌ Xatolik:', err);
  } finally {
    await localSequelize.close();
    await neonSequelize.close();
    process.exit(0);
  }
}

migrate();
