import { api } from '@/lib/api';
import type { Facility, FacilityFormData, FacilityResponse } from '../types/facilities.types';

export const facilitiesService = {
    getAll: async (): Promise<FacilityResponse> => {
        const response = await api.get('/config/facilities');
        return response.data;
    },
    create: async (facilityData: FacilityFormData): Promise<Facility> => {
        const { data } = await api.post('/config/facilities', facilityData);
        return data;
    },

    update: async (id: string, facilityData: Partial<FacilityFormData>): Promise<Facility> => {
        const { data } = await api.put(`/config/facilities/${id}`, facilityData);
        return data;
    },
    /*    getById: async (id: string): Promise<Facility> => {
           const { data } = await api.get(`/config/facilities/${id}`);
           return data;
       },
   
     
   
       delete: async (id: string): Promise<void> => {
           await api.delete(`/config/facilities/${id}`);
       }, */
};
