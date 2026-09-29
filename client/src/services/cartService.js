import api from './api.js';
export const getCart = () => api.get('/cart');
export const addToCart = (body) => api.post('/cart', body);
export const updateCartItem = (id, quantity) => api.put(`/cart/${id}`, { quantity });
export const removeCartItem = (id) => api.delete(`/cart/${id}`);
export const mergeCart = (items) => api.post('/cart/merge', { items });
