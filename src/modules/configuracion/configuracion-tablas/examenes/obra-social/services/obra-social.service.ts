import { api } from '@/lib/api';
import type { ObraSocial, ObraSocialFormData, obraSocialResponse } from '../types/obra-social.types';

export const obraSocialService = {
    getAll: async (): Promise<obraSocialResponse> => {
        const response = await api.get('/config/insurances');
        return response.data;
    },

    getById: async (id: string): Promise<ObraSocial> => {
        const response = await api.get(`/config/insurances/${id}`);
        return response.data;
    },

    create: async (tipoData: ObraSocialFormData): Promise<ObraSocial> => {
        const response = await api.post('/config/insurances', tipoData);
        return response.data;
    },

    update: async (id: string, tipoData: Partial<ObraSocialFormData>): Promise<ObraSocial> => {
        const response = await api.put(`/config/insurances/${id}`, tipoData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/insurances/${id}`);
    },
};
