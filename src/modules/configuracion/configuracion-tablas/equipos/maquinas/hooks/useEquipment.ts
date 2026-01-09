import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipment.service';
import type { EquipmentFormData } from '../types/equipment.types';
import { equipmentKeys } from '../constants/query-keys';

export const useEquipment = (locationId?: string) => {
    const queryClient = useQueryClient();

    const { data: equipment, isLoading, error } = useQuery({
        queryKey: equipmentKeys.list(locationId || ''),
        queryFn: () => equipmentService.getAll(locationId),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: equipmentService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentFormData> }) =>
            equipmentService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: equipmentService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
        },
    });

    return {
        equipment,
        isLoading,
        error,
        createEquipment: createMutation.mutate,
        updateEquipment: updateMutation.mutate,
        deleteEquipment: deleteMutation.mutate,
    };
};
