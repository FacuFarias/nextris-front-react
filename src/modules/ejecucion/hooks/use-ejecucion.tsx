import type { EjecucionResponse } from '../types/ejecucion.type';
import { getEjecucion } from '../services/ejecucion.service';
import { useQuery } from '@tanstack/react-query';
import { ejecucionKeys } from '../constants/query-keys';

export const useEjecucion = () => {
    const { data, isLoading, error, refetch } = useQuery<EjecucionResponse>({
        queryKey: ejecucionKeys.lists(),
        queryFn: () => getEjecucion(),
    });

    return {
        ejecucionData: data,
        isLoading,
        error,
        refetchEjecucion: refetch,
    }
}