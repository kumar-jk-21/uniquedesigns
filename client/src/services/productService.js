import api from './api.js';
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const saveProduct = (id, formData) => (id ? api.put(`/products/${id}`, formData) : api.post('/products', formData));
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const deleteProductImage = (id, imageId) => api.delete(`/products/${id}/images/${imageId}`);
