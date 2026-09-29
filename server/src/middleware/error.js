import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export const notFound = (req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', 'The requested resource could not be found.'));

export function errorHandler(err, req, res, _next) {
  let status = 500, code = 'SERVER_ERROR', message = 'Unable to process your request at this time.', fields;

  if (err instanceof AppError) ({ status, code, message, fields } = err);
  else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400; code = 'FILE_TOO_LARGE'; message = 'The selected image is too large. Maximum allowed size is 5 MB.';
  } else if (err.name === 'MulterError') {
    status = 400; code = 'UPLOAD_ERROR'; message = 'Too many files or unexpected file field.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'BAD_REQUEST'; message = 'The request could not be understood.';
  } else if (err.name === 'PrismaClientInitializationError' || ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(err.code)) {
    status = 503; code = 'DATABASE_UNAVAILABLE';
    message = 'We are temporarily unable to access the database. Please try again later.';
  } else if (err.code === 'P2002') {
    const t = String(err.meta?.target || '');
    status = 409;
    if (t.includes('email')) { code = 'DUPLICATE_EMAIL'; message = 'An account with this email already exists. Please login or use another email.'; fields = { email: 'Email already registered.' }; }
    else if (t.includes('mobile')) { code = 'DUPLICATE_MOBILE'; message = 'This mobile number is already registered.'; fields = { mobileNumber: 'Mobile number already registered.' }; }
    else { code = 'DUPLICATE'; message = 'This record already exists.'; }
  } else if (err.code === 'P2025') {
    status = 404; code = 'NOT_FOUND'; message = 'The requested record could not be found.';
  } else if (err.code === 'P2003') {
    status = 409; code = 'CONFLICT'; message = 'This action conflicts with related records.';
  }

  if (status >= 500) console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, config.isProd ? err.message : err);
  res.status(status).json({ success: false, error: { code, message, ...(fields ? { fields } : {}) } });
}
