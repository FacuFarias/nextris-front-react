import { useQuery } from "@tanstack/react-query";
import { estudiosService } from "../services/estudios.service";
import type { StudiesFilters } from "../types";

export const useEstudios = (filters: StudiesFilters) => {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["my-studies", filters],
        queryFn: () => estudiosService.getMyStudies(filters),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    return {
        studiesData: data,
        isLoading,
        isError,
        error,
        refetch,
    };
};
