import { api } from '@/lib/api';
import type { EquipmentSchedule, EquipmentScheduleFormData, EquipmentScheduleResponse } from '../types/equipment-schedules.types';

export const equipmentScheduleService = {
    getAll: async (equipmentId?: string): Promise<EquipmentScheduleResponse> => {
        const params = equipmentId ? { equipment_id: equipmentId } : {};
        const response = await api.get('/config/equipment-schedules', { params });
        return response.data;
    },

    getById: async (id: string): Promise<EquipmentSchedule> => {
        const response = await api.get(`/config/equipment-schedules/${id}`);
        return response.data;
    },

    create: async (scheduleData: EquipmentScheduleFormData): Promise<EquipmentSchedule> => {
        const response = await api.post('/config/equipment-schedules', scheduleData);
        return response.data;
    },

    update: async (id: string, scheduleData: Partial<EquipmentScheduleFormData>): Promise<EquipmentSchedule> => {
        const response = await api.put(`/config/equipment-schedules/${id}`, scheduleData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/equipment-schedules/${id}`);
    },
};
