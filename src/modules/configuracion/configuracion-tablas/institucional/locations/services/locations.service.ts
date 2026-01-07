import { api } from '@/lib/api';
import type { Location, LocationFormData, LocationsResponse } from '../types/locations.types';

export const locationsService = {
    getAll: async (): Promise<LocationsResponse> => {
        const { data } = await api.get('institutional/locations');
        return data;
    },

    getById: async (id: string): Promise<Location> => {
        const { data } = await api.get(`/locations/${id}`);
        return data;
    },

    create: async (locationData: LocationFormData): Promise<Location> => {
        const { data } = await api.post('/locations', locationData);
        return data;
    },

    update: async (id: string, locationData: Partial<LocationFormData>): Promise<Location> => {
        const { data } = await api.put(`/locations/${id}`, locationData);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/locations/${id}`);
    },
};
