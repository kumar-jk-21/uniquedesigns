import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AppError } from '../utils/errors.js';

const ROOT = path.resolve('uploads');
const MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const make = (folder, maxFiles) => {
  const dir = path.join(ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_r, file, cb) => cb(null, crypto.randomUUID() + MIME[file.mimetype])
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_r, file, cb) =>
      MIME[file.mimetype]
        ? cb(null, true)
        : cb(new AppError(400, 'INVALID_FILE_TYPE', 'Please upload a JPG, JPEG, PNG, or WebP image.'))
  });
};

export const uploadProfile = make('profiles', 1).single('profileImage');
export const uploadProducts = make('products', 8).array('images', 8);

const sig = (b) =>
  (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ||
  (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') ||
  (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP');

// accepts multer file objects or stored "/uploads/..." urls
export const removeFiles = (files = []) =>
  files.forEach((f) => fs.unlink(typeof f === 'string' ? path.join(ROOT, f.replace(/^\/uploads\//, '')) : f.path, () => {}));

// Verifies the real image signature (not just the client-provided MIME type).
export function verifyImages(files = []) {
  for (const f of files) {
    const fd = fs.openSync(f.path, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (!sig(buf)) {
      removeFiles(files);
      throw new AppError(400, 'INVALID_FILE_TYPE', 'The uploaded file is not a valid image.');
    }
  }
}
export const urlFor = (folder, f) => `/uploads/${folder}/${f.filename}`;
