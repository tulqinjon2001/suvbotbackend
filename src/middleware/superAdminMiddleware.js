import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'suv-bot-jwt-secret-change-in-production';

export function superAdminMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token talab qilinadi' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin huquqi talab qilinadi' });
    }
    req.superAdmin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati tugagan' });
  }
}
