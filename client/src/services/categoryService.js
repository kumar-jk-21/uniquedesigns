import api from './api.js';
export const getCategories = (params) => api.get('/categories', { params });
export const createCategory = (name) => api.post('/categories', { name });
export const updateCategory = (id, body) => api.put(`/categories/${id}`, body);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
