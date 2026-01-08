import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiposEstudioService } from '../services/tipos-estudio.service';
import type { TipoEstudioFormData } from '../types/tipos-estudio.types';
import { TipoEstudioKeys } from '../constants/query-keys';

export const useTiposEstudio = () => {
    const queryClient = useQueryClient();

    const { data: tiposEstudio, isLoading, error } = useQuery({
        queryKey: [TipoEstudioKeys.all],
        queryFn: tiposEstudioService.getAll,
        gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché
        staleTime: 10 * 60 * 1000, // 10 minutos - datos considerados frescos
    });

    const createMutation = useMutation({
        mutationFn: tiposEstudioService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-estudio'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TipoEstudioFormData> }) =>
            tiposEstudioService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-estudio'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: tiposEstudioService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-estudio'] });
        },
    });

    return {
        tiposEstudio,
        isLoading,
        error,
        createTipoEstudio: createMutation.mutate,
        updateTipoEstudio: updateMutation.mutate,
        deleteTipoEstudio: deleteMutation.mutate,
    };
};
