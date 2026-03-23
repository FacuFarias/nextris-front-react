import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modulesService } from '../services/modules.service';
import type { SyncFacilityModulesPayload } from '../types/modules.types';

const modulesKeys = {
  byFacility: (facilityId: string) => ['facility-modules', facilityId] as const,
};

export const useModulesByFacility = (facilityId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: modulesKeys.byFacility(facilityId),
    queryFn: () => modulesService.getByFacility(facilityId),
    enabled: Boolean(facilityId),
    staleTime: 5 * 60 * 1000,
  });

  const syncMutation = useMutation({
    mutationFn: (payload: SyncFacilityModulesPayload) => modulesService.syncByFacility(facilityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modulesKeys.byFacility(facilityId) });
    },
  });

  return {
    modules: data?.data ?? [],
    isLoading,
    error,
    syncModules: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
};
