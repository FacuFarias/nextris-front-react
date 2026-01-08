import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modalidadesService } from '../services/modalidades.service';
import type { ModalidadFormData } from '../types/modalidades.types';
import { ModalidadesKeys } from '../constants/query-keys';

export const useModalidades = () => {
    const queryClient = useQueryClient();

    const { data: modalidades, isLoading, error } = useQuery({
        queryKey: [ModalidadesKeys.all],
        queryFn: modalidadesService.getAll,
        gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché
        staleTime: 10 * 60 * 1000, // 10 minutos - datos considerados frescos
    });

    const createMutation = useMutation({
        mutationFn: modalidadesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modalidades'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ModalidadFormData> }) =>
            modalidadesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modalidades'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: modalidadesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modalidades'] });
        },
    });

    return {
        modalidades,
        isLoading,
        error,
        createModalidad: createMutation.mutate,
        updateModalidad: updateMutation.mutate,
        deleteModalidad: deleteMutation.mutate,
    };
};
