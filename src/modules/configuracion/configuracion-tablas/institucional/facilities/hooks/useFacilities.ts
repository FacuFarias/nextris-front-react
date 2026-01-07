import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesService } from '../services/facilities.service';
import type { FacilityFormData } from '../types/facilities.types';
import { facilitiesKeys } from '../constants/query-keys';

export const useFacilities = () => {
    const queryClient = useQueryClient();

    const { data: facilities, isLoading, error } = useQuery({
        queryKey: facilitiesKeys.all,
        queryFn: facilitiesService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: facilitiesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FacilityFormData> }) =>
            facilitiesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: facilitiesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facilities'] });
        },
    });

    return {
        facilities,
        isLoading,
        error,
        createFacility: createMutation.mutate,
        updateFacility: updateMutation.mutate,
        deleteFacility: deleteMutation.mutate,
    };
};
