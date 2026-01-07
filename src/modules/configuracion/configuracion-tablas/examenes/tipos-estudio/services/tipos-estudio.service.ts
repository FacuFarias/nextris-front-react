import { api } from '@/lib/api';
import type { TipoEstudio, TipoEstudioFormData } from '../types/tipos-estudio.types';

export const tiposEstudioService = {
    getAll: async (): Promise<TipoEstudio[]> => {
        const { data } = await api.get('/tipos-estudio');
        return data;
    },

    getById: async (id: string): Promise<TipoEstudio> => {
        const { data } = await api.get(`/tipos-estudio/${id}`);
        return data;
    },

    create: async (tipoData: TipoEstudioFormData): Promise<TipoEstudio> => {
        const { data } = await api.post('/tipos-estudio', tipoData);
        return data;
    },

    update: async (id: string, tipoData: Partial<TipoEstudioFormData>): Promise<TipoEstudio> => {
        const { data } = await api.put(`/tipos-estudio/${id}`, tipoData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/tipos-estudio/${id}`);
    },
};
