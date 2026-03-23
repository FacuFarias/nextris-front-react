import { useQuery } from '@tanstack/react-query';
import { modulesService } from '../services/modules.service';

const moduleChangeLogsKeys = {
  byFacility: (facilityId: string, limit: number) => ['facility-module-change-logs', facilityId, limit] as const,
};

export const useModuleChangeLogs = (facilityId: string, limit = 100) => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: moduleChangeLogsKeys.byFacility(facilityId, limit),
    queryFn: () => modulesService.getChangeLogsByFacility(facilityId, limit),
    enabled: Boolean(facilityId),
    staleTime: 30 * 1000,
  });

  return {
    logs: data?.data ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
  };
};
