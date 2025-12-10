import { api } from '@/lib/api';

export const getLocationsInstitutional = async () => {
    try {
        const response = await api.get(`/institutional/locations`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
