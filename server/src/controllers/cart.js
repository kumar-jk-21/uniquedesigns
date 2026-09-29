import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';

const MAX_QTY = 10;
const getCart = (userId) => prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

async function view(userId) {
  const cart = await getCart(userId);
  const rows = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
    orderBy: { id: 'asc' }
  });
  let subtotal = 0, total = 0;
  const items = rows.map((r) => {
    const p = r.product;
    const available = p.isActive && p.stock > 0;
    const qty = Math.min(r.quantity, Math.max(p.stock, 0));
    if (available) { subtotal += p.price * qty; total += p.finalPrice * qty; }
    return { id: r.id, quantity: r.quantity, size: r.size, color: r.color, available, maxQuantity: Math.min(p.stock, MAX_QTY),
      lineTotal: available ? Math.round(p.finalPrice * qty * 100) / 100 : 0, product: p };
  });
  const r2 = (n) => Math.round(n * 100) / 100;
  return { items, summary: { subtotal: r2(subtotal), discount: r2(subtotal - total), total: r2(total), count: items.filter((i) => i.available).reduce((n, i) => n + i.quantity, 0) } };
}

const qtyOf = (v) => {
  const q = Number(v);
  if (!Number.isInteger(q) || q < 1) throw new AppError(422, 'VALIDATION_ERROR', 'Quantity must be at least 1.', { quantity: 'Invalid quantity.' });
  return q;
};
const stockErr = (p) => new AppError(409, 'OUT_OF_STOCK', p.stock > 0 ? `Only ${p.stock} unit(s) of "${p.name}" available.` : `"${p.name}" is out of stock.`);

export const get = asyncH(async (req, res) => ok(res, await view(req.user.id)));

export const add = asyncH(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: String(req.body.productId || '') } });
  if (!p || !p.isActive) throw new AppError(404, 'NOT_FOUND', 'The requested product could not be found.');
  const qty = qtyOf(req.body.quantity ?? 1);
  const size = String(req.body.size || ''), color = String(req.body.color || '');
  if (p.sizes.length && !p.sizes.includes(size)) throw new AppError(422, 'VALIDATION_ERROR', 'Please select a size.', { size: 'Please select a size.' });
  if (p.colors.length && !p.colors.includes(color)) throw new AppError(422, 'VALIDATION_ERROR', 'Please select a color.', { color: 'Please select a color.' });
  const cart = await getCart(req.user.id);
  const key = { cartId_productId_size_color: { cartId: cart.id, productId: p.id, size, color } };
  const cur = await prisma.cartItem.findUnique({ where: key });
  const next = (cur?.quantity || 0) + qty;
  if (next > p.stock) throw stockErr(p);
  if (next > MAX_QTY) throw new AppError(409, 'LIMIT', `You can add at most ${MAX_QTY} units of an item.`);
  await prisma.cartItem.upsert({ where: key, update: { quantity: next }, create: { cartId: cart.id, productId: p.id, quantity: qty, size, color } });
  ok(res, await view(req.user.id), 201);
});

export const update = asyncH(async (req, res) => {
  const cart = await getCart(req.user.id);
  const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, cartId: cart.id }, include: { product: true } });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Cart item not found.');
  const qty = qtyOf(req.body.quantity);
  if (qty > item.product.stock) throw stockErr(item.product);
  if (qty > MAX_QTY) throw new AppError(409, 'LIMIT', `You can add at most ${MAX_QTY} units of an item.`);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
  ok(res, await view(req.user.id));
});

export const remove = asyncH(async (req, res) => {
  const cart = await getCart(req.user.id);
  await prisma.cartItem.deleteMany({ where: { id: req.params.itemId, cartId: cart.id } });
  ok(res, await view(req.user.id));
});

// Merge a guest cart (localStorage) after login: revalidates stock, skips unavailable items, no duplicates.
export const merge = asyncH(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  const cart = await getCart(req.user.id);
  const skipped = [];
  for (const it of incoming) {
    const p = await prisma.product.findUnique({ where: { id: String(it.productId || '') } }).catch(() => null);
    const size = String(it.size || ''), color = String(it.color || '');
    if (!p || !p.isActive || p.stock < 1) { skipped.push(p?.name || 'An item'); continue; }
    const key = { cartId_productId_size_color: { cartId: cart.id, productId: p.id, size, color } };
    const cur = await prisma.cartItem.findUnique({ where: key });
    const want = (cur?.quantity || 0) + Math.max(1, parseInt(it.quantity) || 1);
    const qty = Math.min(want, p.stock, MAX_QTY);
    await prisma.cartItem.upsert({ where: key, update: { quantity: qty }, create: { cartId: cart.id, productId: p.id, quantity: qty, size, color } });
  }
  ok(res, { ...(await view(req.user.id)), skipped });
});
