import fs from 'fs';
import { AppError } from './errors.js';

export const locations = JSON.parse(
  fs.readFileSync(new URL('../data/locations.json', import.meta.url), 'utf8')
);

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const normalizeMobile = (v = '') => {
  let s = String(v).replace(/[\s-]/g, '');
  s = s.replace(/^\+91/, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
  return s;
};
export const isMobile = (v) => /^[6-9]\d{9}$/.test(v) && !/^(\d)\1{9}$/.test(v);
export const isPincode = (v) => /^[1-9]\d{5}$/.test(v);
export const passwordProblem = (p = '') =>
  p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)
    ? null
    : 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.';

const s = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateProfileFields(b, { partial = false } = {}) {
  const f = {};
  const out = {};
  const need = (k, msg, test) => {
    if (partial && b[k] === undefined) return;
    const val = s(b[k]);
    if (!val || (test && !test(val))) f[k] = msg;
    else out[k] = val;
  };
  need('fullName', 'Please enter your full name (2-80 letters).', (v) => /^[A-Za-z][A-Za-z .'-]{1,79}$/.test(v));
  if (!(partial && b.mobileNumber === undefined)) {
    const m = normalizeMobile(s(b.mobileNumber));
    if (!isMobile(m)) f.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    else out.mobileNumber = m;
  }
  if (!(partial && b.email === undefined)) {
    const e = s(b.email).toLowerCase();
    if (!isEmail(e)) f.email = 'Please enter a valid email address.';
    else out.email = e;
  }
  need('dateOfBirth', 'Please enter a valid date of birth.', (v) => {
    const d = new Date(v);
    return !isNaN(d) && d < new Date() && d.getFullYear() >= 1900;
  });
  need('doorNumber', 'Door number is required.', (v) => v.length <= 30);
  need('streetName', 'Street name is required.', (v) => v.length <= 120);
  need('address', 'Please enter your address (at least 5 characters).', (v) => v.length >= 5 && v.length <= 300);
  need('state', 'Please select a valid state.', (v) => !!locations[v]);
  need('district', 'Please select a valid district.', () => true);
  need('pincode', 'Pincode must contain exactly 6 digits.', isPincode);
  if (out.state && out.district && !locations[out.state].includes(out.district))
    f.district = 'Selected district does not belong to the selected state.';
  else if (partial && out.district && !out.state) f.state = 'Please select a valid state.';
  return { fields: f, values: out };
}

export function validateRegistration(b) {
  const { fields, values } = validateProfileFields(b);
  const pw = passwordProblem(b.password);
  if (pw) fields.password = pw;
  if (b.password !== b.confirmPassword) fields.confirmPassword = 'Passwords do not match.';
  return { fields, values };
}

export function throwIfFields(fields) {
  if (Object.keys(fields).length)
    throw new AppError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', fields);
}

export function computePricing(price, type, value) {
  price = Number(price);
  value = Number(value || 0);
  let d = 0;
  if (type === 'PERCENTAGE') d = (price * value) / 100;
  else if (type === 'FIXED') d = value;
  d = Math.round(d * 100) / 100;
  const finalPrice = Math.max(0, Math.round((price - d) * 100) / 100);
  return { discountAmount: d, finalPrice, discountPercent: price > 0 ? Math.round((d / price) * 10000) / 100 : 0 };
}

export const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
