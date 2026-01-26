import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gruposEstudioKeys } from '../constants/query-keys';
import { gruposEstudioService } from '../services/grupos-estudio.service';
import type { GruposEstudioFormData } from '../types/grupos-estudio.types';

export const useGrupoEstudio = () => {
    const queryClient = useQueryClient();

    const { data: gruposEstudio, isLoading, error } = useQuery({
        queryKey: gruposEstudioKeys.all,
        queryFn: gruposEstudioService.getAll,
        staleTime: 10 * 60 * 1000, // 10 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
    });

    const createMutation = useMutation({
        mutationFn: gruposEstudioService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gruposEstudioKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<GruposEstudioFormData> }) =>
            gruposEstudioService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gruposEstudioKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: gruposEstudioService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gruposEstudioKeys.all });
        },
    });

    return {
        gruposEstudio,
        isLoading,
        error,
        createGrupoEstudio: createMutation.mutate,
        updateGrupoEstudio: updateMutation.mutate,
        deleteGrupoEstudio: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
