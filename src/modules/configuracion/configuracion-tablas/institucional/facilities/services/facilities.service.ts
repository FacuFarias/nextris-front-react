import { api } from '@/lib/api';
import type { Facility, FacilityFormData } from '../types/facilities.types';

export const facilitiesService = {
    getAll: async (): Promise<Facility[]> => {
        const { data } = await api.get('/institutional/facilities');
        return data;
    },

    getById: async (id: string): Promise<Facility> => {
        const { data } = await api.get(`/institutional/facilities/${id}`);
        return data;
    },

    create: async (facilityData: FacilityFormData): Promise<Facility> => {
        const { data } = await api.post('/institutional/facilities', facilityData);
        return data;
    },

    update: async (id: string, facilityData: Partial<FacilityFormData>): Promise<Facility> => {
        const { data } = await api.put(`/institutional/facilities/${id}`, facilityData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/institutional/facilities/${id}`);
    },
};
