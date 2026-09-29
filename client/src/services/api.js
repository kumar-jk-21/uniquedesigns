import axios from 'axios';
import { toUserError } from '../utils/errorHandler.js';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';
export const TOKEN_KEY = 'ud_token';
export const imgUrl = (u) => (u ? (u.startsWith('http') ? u : SERVER_URL + u) : null);

const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api', timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res.data, // { success, data, meta? }
  (err) => {
    const e = toUserError(err);
    const auth = err.config?.url?.includes('/auth/');
    if (e.status === 401 && !auth && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('ud:unauthorized', { detail: e }));
    }
    return Promise.reject(e);
  }
);
export default api;
