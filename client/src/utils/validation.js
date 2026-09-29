import locations from '../data/locations.json';

export const STATES = Object.keys(locations).sort();
export const districtsOf = (state) => (state && locations[state] ? locations[state] : []);

export const passwordRules = [
  { key: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'num', label: 'One number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) }
];
export const passwordScore = (p) => passwordRules.filter((r) => r.test(p)).length;
export const PASSWORD_MSG = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.';

export const normalizeMobile = (v = '') => v.replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0(?=\d{10}$)/, '');
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Returns an error message string ('' when valid) for one field.
export function validateField(name, v, all = {}) {
  const s = typeof v === 'string' ? v.trim() : v;
  switch (name) {
    case 'fullName': return /^[A-Za-z][A-Za-z .'-]{1,79}$/.test(s || '') ? '' : 'Please enter your full name (letters only, 2-80 characters).';
    case 'mobileNumber': { const m = normalizeMobile(s || ''); return /^[6-9]\d{9}$/.test(m) && !/^(\d)\1{9}$/.test(m) ? '' : 'Please enter a valid 10-digit mobile number.'; }
    case 'email': return isEmail((s || '').toLowerCase()) ? '' : 'Please enter a valid email address.';
    case 'dateOfBirth': { const d = new Date(s); return s && !isNaN(d) && d < new Date() && d.getFullYear() >= 1900 ? '' : 'Please enter a valid date of birth.'; }
    case 'doorNumber': return s ? '' : 'Door number is required.';
    case 'streetName': return s ? '' : 'Street name is required.';
    case 'address': return (s || '').length >= 5 ? '' : 'Please enter your address (at least 5 characters).';
    case 'state': return locations[s] ? '' : 'Please select a state.';
    case 'district': return s && locations[all.state]?.includes(s) ? '' : 'Please select a district.';
    case 'pincode': return /^[1-9]\d{5}$/.test(s || '') ? '' : 'Pincode must contain exactly 6 digits.';
    case 'password': return passwordScore(v || '') === 5 ? '' : PASSWORD_MSG;
    case 'confirmPassword': return v && v === all.password ? '' : 'Passwords do not match.';
    default: return '';
  }
}

export function validateImage(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return resolve('Profile image must be JPG, JPEG, PNG, or WebP and less than 5 MB.');
    if (file.size > 5 * 1024 * 1024) return resolve('The selected image is too large. Maximum allowed size is 5 MB.');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.width < 100 || img.height < 100 ? 'Image must be at least 100 × 100 pixels.' : ''); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve('This file is not a valid image.'); };
    img.src = url;
  });
}

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
