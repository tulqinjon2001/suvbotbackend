import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'suv-bot-jwt-secret-change-in-production';
const SALT_ROUNDS = 10;

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol kiritilishi shart' });
    }
    const admin = await Admin.findOne({ where: { username: String(username).trim() } });
    if (!admin) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const match = await bcrypt.compare(String(password), admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function seedDefaultAdmin() {
  const count = await Admin.count();
  if (count > 0) return;
  const hash = await bcrypt.hash('suvbot', SALT_ROUNDS);
  await Admin.create({ username: 'admin', password: hash });
  console.log('Default admin yaratildi: login=admin, parol=suvbot');
}
