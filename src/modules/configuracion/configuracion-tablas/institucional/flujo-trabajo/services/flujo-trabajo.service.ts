import { api } from '@/lib/api';
import type { FlujoTrabajoConfig } from '../types/flujo-trabajo.types';

export const flujoTrabajoService = {
    get: async (): Promise<FlujoTrabajoConfig> => {
        const { data } = await api.get<{ data: FlujoTrabajoConfig }>('/config/workflow');
        return data.data;
    },

    update: async (config: FlujoTrabajoConfig): Promise<FlujoTrabajoConfig> => {
        const { data } = await api.put<{ data: FlujoTrabajoConfig }>('/config/workflow', config);
        return data.data;
    },
};
