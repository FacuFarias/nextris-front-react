import { api } from '@/lib/api';
import type { TipoEstudio, TipoEstudioFormData, TipoEstudioResponse } from '../types/tipos-estudio.types';

export const tiposEstudioService = {
    getAll: async (): Promise<TipoEstudioResponse> => {
        const response = await api.get('/config/study-types');
        return response.data;
    },

    getById: async (id: string): Promise<TipoEstudio> => {
        const response = await api.get(`/config/study-types/${id}`);
        return response.data;
    },

    create: async (tipoData: TipoEstudioFormData): Promise<TipoEstudio> => {
        const response = await api.post('/config/study-types', tipoData);
        return response.data;
    },

    update: async (id: string, tipoData: Partial<TipoEstudioFormData>): Promise<TipoEstudio> => {
        const response = await api.put(`/config/study-types/${id}`, tipoData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/study-types/${id}`);
    },
};
