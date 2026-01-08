import { api } from '@/lib/api';
import type { Modalidad, ModalidadesResponse, ModalidadFormData } from '../types/modalidades.types';

export const modalidadesService = {
    getAll: async (): Promise<ModalidadesResponse> => {
        const response = await api.get('/config/modalities');
        return response.data;
    },

    getById: async (id: string): Promise<Modalidad> => {
        const response = await api.get(`/config/modalities/${id}`);
        return response.data;
    },

    create: async (modalidadData: ModalidadFormData): Promise<Modalidad> => {
        const response = await api.post('/config/modalities', modalidadData);
        return response.data;
    },

    update: async (id: string, modalidadData: Partial<ModalidadFormData>): Promise<Modalidad> => {
        const response = await api.put(`/config/modalities/${id}`, modalidadData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/modalities/${id}`);
    },
};
