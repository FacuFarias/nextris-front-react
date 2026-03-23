import { api } from '@/lib/api';
import type { Location, LocationFormData, LocationsResponse } from '../types/locations.types';

const buildLocationFormData = (locationData: Partial<LocationFormData>): FormData => {
    const formData = new FormData();

    Object.entries(locationData).forEach(([key, value]) => {
        if (value === undefined || value === null || key === 'logo') {
            return;
        }
        formData.append(key, String(value));
    });

    if (locationData.logo) {
        formData.append('logo', locationData.logo);
    }

    return formData;
};

export const locationsService = {
    getAll: async (includeInactive: boolean = false): Promise<LocationsResponse> => {
        const params = includeInactive ? { include_inactive: true } : {};
        const { data } = await api.get('config/locations', { params });
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
        const payload = locationData.logo ? buildLocationFormData(locationData) : locationData;
        const { data } = await api.put(`config/locations/${id}`, payload);
        return data;
    },

    activate: async (id: string): Promise<void> => {
        await api.post(`config/locations/${id}/activate`);
    },

    deactivate: async (id: string): Promise<void> => {
        await api.post(`config/locations/${id}/deactivate`);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`config/locations/${id}`);
    },
};
