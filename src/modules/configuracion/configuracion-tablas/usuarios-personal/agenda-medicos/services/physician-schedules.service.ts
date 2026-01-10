import { api } from '@/lib/api';
import type { PhysicianSchedule, PhysicianScheduleFormData, PhysicianScheduleResponse } from '../types/physician-schedules.types';

export const physicianScheduleService = {
    getAll: async (physicianId?: string, locationId?: string): Promise<PhysicianScheduleResponse> => {
        const params: any = {};
        if (physicianId) params.physician_id = physicianId;
        if (locationId) params.location_id = locationId;
        const response = await api.get('/config/physician-schedules', { params });
        return response.data;
    },

    create: async (scheduleData: PhysicianScheduleFormData): Promise<PhysicianSchedule> => {
        const response = await api.post('/config/physician-schedules', scheduleData);
        return response.data;
    },

    update: async (id: string, scheduleData: Partial<PhysicianScheduleFormData>): Promise<PhysicianSchedule> => {
        const response = await api.put(`/config/physician-schedules/${id}`, scheduleData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/physician-schedules/${id}`);
    },
};
