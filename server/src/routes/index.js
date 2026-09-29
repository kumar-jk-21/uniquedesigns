import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { uploadProducts, uploadProfile } from '../middleware/upload.js';
import * as auth from '../controllers/auth.js';
import * as users from '../controllers/users.js';
import * as cats from '../controllers/categories.js';
import * as prods from '../controllers/products.js';
import * as wl from '../controllers/wishlist.js';
import * as cart from '../controllers/cart.js';
import * as admin from '../controllers/admin.js';

const limiter = (max, minutes = 15) =>
  rateLimit({ windowMs: minutes * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
    handler: (_q, res) => res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a while and try again.' } }) });

const r = Router();
const ADMINS = ['ADMIN', 'SUPER_ADMIN'];

// Auth
r.post('/auth/register', limiter(20), uploadProfile, auth.register);
r.post('/auth/login', limiter(20), auth.login);
r.post('/auth/admin-login', limiter(20), auth.adminLogin);
r.post('/auth/logout', auth.logout);
r.post('/auth/forgot-password', limiter(5), auth.forgotPassword);
r.post('/auth/verify-otp', limiter(15), auth.verifyOtp);
r.post('/auth/reset-password', limiter(10), auth.resetPassword);

// User
r.get('/users/profile', authenticate, users.getProfile);
r.put('/users/profile', authenticate, users.updateProfile);
r.put('/users/change-password', authenticate, users.changePassword);
r.post('/users/profile-image', authenticate, uploadProfile, users.updateProfileImage);

// Categories
r.get('/categories', optionalAuth, cats.list);
r.post('/categories', authenticate, authorize(...ADMINS), cats.create);
r.put('/categories/:id', authenticate, authorize(...ADMINS), cats.update);
r.delete('/categories/:id', authenticate, authorize(...ADMINS), cats.remove);

// Products
r.get('/products', optionalAuth, prods.list);
r.get('/products/:id', optionalAuth, prods.getOne);
r.post('/products', authenticate, authorize(...ADMINS), uploadProducts, prods.create);
r.put('/products/:id', authenticate, authorize(...ADMINS), uploadProducts, prods.update);
r.delete('/products/:id', authenticate, authorize(...ADMINS), prods.remove);
r.delete('/products/:id/images/:imageId', authenticate, authorize(...ADMINS), prods.removeImage);

// Wishlist & Cart (logged-in users)
r.get('/wishlist', authenticate, wl.get);
r.post('/wishlist', authenticate, wl.add);
r.delete('/wishlist/:productId', authenticate, wl.remove);
r.get('/cart', authenticate, cart.get);
r.post('/cart', authenticate, cart.add);
r.post('/cart/merge', authenticate, cart.merge);
r.put('/cart/:itemId', authenticate, cart.update);
r.delete('/cart/:itemId', authenticate, cart.remove);

// Admin
r.get('/admin/dashboard', authenticate, authorize(...ADMINS), admin.dashboard);
r.get('/admin/users', authenticate, authorize(...ADMINS), admin.users);
r.put('/admin/users/:id/status', authenticate, authorize(...ADMINS), admin.userStatus);
r.get('/admin/admins', authenticate, authorize('SUPER_ADMIN'), admin.admins);
r.post('/admin/create-admin', authenticate, authorize('SUPER_ADMIN'), admin.createAdmin);
r.put('/admin/admins/:id/status', authenticate, authorize('SUPER_ADMIN'), admin.adminStatus);

export default r;
