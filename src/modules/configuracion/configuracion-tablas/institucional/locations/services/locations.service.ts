import { api } from '@/lib/api';
import type { Location, LocationFormData, LocationsResponse } from '../types/locations.types';

export const locationsService = {
    getAll: async (): Promise<LocationsResponse> => {
        const { data } = await api.get('config/locations');
        return data;
    },

    getById: async (id: string): Promise<Location> => {
        const { data } = await api.get(`config/locations/${id}`);
        return data;
    },

    create: async (locationData: LocationFormData): Promise<Location> => {
        const { data } = await api.post('config/locations', locationData);
        return data;
    },

    update: async (id: string, locationData: Partial<LocationFormData>): Promise<Location> => {
        const { data } = await api.put(`config/locations/${id}`, locationData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`config/locations/${id}`);
    },
};
