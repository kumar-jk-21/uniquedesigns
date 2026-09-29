import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
};
if (!config.jwtSecret || config.jwtSecret.length < 16) {
  console.error('FATAL: JWT_SECRET must be set in .env (16+ characters).');
  process.exit(1);
}
export const prisma = new PrismaClient();
