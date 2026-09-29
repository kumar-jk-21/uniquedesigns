import bcrypt from 'bcrypt';
import { prisma } from '../config/index.js';
import { AppError, asyncH, ok } from '../utils/errors.js';
import { passwordProblem, throwIfFields, validateProfileFields } from '../utils/validators.js';
import { removeFiles, urlFor, verifyImages } from '../middleware/upload.js';
import { publicUser } from './auth.js';

export const getProfile = (req, res) => ok(res, { user: publicUser(req.user) });

export const updateProfile = asyncH(async (req, res) => {
  const { fields, values } = validateProfileFields(req.body, { partial: true });
  throwIfFields(fields);
  if (values.dateOfBirth) values.dateOfBirth = new Date(values.dateOfBirth);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: values });
  ok(res, { user: publicUser(user) });
});

export const changePassword = asyncH(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const fields = {};
  if (!(await bcrypt.compare(String(currentPassword || ''), req.user.passwordHash))) fields.currentPassword = 'Current password is incorrect.';
  const pw = passwordProblem(newPassword);
  if (pw) fields.newPassword = pw;
  if (newPassword !== confirmPassword) fields.confirmPassword = 'Passwords do not match.';
  throwIfFields(fields);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  ok(res, { message: 'Password updated successfully.' });
});

export const updateProfileImage = asyncH(async (req, res) => {
  if (!req.file) throw new AppError(422, 'VALIDATION_ERROR', 'Please select an image.', { profileImage: 'Please select an image.' });
  verifyImages([req.file]);
  const old = req.user.profileImage;
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { profileImage: urlFor('profiles', req.file) } });
  if (old) removeFiles([old]);
  ok(res, { user: publicUser(user) });
});
