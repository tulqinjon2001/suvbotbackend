import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'suv-bot-jwt-secret-change-in-production';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token talab qilinadi' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati tugagan' });
  }
}
