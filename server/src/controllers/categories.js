import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';
import { slugify, throwIfFields } from '../utils/validators.js';

const isAdmin = (u) => u && u.role !== 'USER';
const checkName = (name) => {
  const n = String(name || '').trim();
  throwIfFields(n.length < 2 || n.length > 60 ? { name: 'Category name must be 2-60 characters.' } : {});
  return n;
};

export const list = asyncH(async (req, res) => {
  const all = isAdmin(req.user) && req.query.includeInactive === 'true';
  const categories = await prisma.category.findMany({
    where: all ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });
  ok(res, { categories });
});

export const create = asyncH(async (req, res) => {
  const name = checkName(req.body.name);
  const dup = await prisma.category.findFirst({ where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug: slugify(name) }] } });
  if (dup) throw new AppError(409, 'DUPLICATE', 'A category with this name already exists.', { name: 'Category already exists.' });
  ok(res, { category: await prisma.category.create({ data: { name, slug: slugify(name) } }) }, 201);
});

export const update = asyncH(async (req, res) => {
  const data = {};
  if (req.body.name !== undefined) {
    data.name = checkName(req.body.name);
    data.slug = slugify(data.name);
    const dup = await prisma.category.findFirst({ where: { id: { not: req.params.id }, OR: [{ name: { equals: data.name, mode: 'insensitive' } }, { slug: data.slug }] } });
    if (dup) throw new AppError(409, 'DUPLICATE', 'A category with this name already exists.', { name: 'Category already exists.' });
  }
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive === true || req.body.isActive === 'true';
  ok(res, { category: await prisma.category.update({ where: { id: req.params.id }, data }) });
});

export const remove = asyncH(async (req, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0)
    throw new AppError(409, 'CATEGORY_IN_USE', `This category has ${count} product(s). Move or delete them first, or deactivate the category instead.`);
  await prisma.category.delete({ where: { id: req.params.id } });
  ok(res, { message: 'Category deleted.' });
});
