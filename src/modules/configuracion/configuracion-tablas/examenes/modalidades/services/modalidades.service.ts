import { api } from '@/lib/api';
import type { Modalidad, ModalidadFormData } from '../types/modalidades.types';

export const modalidadesService = {
    getAll: async (): Promise<Modalidad[]> => {
        const { data } = await api.get('/modalidades');
        return data;
    },

    getById: async (id: string): Promise<Modalidad> => {
        const { data } = await api.get(`/modalidades/${id}`);
        return data;
    },

    create: async (modalidadData: ModalidadFormData): Promise<Modalidad> => {
        const { data } = await api.post('/modalidades', modalidadData);
        return data;
    },

    update: async (id: string, modalidadData: Partial<ModalidadFormData>): Promise<Modalidad> => {
        const { data } = await api.put(`/modalidades/${id}`, modalidadData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/modalidades/${id}`);
    },
};
