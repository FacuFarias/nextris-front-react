import { api } from '@/lib/api';
import type { InformacionBasica } from '../types/informacion-basica.types';

export const informacionBasicaService = {
    get: async (): Promise<InformacionBasica> => {
        const { data } = await api.get('/configuracion/informacion-basica');
        return data;
    },

    update: async (data: InformacionBasica): Promise<InformacionBasica> => {
        const { data: response } = await api.put('/configuracion/informacion-basica', data);
        return response;
    },
};
