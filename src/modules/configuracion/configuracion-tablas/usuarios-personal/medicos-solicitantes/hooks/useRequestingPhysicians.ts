import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestingPhysicianService } from '../services/requesting-physicians.service';
import type { RequestingPhysicianFormData } from '../types/requesting-physicians.types';
import { requestingPhysicianKeys } from '../constants/query-keys';

export const useRequestingPhysicians = (locationId?: string) => {
    const queryClient = useQueryClient();

    const { data: physicians, isLoading, error } = useQuery({
        queryKey: requestingPhysicianKeys.list(locationId || 'all'),
        queryFn: () => requestingPhysicianService.getAll(locationId),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: requestingPhysicianService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestingPhysicianKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RequestingPhysicianFormData> }) =>
            requestingPhysicianService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestingPhysicianKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: requestingPhysicianService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestingPhysicianKeys.all });
        },
    });

    return {
        physicians,
        isLoading,
        error,
        createPhysician: createMutation.mutate,
        updatePhysician: updateMutation.mutate,
        deletePhysician: deleteMutation.mutate,
    };
};
