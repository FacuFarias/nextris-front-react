import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obraSocialKeys } from '../constants/query-keys';
import { obraSocialService } from '../services/obra-social.service';
import type { ObraSocialFormData } from '../types/obra-social.types';

export const useObraSocial = () => {
    const queryClient = useQueryClient();

    const { data: obraSocial, isLoading, error } = useQuery({
        queryKey: [obraSocialKeys.all],
        queryFn: obraSocialService.getAll,
        gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché
        staleTime: 10 * 60 * 1000, // 10 minutos - datos considerados frescos
    });

    const createMutation = useMutation({
        mutationFn: obraSocialService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [obraSocialKeys.all] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ObraSocialFormData> }) =>
            obraSocialService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [obraSocialKeys.all] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: obraSocialService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [obraSocialKeys.all] });
        },
    });

    return {
        obraSocial: obraSocial,
        isLoading,
        error,
        createObraSocial: createMutation.mutate,
        updateObraSocial: updateMutation.mutate,
        deleteObraSocial: deleteMutation.mutate,
    };
};
