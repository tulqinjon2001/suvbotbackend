import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

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
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
  }
);

async function checkAndCreateAdmin() {
  try {
    console.log('🔌 Database-ga ulanyapman...');
    await sequelize.authenticate();
    console.log('✅ Database-ga ulandi\n');

    // Admin model-ni import qilish
    const { Admin } = await import('../src/models/index.js');

    // Barcha admin-larni ko'rish
    const admins = await Admin.findAll({
      attributes: ['id', 'username', 'created_at']
    });

    console.log(`📊 Database-da ${admins.length} ta admin mavjud:`);
    admins.forEach(admin => {
      console.log(`   - ID: ${admin.id}, Username: ${admin.username}, Yaratilgan: ${admin.created_at}`);
    });

    // Admin borligini tekshirish
    const adminExists = await Admin.findOne({ where: { username: 'admin' } });

    if (!adminExists) {
      console.log('\n⚠️  "admin" user mavjud emas!');
      console.log('🔄 Admin yaratilmoqda...');
      
      const SALT_ROUNDS = 10;
      const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await Admin.create({ username: 'admin', password: hash });
      
      console.log('✅ Admin yaratildi!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('\n✅ "admin" user mavjud!');
      
      // Parolni yangilash (admin123 ga)
      console.log('🔄 Parolni "admin123" ga yangilayapman...');
      const SALT_ROUNDS = 10;
      const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await adminExists.update({ password: hash });
      
      console.log('✅ Parol yangilandi!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }

    console.log('\n🎉 Tugadi! Endi login qilishingiz mumkin:');
    console.log('   POST http://localhost:5000/api/auth/login');
    console.log('   Body: { "username": "admin", "password": "admin123" }');
    
  } catch (err) {
    console.error('❌ Xatolik:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkAndCreateAdmin();
