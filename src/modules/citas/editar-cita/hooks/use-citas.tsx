import { useQuery } from '@tanstack/react-query';
import type { Cita } from '../types/cita.type';
import { getCitas } from '../../service/cita.service';
import type { ApiPaginatedResponse } from '@/types/global.type';
import { citasKeys } from '../../constants/query-keys';

export const useCitas = ({ page, per_page, search }: { page: number, per_page: number, search: string }) => {
    const { data, isLoading, error, refetch } = useQuery<ApiPaginatedResponse<Cita>>({
        queryKey: citasKeys.list(page, per_page, search),
        queryFn: () => getCitas({ page, per_page, search }),
    });

    return {
        citasData: data,
        isLoading,
        error,
        refetchCitas: refetch,
    }
}
