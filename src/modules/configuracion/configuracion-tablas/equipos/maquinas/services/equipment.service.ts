import { api } from '@/lib/api';
import type { Equipment, EquipmentFormData, EquipmentResponse } from '../types/equipment.types';

export const equipmentService = {
    getAll: async (locationId?: string): Promise<EquipmentResponse> => {
        const params = locationId ? { location_id: locationId } : {};
        const response = await api.get('/config/equipment', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Equipment> => {
        const response = await api.get(`/config/equipment/${id}`);
        return response.data;
    },

    create: async (equipmentData: EquipmentFormData): Promise<Equipment> => {
        const response = await api.post('/config/equipment', equipmentData);
        return response.data;
    },

    update: async (id: string, equipmentData: Partial<EquipmentFormData>): Promise<Equipment> => {
        const response = await api.put(`/config/equipment/${id}`, equipmentData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/equipment/${id}`);
    },
};
