import { api } from '@/lib/api';
import type { InformacionBasica, InformacionBasicaFormData } from '../types/informacion-basica.types';

export const informacionBasicaService = {
    get: async (): Promise<InformacionBasica | null> => {
        const { data } = await api.get('/institutional/info');
        return data.data;
    },

    update: async (locationId: string, formData: InformacionBasicaFormData) => {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('mail', formData.mail);
        payload.append('address', formData.address);
        payload.append('phone', formData.phone);
        if (formData.logo) payload.append('logo', formData.logo);

        const { data: response } = await api.put(`/institutional/info/${locationId}`, payload);
        return response.data;
    },
};
