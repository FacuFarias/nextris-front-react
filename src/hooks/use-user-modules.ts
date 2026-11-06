import { DEFAULT_DISABLED_MODULES } from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface UserModulesData {
  module_codes: string[];
  disabled_modules: string[];
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
  me: (userId: string) => ['user-modules', userId] as const,
};

export const useUserModules = (enabled = true) => {
  const { authData } = useAuth();
  const userId = authData?.user?.id ?? 'anonymous';

  const { data, isLoading, error } = useQuery({
    queryKey: userModulesKeys.me(userId),
    queryFn: async (): Promise<UserModulesData> => {
      const response = await api.get<UserModulesResponse>('/config/me/modules');
      return response.data.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const disabledModules = data?.disabled_modules ?? DEFAULT_DISABLED_MODULES;
  const moduleCodes = (data?.module_codes ?? []).filter((code) => !disabledModules.includes(code));

  return {
    disabledModules,
    disabledModulesSet: new Set(disabledModules),
    moduleCodes,
    moduleCodesSet: new Set(moduleCodes),
    facilityIds: data?.facility_ids ?? [],
    hasAllFacilities: data?.has_all_facilities ?? false,
    isLoading,
    error,
    hasError: Boolean(error),
  };
};
