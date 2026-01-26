import { api } from '@/lib/api';
import type { GruposEstudio, GruposEstudioFormData, GruposEstudioResponse } from '../types/grupos-estudio.types';

export const gruposEstudioService = {
    getAll: async (): Promise<GruposEstudioResponse> => {
        const { data } = await api.get('config/study-groups');
        return data;
    },

    getById: async (id: string): Promise<GruposEstudio> => {
        const { data } = await api.get(`config/study-groups/${id}`);
        return data;
    },

    create: async (gruposEstudioData: GruposEstudioFormData): Promise<GruposEstudio> => {
        const { data } = await api.post('config/study-groups', gruposEstudioData);
        return data;
    },

    update: async (id: string, gruposEstudioData: Partial<GruposEstudioFormData>): Promise<GruposEstudio> => {
        const { data } = await api.put(`config/study-groups/${id}`, gruposEstudioData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`config/study-groups/${id}`);
    },
};
