// Vercel serverless function uchun
import app from '../src/server.js';

// Vercel serverless function handler
export default async (req, res) => {
  return app(req, res);
};
