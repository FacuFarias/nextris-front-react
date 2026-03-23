import { api } from '@/lib/api';
import type {
  FacilityModuleChangeLogsResponse,
  FacilityModulesResponse,
  SyncFacilityModulesPayload,
} from '../types/modules.types';

export const modulesService = {
  getByFacility: async (facilityId: string): Promise<FacilityModulesResponse> => {
    const response = await api.get(`/config/facilities/${facilityId}/modules`);
    return response.data;
  },

  syncByFacility: async (facilityId: string, payload: SyncFacilityModulesPayload): Promise<FacilityModulesResponse> => {
    const response = await api.put(`/config/facilities/${facilityId}/modules`, payload);
    return response.data;
  },

  getChangeLogsByFacility: async (
    facilityId: string,
    limit = 100,
  ): Promise<FacilityModuleChangeLogsResponse> => {
    const response = await api.get(`/config/facilities/${facilityId}/module-change-logs`, {
      params: { limit },
    });
    return response.data;
  },
};
