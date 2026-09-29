import jwt from 'jsonwebtoken';
import { config, prisma } from '../config/index.js';
import { AppError, asyncH } from '../utils/errors.js';

export const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpires });

async function resolve(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  let payload;
  try {
    payload = jwt.verify(h.slice(7), config.jwtSecret);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please login again.');
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication. Please login again.');
  }
  if (payload.purpose) throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication. Please login again.');
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication. Please login again.');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account has been deactivated. Please contact support.');
  return user;
}

export const authenticate = asyncH(async (req, _res, next) => {
  const user = await resolve(req);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please login to continue.');
  req.user = user;
  next();
});

export const optionalAuth = asyncH(async (req, _res, next) => {
  try { req.user = await resolve(req); } catch { req.user = null; }
  next();
});

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
