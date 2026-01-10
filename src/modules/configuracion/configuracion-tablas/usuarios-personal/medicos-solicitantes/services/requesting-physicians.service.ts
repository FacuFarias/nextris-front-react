import { api } from '@/lib/api';
import type { RequestingPhysician, RequestingPhysicianFormData, RequestingPhysicianResponse } from '../types/requesting-physicians.types';

export const requestingPhysicianService = {
    getAll: async (locationId?: string): Promise<RequestingPhysicianResponse> => {
        const params = locationId ? { location_id: locationId } : {};
        const response = await api.get('/config/requesting-physicians', { params });
        return response.data;
    },

    getById: async (id: string): Promise<RequestingPhysician> => {
        const response = await api.get(`/config/requesting-physicians/${id}`);
        return response.data;
    },

    create: async (physicianData: RequestingPhysicianFormData): Promise<RequestingPhysician> => {
        const response = await api.post('/config/requesting-physicians', physicianData);
        return response.data;
    },

    update: async (id: string, physicianData: Partial<RequestingPhysicianFormData>): Promise<RequestingPhysician> => {
        const response = await api.put(`/config/requesting-physicians/${id}`, physicianData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/requesting-physicians/${id}`);
    },
};
