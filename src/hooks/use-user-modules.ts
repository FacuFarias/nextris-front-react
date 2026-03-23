import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UserModulesData {
  module_codes: string[];
  facility_ids: string[];
  user_facilities_count: number;
  total_facilities: number;
  has_all_facilities: boolean;
}

interface UserModulesResponse {
  success: boolean;
  data: UserModulesData;
}

const userModulesKeys = {
  me: ['user-modules'] as const,
};

export const useUserModules = (enabled = true) => {
  const { data, isLoading, error } = useQuery({
    queryKey: userModulesKeys.me,
    queryFn: async (): Promise<UserModulesData> => {
      const response = await api.get<UserModulesResponse>('/config/me/modules');
      return response.data.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const moduleCodes = data?.module_codes ?? [];

  return {
    moduleCodes,
    moduleCodesSet: new Set(moduleCodes),
    facilityIds: data?.facility_ids ?? [],
    hasAllFacilities: data?.has_all_facilities ?? false,
    isLoading,
    error,
    hasError: Boolean(error),
  };
};
