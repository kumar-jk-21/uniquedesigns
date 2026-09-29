import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';

const productInc = { include: { images: { orderBy: { position: 'asc' }, take: 1 }, category: { select: { name: true, slug: true } } } };
const getWl = (userId) => prisma.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });

export const get = asyncH(async (req, res) => {
  const wl = await getWl(req.user.id);
  const items = await prisma.wishlistItem.findMany({ where: { wishlistId: wl.id }, include: { product: productInc }, orderBy: { createdAt: 'desc' } });
  ok(res, { items: items.filter((i) => i.product.isActive).map((i) => ({ id: i.id, product: i.product })) });
});

export const add = asyncH(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: String(req.body.productId || '') } });
  if (!p || !p.isActive) throw new AppError(404, 'NOT_FOUND', 'The requested product could not be found.');
  const wl = await getWl(req.user.id);
  await prisma.wishlistItem.upsert({ where: { wishlistId_productId: { wishlistId: wl.id, productId: p.id } }, update: {}, create: { wishlistId: wl.id, productId: p.id } });
  ok(res, { message: 'Added to wishlist.' }, 201);
});

export const remove = asyncH(async (req, res) => {
  const wl = await getWl(req.user.id);
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wl.id, productId: req.params.productId } });
  ok(res, { message: 'Removed from wishlist.' });
});
