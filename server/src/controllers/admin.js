import bcrypt from 'bcrypt';
import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';
import { throwIfFields, validateProfileFields, passwordProblem } from '../utils/validators.js';
import { publicUser } from './auth.js';

export const dashboard = asyncH(async (_req, res) => {
  const [users, products, categories, admins, activeProducts, lowStock, wishlistItems, byCategory, recentUsers, lowList] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.wishlistItem.count(),
    prisma.category.findMany({ select: { name: true, _count: { select: { products: true } } } }),
    prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, fullName: true, email: true, createdAt: true } }),
    prisma.product.findMany({ where: { stock: { lte: 5 } }, orderBy: { stock: 'asc' }, take: 5, select: { id: true, name: true, stock: true } })
  ]);
  ok(res, {
    stats: { users, products, categories, admins, activeProducts, inactiveProducts: products - activeProducts, lowStock, wishlistItems },
    productsByCategory: byCategory.map((c) => ({ name: c.name, count: c._count.products })),
    recentUsers, lowStockProducts: lowList
  });
});

const page = (q) => ({ page: Math.max(1, parseInt(q.page) || 1), limit: Math.min(50, Math.max(1, parseInt(q.limit) || 10)) });
async function listByRole(req, res, roles) {
  const { page: pg, limit } = page(req.query);
  const where = { role: { in: roles }, ...(req.query.q ? { OR: [{ fullName: { contains: String(req.query.q), mode: 'insensitive' } }, { email: { contains: String(req.query.q), mode: 'insensitive' } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.user.count({ where }), prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pg - 1) * limit, take: limit })]);
  ok(res, { users: rows.map(publicUser) }, 200, { page: pg, limit, total, totalPages: Math.ceil(total / limit) || 1 });
}
export const users = asyncH((req, res) => listByRole(req, res, ['USER']));
export const admins = asyncH((req, res) => listByRole(req, res, ['ADMIN', 'SUPER_ADMIN']));

export const createAdmin = asyncH(async (req, res) => {
  const { fields, values } = validateProfileFields(req.body);
  const pw = passwordProblem(req.body.password);
  if (pw) fields.password = pw;
  throwIfFields(fields);
  const admin = await prisma.user.create({
    data: { ...values, dateOfBirth: new Date(values.dateOfBirth), passwordHash: await bcrypt.hash(req.body.password, 12), role: 'ADMIN' }
  });
  ok(res, { user: publicUser(admin) }, 201);
});

const setStatus = (roles) => asyncH(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || !roles.includes(target.role)) throw new AppError(404, 'NOT_FOUND', 'Account not found.');
  if (target.id === req.user.id) throw new AppError(409, 'CONFLICT', 'You cannot change your own status.');
  if (target.role === 'SUPER_ADMIN') throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
  const isActive = req.body.isActive === true || req.body.isActive === 'true';
  ok(res, { user: publicUser(await prisma.user.update({ where: { id: target.id }, data: { isActive } })) });
});
export const userStatus = setStatus(['USER']);
export const adminStatus = setStatus(['ADMIN', 'SUPER_ADMIN']);
