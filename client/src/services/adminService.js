import api from './api.js';
export const getDashboard = () => api.get('/admin/dashboard');
export const getUsers = (params) => api.get('/admin/users', { params });
export const setUserStatus = (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive });
export const getAdmins = (params) => api.get('/admin/admins', { params });
export const createAdmin = (body) => api.post('/admin/create-admin', body);
export const setAdminStatus = (id, isActive) => api.put(`/admin/admins/${id}/status`, { isActive });
