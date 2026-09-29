import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';
import { isEmail, normalizeMobile, isMobile, passwordProblem, throwIfFields, validateRegistration } from '../utils/validators.js';
import { removeFiles, urlFor, verifyImages } from '../middleware/upload.js';
import { signToken } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/mailer.js';

export const publicUser = ({ passwordHash, ...u }) => u;
const OTP_TTL = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hashOtp = (otp) => crypto.createHmac('sha256', config.jwtSecret).update(otp).digest('hex');

export const register = asyncH(async (req, res) => {
  const file = req.file;
  try {
    if (file) verifyImages([file]);
    const { fields, values } = validateRegistration(req.body);
    throwIfFields(fields);
    const [byEmail, byMobile] = await Promise.all([
      prisma.user.findUnique({ where: { email: values.email } }),
      prisma.user.findUnique({ where: { mobileNumber: values.mobileNumber } })
    ]);
    if (byEmail) throw new AppError(409, 'DUPLICATE_EMAIL', 'An account with this email already exists. Please login or use another email.', { email: 'Email already registered.' });
    if (byMobile) throw new AppError(409, 'DUPLICATE_MOBILE', 'This mobile number is already registered.', { mobileNumber: 'Mobile number already registered.' });
    const user = await prisma.user.create({
      data: {
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
        passwordHash: await bcrypt.hash(req.body.password, 12),
        profileImage: file ? urlFor('profiles', file) : null,
        role: 'USER'
      }
    });
    ok(res, { token: signToken(user), user: publicUser(user) }, 201);
  } catch (e) {
    if (file) removeFiles([file]);
    throw e;
  }
});

async function doLogin(req, res, { adminOnly }) {
  const id = String(req.body.identifier ?? req.body.email ?? '').trim();
  const password = req.body.password;
  const fields = {};
  if (!id) fields.identifier = 'Please enter your email or mobile number.';
  if (!password) fields.password = 'Please enter your password.';
  throwIfFields(fields);
  const mobile = normalizeMobile(id);
  const where = isEmail(id.toLowerCase()) ? { email: id.toLowerCase() } : isMobile(mobile) ? { mobileNumber: mobile } : null;
  const user = where && (await prisma.user.findUnique({ where }));
  const good = user && (await bcrypt.compare(String(password), user.passwordHash));
  if (!good) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  if (adminOnly && user.role === 'USER') throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  if (!adminOnly && user.role !== 'USER') throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account has been deactivated. Please contact support.');
  ok(res, { token: signToken(user), user: publicUser(user) });
}
export const login = asyncH((req, res) => doLogin(req, res, { adminOnly: false }));
export const adminLogin = asyncH((req, res) => doLogin(req, res, { adminOnly: true }));
export const logout = (_req, res) => ok(res, { message: 'Logged out successfully.' }); // stateless JWT: client discards token

export const forgotPassword = asyncH(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!isEmail(email)) throw new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', { email: 'Please enter a valid email address.' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const otp = String(crypto.randomInt(100000, 1000000));
    await prisma.passwordResetOTP.updateMany({ where: { userId: user.id, isUsed: false }, data: { isUsed: true } });
    await prisma.passwordResetOTP.create({ data: { userId: user.id, otpHash: hashOtp(otp), expiresAt: new Date(Date.now() + OTP_TTL) } });
    await sendOtpEmail(email, otp);
  }
  // Same response whether or not the account exists (prevents account enumeration).
  ok(res, { message: 'If an account exists for this email, a 6-digit code has been sent. It expires in 5 minutes.' });
});

export const verifyOtp = asyncH(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  if (!isEmail(email)) throw new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', { email: 'Please enter a valid email address.' });
  if (!/^\d{6}$/.test(otp)) throw new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', { otp: 'Enter the 6-digit code.' });
  const user = await prisma.user.findUnique({ where: { email } });
  const rec = user && (await prisma.passwordResetOTP.findFirst({ where: { userId: user.id, isUsed: false }, orderBy: { createdAt: 'desc' } }));
  if (!rec) throw new AppError(400, 'OTP_INVALID', 'Invalid or expired code. Please request a new one.');
  if (rec.expiresAt < new Date()) {
    await prisma.passwordResetOTP.update({ where: { id: rec.id }, data: { isUsed: true } });
    throw new AppError(400, 'OTP_EXPIRED', 'This code has expired. Please request a new one.');
  }
  if (rec.attemptCount >= MAX_ATTEMPTS) {
    await prisma.passwordResetOTP.update({ where: { id: rec.id }, data: { isUsed: true } });
    throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts. Please request a new code.');
  }
  const a = Buffer.from(hashOtp(otp)), b = Buffer.from(rec.otpHash);
  if (!(a.length === b.length && crypto.timingSafeEqual(a, b))) {
    await prisma.passwordResetOTP.update({ where: { id: rec.id }, data: { attemptCount: { increment: 1 } } });
    throw new AppError(400, 'OTP_INVALID', 'Incorrect code. Please check and try again.');
  }
  await prisma.passwordResetOTP.update({ where: { id: rec.id }, data: { isUsed: true } }); // one-time use
  const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, config.jwtSecret, { expiresIn: '10m' });
  ok(res, { resetToken });
});

export const resetPassword = asyncH(async (req, res) => {
  const { resetToken, password, confirmPassword } = req.body;
  let p;
  try { p = jwt.verify(String(resetToken || ''), config.jwtSecret); } catch { p = null; }
  if (!p || p.purpose !== 'reset') throw new AppError(400, 'RESET_TOKEN_INVALID', 'Your reset session has expired. Please start again.');
  const fields = {};
  const pw = passwordProblem(password);
  if (pw) fields.password = pw;
  if (password !== confirmPassword) fields.confirmPassword = 'Passwords do not match.';
  throwIfFields(fields);
  await prisma.user.update({ where: { id: p.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  ok(res, { message: 'Password reset successful. Please login.' });
});
