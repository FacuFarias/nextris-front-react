import { api } from '@/lib/api';
import type {
    User,
    UserFormData,
    UserResponse,
    RolesResponse,
    UserLocationsResponse,
    UserMedicalDataResponse,
    UserMedicalSubmitData,
    PermissionsCatalogResponse,
    UserPermissionsResponse,
} from '../types/users.types';

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

    getLocations: async (userId: string): Promise<UserLocationsResponse> => {
        const response = await api.get(`/config/users/${userId}/locations`);
        return response.data;
    },

    setLocations: async (userId: string, locationIds: string[]): Promise<void> => {
        await api.put(`/config/users/${userId}/locations`, { location_ids: locationIds });
    },

    getMedicalData: async (userId: string): Promise<UserMedicalDataResponse> => {
        const response = await api.get(`/config/users/${userId}/medical-data`);
        return response.data;
    },

    saveMedicalData: async (userId: string, medicalData: UserMedicalSubmitData): Promise<void> => {
        const formData = new FormData();
        formData.append('aclaracion_firma', medicalData.aclaracion_firma);
        formData.append('matricula_nacional', medicalData.matricula_nacional);

        if (medicalData.firma_digital) {
            formData.append('firma_digital', medicalData.firma_digital);
        }

        await api.post(`/config/users/${userId}/medical-data`, formData);
    },

    getPermissionsCatalog: async (): Promise<PermissionsCatalogResponse> => {
        const response = await api.get('/config/permissions');
        return response.data;
    },

    getUserPermissions: async (userId: string): Promise<UserPermissionsResponse> => {
        const response = await api.get(`/config/users/${userId}/permissions`);
        return response.data;
    },

    setUserPermissions: async (userId: string, permissionCodes: string[]): Promise<UserPermissionsResponse> => {
        const response = await api.put(`/config/users/${userId}/permissions`, {
            permission_codes: permissionCodes,
        });
        return response.data;
    },
};

export const roleService = {
    getAll: async (): Promise<RolesResponse> => {
        const response = await api.get('/config/roles');
        return response.data;
    },
};
