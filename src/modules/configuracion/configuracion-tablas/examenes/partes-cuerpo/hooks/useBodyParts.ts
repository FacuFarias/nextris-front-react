import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bodyPartsService } from '../services/body-parts.service';
import type { BodyPartFormData } from '../types/body-parts.types';
import { bodyPartsKeys } from '../constants/query-keys';

export const useBodyParts = () => {
    const queryClient = useQueryClient();

    const { data: bodyParts, isLoading, error } = useQuery({
        queryKey: bodyPartsKeys.all,
        queryFn: bodyPartsService.getAll,
        staleTime: 10 * 60 * 1000, // 10 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
    });

    const createMutation = useMutation({
        mutationFn: bodyPartsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bodyPartsKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BodyPartFormData> }) =>
            bodyPartsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bodyPartsKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: bodyPartsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bodyPartsKeys.all });
        },
    });

    return {
        bodyParts,
        isLoading,
        error,
        createBodyPart: createMutation.mutate,
        updateBodyPart: updateMutation.mutate,
        deleteBodyPart: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
