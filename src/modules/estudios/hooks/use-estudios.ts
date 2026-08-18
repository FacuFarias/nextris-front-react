import { useQuery } from "@tanstack/react-query";
import { estudiosService } from "../services/estudios.service";
import type { StudiesFilters } from "../types";
import { useAuth } from "@/context/AuthContext";

export const useEstudios = (filters: StudiesFilters) => {
    const { authData } = useAuth();
    const userId = authData?.user?.id ?? "anonymous";

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["my-studies", userId, filters],
        queryFn: () => estudiosService.getMyStudies(filters),
        staleTime: 1000 * 60 * 5,
    });

    return {
        studiesData: data,
        isLoading,
        isError,
        error,
        refetch,
    };
};
