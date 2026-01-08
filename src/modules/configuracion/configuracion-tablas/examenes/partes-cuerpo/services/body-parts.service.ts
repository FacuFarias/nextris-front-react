import { api } from '@/lib/api';
import type { BodyPart, BodyPartFormData, BodyPartsResponse } from '../types/body-parts.types';

export const bodyPartsService = {
    getAll: async (): Promise<BodyPartsResponse> => {
        const { data } = await api.get('config/body-parts');
        return data;
    },

    getById: async (id: string): Promise<BodyPart> => {
        const { data } = await api.get(`config/body-parts/${id}`);
        return data;
    },

    create: async (bodyPartData: BodyPartFormData): Promise<BodyPart> => {
        const { data } = await api.post('config/body-parts', bodyPartData);
        return data;
    },

    update: async (id: string, bodyPartData: Partial<BodyPartFormData>): Promise<BodyPart> => {
        const { data } = await api.put(`config/body-parts/${id}`, bodyPartData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`config/body-parts/${id}`);
    },
};
