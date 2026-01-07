import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsService } from '../services/locations.service';
import type { LocationFormData } from '../types/locations.types';
import { locationsKeys } from '@/constants/query-keys';

export const useLocations = () => {
    const queryClient = useQueryClient();

    const { data: locations, isLoading, error } = useQuery({
        queryKey: locationsKeys.all,
        queryFn: locationsService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: locationsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LocationFormData> }) =>
            locationsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: locationsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });

    return {
        locations,
        isLoading,
        error,
        createLocation: createMutation.mutate,
        updateLocation: updateMutation.mutate,
        deleteLocation: deleteMutation.mutate,
    };
};
