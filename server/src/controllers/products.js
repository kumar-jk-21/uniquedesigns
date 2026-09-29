import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';
import { computePricing, throwIfFields } from '../utils/validators.js';
import { removeFiles, urlFor, verifyImages } from '../middleware/upload.js';

const include = { images: { orderBy: { position: 'asc' } }, category: { select: { id: true, name: true, slug: true } } };
const isAdmin = (u) => u && u.role !== 'USER';
const AUDIENCES = ['WOMEN', 'GIRLS', 'CHILD_GIRLS'];
const list_ = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);
const bool = (v) => v === true || v === 'true' || v === 'on';

export const list = asyncH(async (req, res) => {
  const q = req.query;
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(q.limit) || 12));
  const where = {};
  if (!(isAdmin(req.user) && q.includeInactive === 'true')) { where.isActive = true; where.category = { isActive: true }; }
  if (q.q) where.OR = [{ name: { contains: String(q.q), mode: 'insensitive' } }, { description: { contains: String(q.q), mode: 'insensitive' } }];
  if (q.category) where.category = { ...(where.category || {}), slug: String(q.category) };
  if (AUDIENCES.includes(q.audience)) where.audience = q.audience;
  if (q.minPrice || q.maxPrice) where.finalPrice = { ...(q.minPrice ? { gte: Number(q.minPrice) } : {}), ...(q.maxPrice ? { lte: Number(q.maxPrice) } : {}) };
  if (q.minDiscount) where.discountPercent = { gte: Number(q.minDiscount) };
  if (q.size) where.sizes = { has: String(q.size) };
  if (q.color) where.colors = { has: String(q.color) };
  if (q.inStock === 'true') where.stock = { gt: 0 };
  if (q.featured === 'true') where.isFeatured = true;
  const orderBy = { price_asc: { finalPrice: 'asc' }, price_desc: { finalPrice: 'desc' }, discount: { discountPercent: 'desc' }, popular: { soldCount: 'desc' } }[q.sort] || { createdAt: 'desc' };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit })
  ]);
  ok(res, { products }, 200, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

export const getOne = asyncH(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include }).catch(() => null);
  if (!p || (!p.isActive && !isAdmin(req.user))) throw new AppError(404, 'NOT_FOUND', 'The requested product could not be found.');
  ok(res, { product: p });
});

async function parse(body, existing) {
  const f = {};
  const d = {};
  const name = String(body.name ?? existing?.name ?? '').trim();
  if (name.length < 2 || name.length > 120) f.name = 'Product name must be 2-120 characters.'; else d.name = name;
  const description = String(body.description ?? existing?.description ?? '').trim();
  if (description.length < 10) f.description = 'Description must be at least 10 characters.'; else d.description = description;
  const audience = body.audience ?? existing?.audience;
  if (!AUDIENCES.includes(audience)) f.audience = 'Please choose Women, Girls or Child Girls.'; else d.audience = audience;
  const categoryId = body.categoryId ?? existing?.categoryId;
  if (!categoryId || !(await prisma.category.findUnique({ where: { id: String(categoryId) } }))) f.categoryId = 'Please select a valid category.'; else d.categoryId = String(categoryId);
  const price = Number(body.price ?? existing?.price);
  if (!isFinite(price) || price <= 0 || price > 10000000) f.price = 'Enter a valid price greater than 0.';
  else d.price = price;
  const type = body.discountType ?? existing?.discountType ?? 'NONE';
  let value = type === 'NONE' ? 0 : Number(body.discountValue ?? existing?.discountValue ?? 0);
  if (!['NONE', 'PERCENTAGE', 'FIXED'].includes(type)) f.discountType = 'Invalid discount type.';
  else if (type === 'PERCENTAGE' && !(value > 0 && value <= 100)) f.discountValue = 'Percentage must be between 0 and 100.';
  else if (type === 'FIXED' && !(value > 0 && value <= price)) f.discountValue = 'Fixed discount cannot exceed the price.';
  else Object.assign(d, { discountType: type, discountValue: value }, price ? computePricing(price, type, value) : {});
  const stock = Number(body.stock ?? existing?.stock ?? 0);
  if (!Number.isInteger(stock) || stock < 0) f.stock = 'Stock must be a whole number, 0 or more.'; else d.stock = stock;
  if (body.sizes !== undefined) d.sizes = list_(body.sizes);
  if (body.colors !== undefined) d.colors = list_(body.colors);
  if (body.isActive !== undefined) d.isActive = bool(body.isActive);
  if (body.isFeatured !== undefined) d.isFeatured = bool(body.isFeatured);
  return { f, d };
}

export const create = asyncH(async (req, res) => {
  const files = req.files || [];
  try {
    verifyImages(files);
    const { f, d } = await parse(req.body);
    throwIfFields(f);
    const product = await prisma.product.create({
      data: { ...d, images: { create: files.map((x, i) => ({ url: urlFor('products', x), position: i })) } }, include
    });
    ok(res, { product }, 201);
  } catch (e) { removeFiles(files); throw e; }
});

export const update = asyncH(async (req, res) => {
  const files = req.files || [];
  try {
    verifyImages(files);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'The requested product could not be found.');
    if (existing.images.length + files.length > 8) throw new AppError(422, 'VALIDATION_ERROR', 'A product can have at most 8 images.', { images: 'Maximum 8 images per product.' });
    const { f, d } = await parse(req.body, existing);
    throwIfFields(f);
    const start = existing.images.length;
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: { ...d, images: { create: files.map((x, i) => ({ url: urlFor('products', x), position: start + i })) } }, include
    });
    ok(res, { product });
  } catch (e) { removeFiles(files); throw e; }
});

export const remove = asyncH(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!p) throw new AppError(404, 'NOT_FOUND', 'The requested product could not be found.');
  await prisma.product.delete({ where: { id: p.id } });
  removeFiles(p.images.map((i) => i.url));
  ok(res, { message: 'Product deleted.' });
});

export const removeImage = asyncH(async (req, res) => {
  const img = await prisma.productImage.findFirst({ where: { id: req.params.imageId, productId: req.params.id } });
  if (!img) throw new AppError(404, 'NOT_FOUND', 'Image not found.');
  await prisma.productImage.delete({ where: { id: img.id } });
  removeFiles([img.url]);
  ok(res, { message: 'Image removed.' });
});
