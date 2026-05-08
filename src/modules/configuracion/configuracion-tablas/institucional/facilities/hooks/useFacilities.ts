import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facilitiesService } from '../services/facilities.service';
import { facilitiesKeys } from '../constants/query-keys';
import type { FacilityFormData } from '../types/facilities.types';

export const useFacilities = () => {
    const queryClient = useQueryClient();
    const { data: facilities, isLoading, error } = useQuery({
        queryKey: facilitiesKeys.all,
        queryFn: facilitiesService.getAll,
        staleTime: 10 * 60 * 1000, // 10 minutos - datos considerados frescos
        gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché
    });

    const { data: plans } = useQuery({
        queryKey: [...facilitiesKeys.all, 'plans'],
        queryFn: facilitiesService.getPlans,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: facilitiesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: facilitiesKeys.all });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FacilityFormData> }) =>
            facilitiesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: facilitiesKeys.all });
        },
    });
    const activateMutation = useMutation({
        mutationFn: facilitiesService.activate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: facilitiesKeys.all });
        },
    });
    const deactivateMutation = useMutation({
        mutationFn: facilitiesService.deactivate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: facilitiesKeys.all });
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
    /*  
 
     const deleteMutation = useMutation({
         mutationFn: facilitiesService.delete,
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['facilities'] });
         },
     }); */
    return {
        facilities,
        plans,
        isLoading,
        error,
        createFacility: createMutation.mutate,
        updateFacility: updateMutation.mutate,
        activateFacility: activateMutation.mutate,
        deactivateFacility: deactivateMutation.mutate,
/*         deleteFacility: deleteMutation.mutate,
 */    };
};
