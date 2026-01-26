import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SuperAdmin, Account, Admin, Subscription, Plan, Invoice } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'suv-bot-jwt-secret-change-in-production';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ where: { username } });
    if (!superAdmin) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const isValid = await bcrypt.compare(password, superAdmin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign({ id: superAdmin.id, username: superAdmin.username, role: 'super_admin' }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, username: superAdmin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { business_name, admin_username, admin_password } = req.body;

    // Admin yaratish
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const admin = await Admin.create({
      username: admin_username,
      password: hashedPassword,
    });

    // Account yaratish (30 kunlik trial)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const account = await Account.create({
      business_name,
      admin_id: admin.id,
      status: 'trial',
      trial_ends_at: trialEndsAt,
    });

    res.status(201).json({
      account,
      credentials: {
        username: admin_username,
        password: admin_password, // Faqat yaratilganda ko'rsatamiz
      }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Bu username allaqachon mavjud' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalAccounts = await Account.count();
    const activeAccounts = await Account.count({ where: { status: 'active' } });
    const trialAccounts = await Account.count({ where: { status: 'trial' } });
    
    const paidInvoices = await Invoice.findAll({ where: { status: 'paid' } });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    
    const pendingInvoices = await Invoice.count({ where: { status: 'pending' } });

    res.json({
      totalAccounts,
      activeAccounts,
      trialAccounts,
      totalRevenue,
      pendingInvoices,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export async function seedSuperAdmin() {
  try {
    const count = await SuperAdmin.count();
    if (count > 0) {
      console.log('Super Admin allaqachon mavjud.');
      return;
    }

    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    await SuperAdmin.create({
      username: 'superadmin',
      password: hashedPassword,
    });

    console.log('Default Super Admin yaratildi (superadmin / superadmin123)');
  } catch (err) {
    console.error('Super Admin yaratishda xatolik:', err);
  }
}
