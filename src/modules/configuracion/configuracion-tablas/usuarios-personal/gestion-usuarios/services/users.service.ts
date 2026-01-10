import { api } from '@/lib/api';
import type { User, UserFormData, UserResponse, RolesResponse } from '../types/users.types';

export const userService = {
    getAll: async (includeInactive: boolean = false): Promise<UserResponse> => {
        const params = includeInactive ? { include_inactive: true } : {};
        const response = await api.get('/config/users', { params });
        return response.data;
    },

    getById: async (id: string): Promise<User> => {
        const response = await api.get(`/config/users/${id}`);
        return response.data;
    },

    create: async (userData: UserFormData): Promise<User> => {
        const response = await api.post('/config/users', userData);
        return response.data;
    },

    update: async (id: string, userData: Partial<UserFormData>): Promise<User> => {
        const response = await api.put(`/config/users/${id}`, userData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/users/${id}`);
    },

    activate: async (id: string): Promise<void> => {
        await api.post(`/config/users/${id}/activate`);
    },

    deactivate: async (id: string): Promise<void> => {
        await api.post(`/config/users/${id}/deactivate`);
    },

    resetPassword: async (id: string, newPassword: string): Promise<void> => {
        await api.post(`/config/users/${id}/reset-password`, { new_password: newPassword });
    },
};

export const roleService = {
    getAll: async (): Promise<RolesResponse> => {
        const response = await api.get('/config/roles');
        return response.data;
    },
};
